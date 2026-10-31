
// import { useEffect, useState, useCallback } from 'react'
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   useMap
// } from 'react-leaflet'
// import L from 'leaflet'
// import { supabase } from '../lib/supabase'
// import './FamilyPages.css'

// const DEFAULT_POSITION = [41.2995, 69.2401]

// function createAvatarIcon(profile) {
//   const name = profile?.display_name || '?'
//   const avatar = profile?.avatar_url

//   const content = avatar
//     ? `<img src="${avatar}" class="map-marker-avatar" />`
//     : `<div class="map-marker-avatar map-marker-letter">${name.charAt(0).toUpperCase()}</div>`

//   return L.divIcon({
//     className: 'family-map-marker',
//     html: content,
//     iconSize: [46, 46],
//     iconAnchor: [23, 23]
//   })
// }

// function MapUpdater({ position }) {
//   const map = useMap()

//   useEffect(() => {
//     if (position) {
//       map.flyTo(position, 16, { duration: 1 })
//     }
//   }, [position, map])

//   return null
// }

// export default function FamilyMap() {
//   const [members, setMembers] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [sharing, setSharing] = useState(false)
//   const [myPosition, setMyPosition] = useState(null)
//   const [error, setError] = useState('')
//   const [selectedMember, setSelectedMember] = useState(null)
//   const [accuracy, setAccuracy] = useState(null)

//   const loadMembers = useCallback(async () => {
//     try {
//       const { data: userData, error: authError } =
//         await supabase.auth.getUser()

//       if (authError || !userData?.user) {
//         setError('Необходимо войти в аккаунт')
//         setLoading(false)
//         return
//       }

//       const user = userData.user

//       const { data: memberships, error: groupError } = await supabase
//         .from('group_members')
//         .select('group_id')
//         .eq('user_id', user.id)

//       if (groupError) throw groupError

//       if (!memberships?.length) {
//         setMembers([])
//         setLoading(false)
//         return
//       }

//       const groupIds = [
//         ...new Set(memberships.map(item => item.group_id))
//       ]

//       const { data: locations, error: locationError } = await supabase
//         .from('family_locations')
//         .select('*')
//         .in('group_id', groupIds)
//         .eq('is_sharing', true)
//         .gt('expires_at', new Date().toISOString())

//       if (locationError) throw locationError

//       const userIds = [
//         ...new Set((locations || []).map(item => item.user_id))
//       ]

//       if (!userIds.length) {
//         setMembers([])
//         setLoading(false)
//         return
//       }

//       const { data: profiles, error: profileError } = await supabase
//         .from('profiles')
//         .select('id, display_name, avatar_url')
//         .in('id', userIds)

//       if (profileError) throw profileError

//       const profileMap = Object.fromEntries(
//         (profiles || []).map(profile => [profile.id, profile])
//       )

//       const enrichedMembers = (locations || []).map(location => ({
//         ...location,
//         profile: profileMap[location.user_id]
//       }))

//       setMembers(enrichedMembers)

//       const myLocation = enrichedMembers.find(
//         member => member.user_id === user.id
//       )

//       setSharing(Boolean(myLocation))

//       setMyPosition(
//         myLocation
//           ? [myLocation.latitude, myLocation.longitude]
//           : null
//       )

//       setLoading(false)
//       setError('')
//     } catch (err) {
//       setError(err.message || 'Ошибка загрузки карты')
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     loadMembers()

//     const channel = supabase
//       .channel('family-map-live')
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'family_locations'
//         },
//         () => loadMembers()
//       )
//       .subscribe()

//     return () => {
//       supabase.removeChannel(channel)
//     }
//   }, [loadMembers])

//   async function startSharing(minutes) {
//     if (!navigator.geolocation) {
//       setError('Геолокация не поддерживается браузером')
//       return
//     }

//     setError('Запрашиваем разрешение на геолокацию...')

//     try {
//       const permission = await navigator.permissions.query({
//         name: 'geolocation'
//       })

//       if (permission.state === 'denied') {
//         setError(
//           'Доступ запрещён. Разреши геолокацию в настройках Chrome.'
//         )
//         return
//       }
//     } catch {
//       // Проверка разрешений может не поддерживаться браузером
//     }

