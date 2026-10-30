
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

import Dashboard from './pages/Dashboard'
import Auth from './pages/Auth'
import Sidebar from './components/Sidebar'
import FamilyGroups from './pages/FamilyGroups'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Calendar from './pages/Calendar'
import Tasks from './pages/Tasks'
import Shopping from './pages/Shopping'
import FamilyMap from './pages/FamilyMap'
import Statistics from './pages/Statistics'
import Budget from './pages/Budget'

import { ProfileProvider } from './context/ProfileContext'
import { SettingsProvider } from './context/SettingsContext'
import { LanguageProvider } from './context/LanguageContext'

import './pages/FamilyPages.css'
import './App.css'

function AppContent() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [active, setActive] = useState('Dashboard')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.has('invite')) {
      setActive('Family Groups')
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        console.error('Session error:', error.message)
      }

      setSession(data?.session ?? null)
      setChecking(false)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setActive('Dashboard')
  }

  if (checking) {
    return (
      <div className="loading-screen">
        Загрузка FamilyHub...
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="app-layout">
      <Sidebar
        active={active}
        setActive={setActive}
        onLogout={handleLogout}
      />

      <main className="app-main">
        {active === 'Dashboard' ? (
          <Dashboard setActive={setActive} />
        ) : active === 'Family Groups' ? (
          <FamilyGroups />
        ) : active === 'Profile' ? (
          <Profile />
        ) : active === 'Settings' ? (
          <Settings />
        ) : active === 'Calendar' ? (
          <Calendar />
        ) : active === 'Tasks' ? (
          <Tasks />
        ) : active === 'Shopping' ? (
          <Shopping />
        ) : active === 'Family Map' ? (
          <FamilyMap />
        ) : active === 'Statistics' ? (
          <Statistics />
        ) : active === 'Budget' ? (
          <Budget />
        ) : (
          <div>
            <p className="page-label">FAMILYHUB</p>
            <h1 className="page-title">{active}</h1>
            <p className="page-description">
              Этот раздел скоро появится.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <ProfileProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </ProfileProvider>
    </LanguageProvider>
  )
}

export default App
