
import { useState } from 'react'
import { useSettings } from '../context/SettingsContext'
import { useLanguage } from '../context/LanguageContext'
import { supabase } from '../lib/supabase'

import {
  Moon,
  Sun,
  Sparkles,
  Globe,
  LockKeyhole,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react'

import './Settings.css'

function Settings() {
  const { settings, updateSettings } = useSettings()
  const { language, setLanguage, t } = useLanguage()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const themes = [
    {
      id: 'dark',
      name: 'Dark',
      description: t('darkDescription'),
      icon: Moon,
    },
    {
      id: 'light',
      name: 'Light',
      description: t('lightDescription'),
      icon: Sun,
    },
    {
      id: 'premium',
      name: 'Premium',
      description: t('premiumDescription'),
      icon: Sparkles,
    },
  ]

  const languages = [
    { id: 'ru', name: '🇷🇺 Русский' },
    { id: 'en', name: '🇬🇧 English' },
    { id: 'uz', name: '🇺🇿 O‘zbekcha' },
  ]

  async function handlePasswordChange(e) {
    e.preventDefault()
    setMessage('')
    setMessageType('')

    if (newPassword.length < 8) {
      setMessage('Пароль должен содержать минимум 8 символов.')
      setMessageType('error')
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('Пароли не совпадают.')
      setMessageType('error')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setMessage('Пароль успешно изменён!')
      setMessageType('success')

      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setMessage(error.message || 'Не удалось изменить пароль.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-page">
      <p className="page-label">{t('preferences')}</p>

      <h1 className="page-title">{t('settings')}</h1>

      <p className="page-description">
        {t('settingsDescription')}
      </p>

      {/* APPEARANCE */}
      <section className="settings-card">
        <div className="settings-heading">
          <Sun size={21} />

          <div>
            <h2>{t('appearance')}</h2>
            <p>{t('appearanceDescription')}</p>
          </div>
        </div>

        <div className="theme-options">
          {themes.map((theme) => {
            const Icon = theme.icon
            const selected = settings.theme === theme.id

            return (
              <button
                key={theme.id}
                className={`theme-option ${selected ? 'selected' : ''}`}
                onClick={() => updateSettings({ theme: theme.id })}
              >
                <Icon size={23} />

                <div>
                  <strong>{theme.name}</strong>
                  <span>{theme.description}</span>
                </div>

                {selected && <Check size={19} />}
              </button>
            )
          })}
        </div>
      </section>

      {/* LANGUAGE */}
      <section className="settings-card">
        <div className="settings-heading">
          <Globe size={21} />

          <div>
            <h2>{t('language')}</h2>
            <p>{t('languageDescription')}</p>
          </div>
        </div>

        <div className="language-options">
          {languages.map((item) => (
            <button
              key={item.id}
              className={`language-option ${
                language === item.id ? 'selected' : ''
              }`}
              onClick={() => {
                setLanguage(item.id)
                updateSettings({ language: item.id })
              }}
            >
              {item.name}

              {language === item.id && <Check size={18} />}
            </button>
          ))}
        </div>
      </section>

      {/* SECURITY */}
      <section className="settings-card">
        <div className="settings-heading">
          <LockKeyhole size={21} />

          <div>
            <h2>{t('security')}</h2>
            <p>{t('securityDescription')}</p>
          </div>
        </div>

        <form
          className="password-form"
          onSubmit={handlePasswordChange}
        >
          <label htmlFor="new-password">
            Новый пароль
          </label>

          <div className="password-input-wrapper">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Минимум 8 символов"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />

            <button
              type="button"
              className="password-eye"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Показать или скрыть пароль"
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          <label htmlFor="confirm-password">
            Повторите новый пароль
          </label>

          <input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Повторите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          {message && (
            <div className={`password-message ${messageType}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            className="password-submit"
            disabled={loading}
          >
            {loading ? 'Сохранение...' : 'Изменить пароль'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default Settings