//     navigator.geolocation.getCurrentPosition(
//       async position => {
//         console.log('Широта:', position.coords.latitude)
//         console.log('Долгота:', position.coords.longitude)
//         console.log(
//           'Точность:',
//           position.coords.accuracy,
//           'метров'
//         )

//         setAccuracy(position.coords.accuracy)

//         try {
//           const { data: userData } = await supabase.auth.getUser()
//           const user = userData?.user

//           if (!user) {
//             setError('Сначала войди в аккаунт')
//             return
//           }

//           const { data: memberships, error: groupError } = await supabase
//             .from('group_members')
//             .select('group_id')
//             .eq('user_id', user.id)

//           if (groupError) throw groupError

//           if (!memberships?.length) {
//             setError('Сначала вступи в семейную группу')
//             return
//           }

//           const latitude = position.coords.latitude
//           const longitude = position.coords.longitude

//           const expiresAt = new Date(
//             Date.now() + minutes * 60 * 1000
//           ).toISOString()

//           const rows = memberships.map(group => ({
//             user_id: user.id,
//             group_id: group.group_id,
//             latitude,
//             longitude,
//             is_sharing: true,
//             expires_at: expiresAt,
//             updated_at: new Date().toISOString()
//           }))

//           const { error: saveError } = await supabase
//             .from('family_locations')
//             .upsert(rows, {
//               onConflict: 'user_id,group_id'
//             })

//           if (saveError) throw saveError

//           setMyPosition([latitude, longitude])
//           setSharing(true)

//           await loadMembers()
//         } catch (err) {
//           setError(err.message || 'Ошибка сохранения координат')
//         }
//       },

//       geoError => {
//         if (geoError.code === 1) {
//           setError('Ты запретил доступ к местоположению')
//         } else if (geoError.code === 2) {
//           setError('Не удалось определить местоположение')
//         } else {
//           setError('Время ожидания геолокации истекло')
//         }
//       },

//       {
//         enableHighAccuracy: true,
//         timeout: 30000,
//         maximumAge: 0
//       }
//     )
//   }

//   async function stopSharing() {
//     setError('')

//     const { data: userData } = await supabase.auth.getUser()
//     const user = userData?.user

//     if (!user) return

//     const { error: stopError } = await supabase
//       .from('family_locations')
//       .update({
//         is_sharing: false,
//         expires_at: null,
//         updated_at: new Date().toISOString()
//       })
//       .eq('user_id', user.id)

//     if (stopError) {
//       setError(stopError.message)
//       return
//     }

//     setSharing(false)
//     setMyPosition(null)
//     setSelectedMember(null)
//     setAccuracy(null)

//     await loadMembers()
//   }

//   function formatDate(date) {
//     if (!date) return 'Неизвестно'

//     return new Date(date).toLocaleString('ru-RU', {
//       day: '2-digit',
//       month: 'short',
//       hour: '2-digit',
//       minute: '2-digit'
//     })
//   }

//   return (
//     <div className="family-page family-map-page">

//       <div className="family-page-header">
//         <div>
//           <span className="family-page-label">FAMILY HUB</span>
//           <h1 className="page-title">Family Map 🗺️</h1>
//           <p className="page-description">
//             Местоположение участников твоей семьи
//           </p>
//         </div>
//       </div>

//       <div className="family-map-controls">
//         <div>
//           <h3>Моя геолокация</h3>
//           <p>
//             {sharing
//               ? 'Твоя геолокация передаётся'
//               : 'Передача геолокации выключена'}
//           </p>

//           {accuracy !== null && (
//             <p>
//               Точность определения: примерно {Math.round(accuracy)} м
//             </p>
//           )}
//         </div>

//         <div className="family-map-actions">
//           {!sharing ? (
//             <>
//               <button
//                 className="family-primary-btn"
//                 onClick={() => startSharing(15)}
//               >
//                 15 минут
//               </button>

//               <button
//                 className="family-primary-btn"
//                 onClick={() => startSharing(60)}
//               >
//                 1 час
//               </button>

//               <button
//                 className="family-primary-btn"
//                 onClick={() => startSharing(480)}
//               >
//                 8 часов
//               </button>
//             </>
//           ) : (
//             <button
//               className="family-secondary-btn"
//               onClick={stopSharing}
//             >
//               Остановить передачу
//             </button>
//           )}
//         </div>
//       </div>

//       {error && (
//         <div className="family-map-error">
//           {error}
//         </div>
//       )}

//       <div className="family-map-layout">

