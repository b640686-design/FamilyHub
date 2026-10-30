
import { useEffect, useState, useCallback } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import './FamilyPages.css'

const DEFAULT_POSITION = [41.2995, 69.2401]

function createAvatarIcon(profile) {
  const name = profile?.display_name || '?'
  const avatar = profile?.avatar_url

  const content = avatar
    ? `<img src="${avatar}" class="map-marker-avatar" />`
    : `<div class="map-marker-avatar map-marker-letter">${name.charAt(0).toUpperCase()}</div>`

  return L.divIcon({
    className: 'family-map-marker',
    html: content,
    iconSize: [46, 46],
    iconAnchor: [23, 23]
  })
}

function MapUpdater({ position }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1 })
    }
  }, [position, map])

  return null
}

export default function FamilyMap() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [myPosition, setMyPosition] = useState(null)
  const [error, setError] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [accuracy, setAccuracy] = useState(null)

  const loadMembers = useCallback(async () => {
    try {
      const { data: userData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !userData?.user) {
        setError('Необходимо войти в аккаунт')
        setLoading(false)
        return
      }

      const user = userData.user

      const { data: memberships, error: groupError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      if (groupError) throw groupError

      if (!memberships?.length) {
        setMembers([])
        setLoading(false)
        return
      }

      const groupIds = [
        ...new Set(memberships.map(item => item.group_id))
      ]

      const { data: locations, error: locationError } = await supabase
        .from('family_locations')
        .select('*')
        .in('group_id', groupIds)
        .eq('is_sharing', true)
        .gt('expires_at', new Date().toISOString())

      if (locationError) throw locationError

      const userIds = [
        ...new Set((locations || []).map(item => item.user_id))
      ]

      if (!userIds.length) {
        setMembers([])
        setLoading(false)
        return
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds)

      if (profileError) throw profileError

      const profileMap = Object.fromEntries(
        (profiles || []).map(profile => [profile.id, profile])
      )

      const enrichedMembers = (locations || []).map(location => ({
        ...location,
        profile: profileMap[location.user_id]
      }))

      setMembers(enrichedMembers)

      const myLocation = enrichedMembers.find(
        member => member.user_id === user.id
      )

      setSharing(Boolean(myLocation))

      setMyPosition(
        myLocation
          ? [myLocation.latitude, myLocation.longitude]
          : null
      )

      setLoading(false)
      setError('')
    } catch (err) {
      setError(err.message || 'Ошибка загрузки карты')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMembers()

    const channel = supabase
      .channel('family-map-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_locations'
        },
        () => loadMembers()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadMembers])

  async function startSharing(minutes) {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается браузером')
      return
    }

    setError('Запрашиваем разрешение на геолокацию...')

    try {
      const permission = await navigator.permissions.query({
        name: 'geolocation'
      })

      if (permission.state === 'denied') {
        setError(
          'Доступ запрещён. Разреши геолокацию в настройках Chrome.'
        )
        return
      }
    } catch {
      // Проверка разрешений может не поддерживаться браузером
    }

    navigator.geolocation.getCurrentPosition(
      async position => {
        console.log('Широта:', position.coords.latitude)
        console.log('Долгота:', position.coords.longitude)
        console.log(
          'Точность:',
          position.coords.accuracy,
          'метров'
        )

        setAccuracy(position.coords.accuracy)

        try {
          const { data: userData } = await supabase.auth.getUser()
          const user = userData?.user

          if (!user) {
            setError('Сначала войди в аккаунт')
            return
          }

          const { data: memberships, error: groupError } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', user.id)

          if (groupError) throw groupError

          if (!memberships?.length) {
            setError('Сначала вступи в семейную группу')
            return
          }

          const latitude = position.coords.latitude
          const longitude = position.coords.longitude

          const expiresAt = new Date(
            Date.now() + minutes * 60 * 1000
          ).toISOString()

          const rows = memberships.map(group => ({
            user_id: user.id,
            group_id: group.group_id,
            latitude,
            longitude,
            is_sharing: true,
            expires_at: expiresAt,
            updated_at: new Date().toISOString()
          }))

          const { error: saveError } = await supabase
            .from('family_locations')
            .upsert(rows, {
              onConflict: 'user_id,group_id'
            })

          if (saveError) throw saveError

          setMyPosition([latitude, longitude])
          setSharing(true)

          await loadMembers()
        } catch (err) {
          setError(err.message || 'Ошибка сохранения координат')
        }
      },

      geoError => {
        if (geoError.code === 1) {
          setError('Ты запретил доступ к местоположению')
        } else if (geoError.code === 2) {
          setError('Не удалось определить местоположение')
        } else {
          setError('Время ожидания геолокации истекло')
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    )
  }

  async function stopSharing() {
    setError('')

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    if (!user) return

    const { error: stopError } = await supabase
      .from('family_locations')
      .update({
        is_sharing: false,
        expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (stopError) {
      setError(stopError.message)
      return
    }

    setSharing(false)
    setMyPosition(null)
    setSelectedMember(null)
    setAccuracy(null)

    await loadMembers()
  }

  function formatDate(date) {
    if (!date) return 'Неизвестно'

    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="family-page family-map-page">

      <div className="family-page-header">
        <div>
          <span className="family-page-label">FAMILY HUB</span>
          <h1 className="page-title">Family Map 🗺️</h1>
          <p className="page-description">
            Местоположение участников твоей семьи
          </p>
        </div>
      </div>

      <div className="family-map-controls">
        <div>
          <h3>Моя геолокация</h3>
          <p>
            {sharing
              ? 'Твоя геолокация передаётся'
              : 'Передача геолокации выключена'}
          </p>

          {accuracy !== null && (
            <p>
              Точность определения: примерно {Math.round(accuracy)} м
            </p>
          )}
        </div>

        <div className="family-map-actions">
          {!sharing ? (
            <>
              <button
                className="family-primary-btn"
                onClick={() => startSharing(15)}
              >
                15 минут
              </button>

              <button
                className="family-primary-btn"
                onClick={() => startSharing(60)}
              >
                1 час
              </button>

              <button
                className="family-primary-btn"
                onClick={() => startSharing(480)}
              >
                8 часов
              </button>
            </>
          ) : (
            <button
              className="family-secondary-btn"
              onClick={stopSharing}
            >
              Остановить передачу
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="family-map-error">
          {error}
        </div>
      )}

      <div className="family-map-layout">

        <div className="family-map-card">
          {loading ? (
            <div className="family-map-loading">
              Загружаем карту...
            </div>
          ) : (
            <MapContainer
              center={myPosition || DEFAULT_POSITION}
              zoom={12}
              scrollWheelZoom={true}
              className="family-map-container"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {myPosition && (
                <MapUpdater position={myPosition} />
              )}

              {members.map(member => (
                <Marker
                  key={member.id}
                  position={[
                    member.latitude,
                    member.longitude
                  ]}
                  icon={createAvatarIcon(member.profile)}
                  eventHandlers={{
                    click: () => setSelectedMember(member)
                  }}
                >
                  <Popup>
                    <strong>
                      {member.profile?.display_name || 'Участник семьи'}
                    </strong>
                    <p>
                      Обновлено: {formatDate(member.updated_at)}
                    </p>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        <div className="family-map-members">
          <h3>Участники на карте</h3>

          {members.length === 0 ? (
            <div className="family-map-empty">
              <span>📍</span>
              <p>Пока никто не делится геолокацией</p>
            </div>
          ) : (
            members.map(member => (
              <div
                className={`family-map-member ${
                  selectedMember?.id === member.id ? 'selected' : ''
                }`}
                key={member.id}
              >
                {member.profile?.avatar_url ? (
                  <img
                    src={member.profile.avatar_url}
                    className="map-member-avatar"
                    alt=""
                  />
                ) : (
                  <div className="map-member-avatar map-member-letter">
                    {(member.profile?.display_name || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div className="family-map-member-info">
                  <strong>
                    {member.profile?.display_name || 'Участник семьи'}
                  </strong>
                  <p>Геолокация активна</p>
                  <small>
                    {formatDate(member.updated_at)}
                  </small>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
