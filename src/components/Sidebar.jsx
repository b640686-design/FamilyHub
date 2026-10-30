
import { useState } from 'react'

import {
  LayoutDashboard,
  Users,
  MapPin,
  ShoppingCart,
  Wallet,
  CalendarDays,
  CheckSquare,
  ChartNoAxesCombined,
  UserRound,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-react'

import { useProfile } from '../context/ProfileContext'
import { useLanguage } from '../context/LanguageContext'

import './Sidebar.css'

const menu = [
  { name: 'Dashboard', key: 'dashboard', icon: LayoutDashboard },
  { name: 'Family Groups', key: 'familyGroups', icon: Users },
  { name: 'Family Map', key: 'familyMap', icon: MapPin },
  { name: 'Shopping', key: 'shopping', icon: ShoppingCart },
  { name: 'Budget', key: 'budget', icon: Wallet },
  { name: 'Calendar', key: 'calendar', icon: CalendarDays },
  { name: 'Tasks', key: 'tasks', icon: CheckSquare },
  { name: 'Statistics', key: 'statistics', icon: ChartNoAxesCombined },
]

const bottomMenu = [
  { name: 'Profile', key: 'profile', icon: UserRound },
  { name: 'Settings', key: 'settings', icon: Settings },
]

function Sidebar({ active, setActive, onLogout }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const { profile } = useProfile()
  const { t } = useLanguage()

  function navigate(name) {
    setActive(name)
    setMobileOpen(false)
  }

  function renderProfile() {
    return (
      <button
        className={`sidebar-profile ${active === 'Profile' ? 'active' : ''}`}
        onClick={() => navigate('Profile')}
        title={collapsed ? profile?.display_name || t('profile') : ''}
      >
        <div className="sidebar-profile-avatar">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" />
          ) : (
            <UserRound size={20} />
          )}
        </div>

        {!collapsed && (
          <div className="sidebar-profile-info">
            <strong>
              {profile?.display_name || t('user')}
            </strong>
            <span>{t('myProfile')}</span>
          </div>
        )}
      </button>
    )
  }

  function renderMenu() {
    return (
      <>
        <div className="sidebar-top">
          {!collapsed && (
            <h1 className="sidebar-logo">
              Family<span>Hub</span>
            </h1>
          )}

          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            title={t('collapseMenu')}
          >
            {collapsed ? (
              <PanelLeftOpen size={21} />
            ) : (
              <PanelLeftClose size={21} />
            )}
          </button>
        </div>

        {!collapsed && (
          <p className="sidebar-label">{t('mainMenu')}</p>
        )}

        <nav className="sidebar-nav">
          {menu.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.name}
                title={collapsed ? t(item.key) : ''}
                onClick={() => navigate(item.name)}
                className={`sidebar-item ${
                  active === item.name ? 'active' : ''
                }`}
              >
                <Icon size={20} />
                {!collapsed && <span>{t(item.key)}</span>}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          {!collapsed && (
            <p className="sidebar-label">{t('account')}</p>
          )}

          {renderProfile()}

          {bottomMenu
            .filter((item) => item.name !== 'Profile')
            .map((item) => {
              const Icon = item.icon

              return (
                <button
                  key={item.name}
                  title={collapsed ? t(item.key) : ''}
                  onClick={() => navigate(item.name)}
                  className={`sidebar-item ${
                    active === item.name ? 'active' : ''
                  }`}
                >
                  <Icon size={20} />
                  {!collapsed && <span>{t(item.key)}</span>}
                </button>
              )
            })}

          <button
            onClick={onLogout}
            className="sidebar-item sidebar-logout"
            title={collapsed ? t('logout') : ''}
          >
            <LogOut size={20} />
            {!collapsed && <span>{t('logout')}</span>}
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <aside
        className={`sidebar desktop-sidebar ${
          collapsed ? 'collapsed' : ''
        }`}
      >
        {renderMenu()}
      </aside>

      <header className="mobile-header">
        <h1 className="sidebar-logo">
          Family<span>Hub</span>
        </h1>

        <button
          className="mobile-menu-button"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} />
        </button>
      </header>

      {mobileOpen && (
        <div
          className="mobile-overlay open"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="mobile-sidebar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sidebar-top">
              <h1 className="sidebar-logo">
                Family<span>Hub</span>
              </h1>

              <button
                className="mobile-close"
                onClick={() => setMobileOpen(false)}
              >
                <X size={22} />
              </button>
            </div>

            {renderMenu()}
          </aside>
        </div>
      )}
    </>
  )
}

export default Sidebar