//         <div className="family-map-card">
//           {loading ? (
//             <div className="family-map-loading">
//               Загружаем карту...
//             </div>
//           ) : (
//             <MapContainer
//               center={myPosition || DEFAULT_POSITION}
//               zoom={12}
//               scrollWheelZoom={true}
//               className="family-map-container"
//             >
//               <TileLayer
//                 attribution='&copy; OpenStreetMap'
//                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//               />

//               {myPosition && (
//                 <MapUpdater position={myPosition} />
//               )}

//               {members.map(member => (
//                 <Marker
//                   key={member.id}
//                   position={[
//                     member.latitude,
//                     member.longitude
//                   ]}
//                   icon={createAvatarIcon(member.profile)}
//                   eventHandlers={{
//                     click: () => setSelectedMember(member)
//                   }}
//                 >
//                   <Popup>
//                     <strong>
//                       {member.profile?.display_name || 'Участник семьи'}
//                     </strong>
//                     <p>
//                       Обновлено: {formatDate(member.updated_at)}
//                     </p>
//                   </Popup>
//                 </Marker>
//               ))}
//             </MapContainer>
//           )}
//         </div>

//         <div className="family-map-members">
//           <h3>Участники на карте</h3>

//           {members.length === 0 ? (
//             <div className="family-map-empty">
//               <span>📍</span>
//               <p>Пока никто не делится геолокацией</p>
//             </div>
//           ) : (
//             members.map(member => (
//               <div
//                 className={`family-map-member ${
//                   selectedMember?.id === member.id ? 'selected' : ''
//                 }`}
//                 key={member.id}
//               >
//                 {member.profile?.avatar_url ? (
//                   <img
//                     src={member.profile.avatar_url}
//                     className="map-member-avatar"
//                     alt=""
//                   />
//                 ) : (
//                   <div className="map-member-avatar map-member-letter">
//                     {(member.profile?.display_name || '?')
//                       .charAt(0)
//                       .toUpperCase()}
//                   </div>
//                 )}

//                 <div className="family-map-member-info">
//                   <strong>
//                     {member.profile?.display_name || 'Участник семьи'}
//                   </strong>
//                   <p>Геолокация активна</p>
//                   <small>
//                     {formatDate(member.updated_at)}
//                   </small>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//       </div>
//     </div>
//   )
// }



import { useEffect, useState, useCallback, useRef } from 'react'
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
import { useLanguage } from '../context/LanguageContext'

const DEFAULT_POSITION = [41.2995, 69.2401]

// Минимальное желаемое перемещение
const MIN_DISTANCE = 7

// Расстояние между координатами в метрах
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = value => (value * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char])
}



