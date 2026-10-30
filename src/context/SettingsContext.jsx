
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'ru',
  })

  const [loadingSettings, setLoadingSettings] = useState(true)

  // Применяем тему ко всему приложению
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      settings.theme
    )
  }, [settings.theme])

  // Загружаем настройки пользователя
  async function loadSettings() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setSettings({
        theme: 'dark',
        language: 'ru',
      })
      setLoadingSettings(false)
      return
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('theme, language')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!error && data) {
      setSettings({
        theme: data.theme || 'dark',
        language: data.language || 'ru',
      })
    }

    setLoadingSettings(false)
  }

  // Обновляем настройки
  async function updateSettings(newSettings) {
    const updated = {
      ...settings,
      ...newSettings,
    }

    setSettings(updated)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) return

    const { error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: user.id,
          ...updated,
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('Settings error:', error.message)
    }
  }

  useEffect(() => {
    loadSettings()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadSettings()
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        loadingSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
