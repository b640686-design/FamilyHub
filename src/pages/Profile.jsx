
import { useEffect, useState } from 'react'
import {
  UserRound,
  Mail,
  Save,
  LoaderCircle,
  Camera,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useProfile } from '../context/ProfileContext'
import './Profile.css'

function Profile() {
  const {
    profile,
    loadProfile,
    loadingProfile,
  } = useProfile()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) {
      setName(profile.display_name || '')
    }
  }, [profile])

  useEffect(() => {
    async function loadEmail() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setEmail(user?.email || '')
    }

    loadEmail()
  }, [])

  async function saveProfile() {
    if (name.trim().length < 2) {
      setError('Имя должно содержать минимум 2 символа')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: name.trim() })
      .eq('id', profile.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      await loadProfile()
      setMessage('Профиль успешно обновлён!')
    }

    setSaving(false)
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0]

    if (!file) return

    setError('')
    setMessage('')

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Выбери изображение PNG, JPG или WebP')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Размер фотографии не должен превышать 5 МБ')
      event.target.value = ''
      return
    }

    setUploading(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Не удалось определить пользователя')
      }

      const extension =
        file.name.split('.').pop()?.toLowerCase() || 'jpg'

      const filePath =
        `${user.id}/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = data.publicUrl

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      await loadProfile()

      setMessage('Фотография профиля успешно обновлена!')
    } catch (err) {
      setError(err.message || 'Не удалось загрузить фотографию')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  if (loadingProfile) {
    return (
      <div className="profile-loading">
        Загрузка профиля...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-loading">
        Не удалось загрузить профиль.
      </div>
    )
  }

  return (
    <div className="profile-page">
      <p className="page-label">ACCOUNT</p>

      <h1 className="page-title">Мой профиль</h1>

      <p className="page-description">
        Управляй информацией своего аккаунта
      </p>

      {error && (
        <div className="profile-alert error">
          {error}
        </div>
      )}

      {message && (
        <div className="profile-alert success">
          {message}
        </div>
      )}

      <section className="profile-card">
        <div className="profile-avatar">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Фото профиля"
            />
          ) : (
            <UserRound size={42} />
          )}
        </div>

        <label className="profile-avatar-upload">
          {uploading ? (
            <LoaderCircle
              size={17}
              className="profile-spinner"
            />
          ) : (
            <Camera size={17} />
          )}

          {uploading
            ? 'Загрузка...'
            : 'Изменить фотографию'}

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={uploadAvatar}
            disabled={uploading}
            hidden
          />
        </label>

        <div className="profile-main-info">
          <h2>{profile.display_name}</h2>
          <span>Пользователь FamilyHub</span>
        </div>

        <div className="profile-divider" />

        <label className="profile-label">
          Имя пользователя
        </label>

        <input
          className="profile-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Твоё имя"
          maxLength={50}
        />

        <label className="profile-label">
          Email
        </label>

        <div className="profile-email">
          <Mail size={18} />
          {email}
        </div>

        <button
          className="profile-save"
          onClick={saveProfile}
          disabled={saving || !name.trim()}
        >
          {saving ? (
            <LoaderCircle
              size={18}
              className="profile-spinner"
            />
          ) : (
            <Save size={18} />
          )}

          {saving
            ? 'Сохранение...'
            : 'Сохранить изменения'}
        </button>
      </section>
    </div>
  )
}

export default Profile