function createAvatarIcon(profile) {
  const name = profile?.display_name || '?'
  const avatar = profile?.avatar_url

  const safeAvatar = avatar && /^https?:\/\//i.test(avatar)
    ? escapeHTML(avatar)
    : null

  const content = safeAvatar
    ? `<img src="${safeAvatar}" class="map-marker-avatar" alt="" />`
    : `<div class="map-marker-avatar map-marker-letter">${escapeHTML(
        name.charAt(0).toUpperCase()
      )}</div>`

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

  // sharing — состояние передачи на сервере
  const [sharing, setSharing] = useState(false)

  // tracking — активен ли watchPosition на этом устройстве
  const [tracking, setTracking] = useState(false)

  const [myPosition, setMyPosition] = useState(null)
  const [error, setError] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [accuracy, setAccuracy] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [sharingMode, setSharingMode] = useState('')
  const [expiresAt, setExpiresAt] = useState(null)

  const watchIdRef = useRef(null)
  const lastSavedPositionRef = useRef(null)
  const savingRef = useRef(false)
  const expiryTimerRef = useRef(null)
  const activeRef = useRef(false)
  const expiresAtRef = useRef(null)
  const groupIdsRef = useRef([])
  const userIdRef = useRef(null)

  const stopWatching = useCallback(() => {
    activeRef.current = false

    if (
      watchIdRef.current !== null &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current)
      expiryTimerRef.current = null
    }

    setTracking(false)
  }, [])

  const loadMembers = useCallback(async () => {
    try {
      const { data: userData, error: authError } =
        await supabase.auth.getUser()

      if (authError) throw authError

      const user = userData?.user

      if (!user) {
        setError('Необходимо войти в аккаунт')
        setLoading(false)
        return
      }

      const { data: memberships, error: groupError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      if (groupError) throw groupError

      if (!memberships?.length) {
        setMembers([])
        setSharing(false)
        setMyPosition(null)
        setLoading(false)
        return
      }

      const groupIds = [
        ...new Set(memberships.map(item => item.group_id))
      ]

      const now = new Date().toISOString()

      const { data: locations, error: locationError } = await supabase
        .from('family_locations')
        .select('*')
        .in('group_id', groupIds)
        .eq('is_sharing', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)

      if (locationError) throw locationError

      const userIds = [
        ...new Set((locations || []).map(item => item.user_id))
      ]

      if (!userIds.length) {
        setMembers([])
        setSharing(false)
        setMyPosition(null)
        setLoading(false)
        setError('')
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

      if (myLocation) {
        setSharing(true)
        setMyPosition([
          myLocation.latitude,
          myLocation.longitude
        ])
        setLastUpdated(myLocation.updated_at)
        setExpiresAt(myLocation.expires_at)
        expiresAtRef.current = myLocation.expires_at

        if (myLocation.expires_at) {
          const remaining = new Date(myLocation.expires_at).getTime() -
            Date.now()

          if (remaining > 0) {
            const minutes = Math.round(remaining / 60000)

            setSharingMode(
              minutes >= 60
                ? `${Math.round(minutes / 60)} ч.`
                : `${minutes} мин.`
            )
          } else {
            setSharingMode('Истекло')
          }
        } else {
          setSharingMode('Навсегда')
        }
      } else {
        setSharing(false)
        setMyPosition(null)
        setExpiresAt(null)
        expiresAtRef.current = null
        setSharingMode('')
      }

      setLoading(false)
      setError('')
    } catch (err) {
      setError(err.message || 'Ошибка загрузки карты')
      setLoading(false)
    }
  }, [])

  // Загрузка участников и realtime
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

      if (
        watchIdRef.current !== null &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }

      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current)
      }

      activeRef.current = false
    }
  }, [loadMembers])

  // Проверяем срок передачи при возвращении на страницу
  useEffect(() => {
    const checkExpiry = async () => {
      const expiry = expiresAtRef.current

      if (!expiry) return

      if (Date.now() >= new Date(expiry).getTime()) {
        stopWatching()
        await stopSharing()
        setError('Время передачи геолокации закончилось')
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkExpiry()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', checkExpiry)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', checkExpiry)
    }
  }, [stopWatching])

  async function startSharing(minutes) {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается браузером')
      return
    }

    if (!window.isSecureContext) {
      setError('Для геолокации нужен HTTPS или localhost')
      return
    }

    stopWatching()

    setError('Подготавливаем геолокацию...')

    try {
      const { data: userData, error: authError } =
        await supabase.auth.getUser()

      if (authError) throw authError

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

      const groupIds = [
        ...new Set(memberships.map(item => item.group_id))
      ]

      const expiry = minutes === null
        ? null
        : new Date(Date.now() + minutes * 60000).toISOString()

      groupIdsRef.current = groupIds
      userIdRef.current = user.id

      expiresAtRef.current = expiry
      setExpiresAt(expiry)

      lastSavedPositionRef.current = null
      savingRef.current = false

      activeRef.current = true
      setTracking(true)
      setSharing(true)

      setSharingMode(
        minutes === null ? 'Навсегда' : `${minutes} минут`
      )

      setError('Ожидаем координаты устройства...')

      const savePosition = async position => {
        if (!activeRef.current) return

        // Проверяем, не истекло ли время передачи
        if (
          expiresAtRef.current &&
          Date.now() >= new Date(expiresAtRef.current).getTime()
        ) {
          stopWatching()
          await stopSharing()
          setError('Время передачи геолокации закончилось')
          return
        }

        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const currentAccuracy = position.coords.accuracy

        setAccuracy(currentAccuracy)

        // Учитываем реальную погрешность устройства.
        // Не блокируем ноутбуки с точностью 50–200 метров.
        const previous = lastSavedPositionRef.current

        if (previous) {
          const distance = getDistance(
            previous.latitude,
            previous.longitude,
            latitude,
            longitude
          )

          const accuracyThreshold = (
            currentAccuracy + previous.accuracy
          ) / 2

          const requiredDistance = Math.max(
            MIN_DISTANCE,
            accuracyThreshold
          )

          // Не сохраняем шум GPS и практически одинаковые точки
          if (distance < requiredDistance) return
        }

        if (savingRef.current) return

        savingRef.current = true

        try {
          const now = new Date().toISOString()

          const rows = groupIdsRef.current.map(groupId => ({
            user_id: user.id,
            group_id: groupId,
            latitude,
            longitude,
            is_sharing: true,
            expires_at: expiresAtRef.current,
            updated_at: now
          }))

          const { error: saveError } = await supabase
            .from('family_locations')
            .upsert(rows, {
              onConflict: 'user_id,group_id'
            })

          if (saveError) throw saveError

          lastSavedPositionRef.current = {
            latitude,
            longitude,
            accuracy: currentAccuracy
          }

          setMyPosition([latitude, longitude])
          setSharing(true)
          setLastUpdated(now)
          setError('')
        } catch (err) {
          setError(
            `Не удалось сохранить координаты: ${err.message}`
          )
        } finally {
          savingRef.current = false
        }
      }

      const handleGeoError = geoError => {
        if (!activeRef.current) return

        if (geoError.code === 1) {
          setError(
            'Доступ к геолокации запрещён. Проверь разрешения браузера.'
          )
          stopWatching()
        } else if (geoError.code === 2) {
          setError(
            'Устройство пока не может определить местоположение. Ожидаем...'
          )
        } else {
          setError(
            'Не удалось получить координаты. Браузер попробует снова.'
          )
        }
      }

      // Запускаем наблюдение за изменением координат
      const watchId = navigator.geolocation.watchPosition(
        savePosition,
        handleGeoError,
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 10000
        }
      )

      watchIdRef.current = watchId

      if (expiry) {
        const remaining = new Date(expiry).getTime() - Date.now()

        expiryTimerRef.current = setTimeout(async () => {
          stopWatching()
          await stopSharing()
          setError('Время передачи геолокации закончилось')
        }, Math.max(0, remaining))
      }
    } catch (err) {
      stopWatching()
      setSharing(false)
      setError(err.message || 'Не удалось включить геолокацию')
    }
  }

  async function stopSharing() {
    stopWatching()

    lastSavedPositionRef.current = null
    savingRef.current = false

    const { data: userData, error: authError } =
      await supabase.auth.getUser()

    if (authError) {
      setError(authError.message)
      return
    }

    const user = userData?.user

    if (!user) {
      setError('Необходимо войти в аккаунт')
      return
    }

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
    setTracking(false)
    setSharingMode('')
    setExpiresAt(null)
    expiresAtRef.current = null
    setMyPosition(null)
    setSelectedMember(null)
    setAccuracy(null)
    setLastUpdated(null)
    setError('')

    await loadMembers()
  }

  function formatDate(date) {
    if (!date) return 'Неизвестно'

    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
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
            {tracking
              ? `Отслеживание активно · ${sharingMode}`
              : sharing
                ? `Передача включена на сервере · ${sharingMode}. Чтобы продолжить отслеживание на этом устройстве, включи его снова.`
                : 'Передача геолокации выключена'}
          </p>

          {accuracy !== null && (
            <p>
              Примерная погрешность: {Math.round(accuracy)} м
            </p>
          )}

          {lastUpdated && (
            <p>
              Последнее обновление: {formatDate(lastUpdated)}
            </p>
          )}

          {tracking && (
            <p>
              Новые координаты сохраняются при заметном перемещении
              с учётом точности устройства.
            </p>
          )}

          {expiresAt && (
            <p>
              Передача завершится: {formatDate(expiresAt)}
            </p>
          )}
        </div>

        <div className="family-map-actions">
          <button
            className="family-primary-btn"
            onClick={() => startSharing(15)}
            disabled={tracking}
          >
            15 минут
          </button>

          <button
            className="family-primary-btn"
            onClick={() => startSharing(60)}
            disabled={tracking}
          >
            1 час
          </button>

          <button
            className="family-primary-btn"
            onClick={() => startSharing(480)}
            disabled={tracking}
          >
            8 часов
          </button>

          <button
            className="family-primary-btn"
            onClick={() => startSharing(null)}
            disabled={tracking}
          >
            Навсегда
          </button>

          {(sharing || tracking) && (
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
                onClick={() => setSelectedMember(member)}
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