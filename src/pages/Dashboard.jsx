
import { useEffect, useState } from 'react'

import {
  Users,
  Wallet,
  ShoppingCart,
  CalendarDays,
  CheckSquare,
  MapPin,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

function Dashboard({ setActive }) {
  const { t, language } = useLanguage()

  const [stats, setStats] = useState({
    members: 0,
    balance: 0,
    shopping: 0,
    tasks: 0,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: userData, error: authError } =
          await supabase.auth.getUser()

        if (authError) throw authError

        const user = userData?.user
        if (!user) return

        const { data: memberships, error: membershipError } =
          await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', user.id)

        if (membershipError) throw membershipError

        const groupIds = [
          ...new Set((memberships || []).map(item => item.group_id)),
        ]

        if (!groupIds.length) {
          setStats({
            members: 0,
            balance: 0,
            shopping: 0,
            tasks: 0,
          })
          return
        }

        const { data: members, error: membersError } =
          await supabase
            .from('group_members')
            .select('user_id')
            .in('group_id', groupIds)

        if (membersError) throw membersError

        const membersCount = new Set(
          (members || []).map(member => member.user_id)
        ).size

        const { count: shoppingCount, error: shoppingError } =
          await supabase
            .from('shopping_items')
            .select('*', { count: 'exact', head: true })

        if (shoppingError) throw shoppingError

        const { count: tasksCount, error: tasksError } =
          await supabase
            .from('family_tasks')
            .select('*', { count: 'exact', head: true })

        if (tasksError) throw tasksError

        const { data: transactions, error: budgetError } =
          await supabase
            .from('family_transactions')
            .select('amount, type')
            .in('group_id', groupIds)

        if (budgetError) throw budgetError

        const income = (transactions || [])
          .filter(item => item.type === 'income')
          .reduce((sum, item) => sum + Number(item.amount), 0)

        const expenses = (transactions || [])
          .filter(item => item.type === 'expense')
          .reduce((sum, item) => sum + Number(item.amount), 0)

        setStats({
          members: membersCount,
          balance: income - expenses,
          shopping: shoppingCount || 0,
          tasks: tasksCount || 0,
        })
      } catch (error) {
        console.error('Dashboard loading error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const formatMoney = value =>
    `${value.toLocaleString(
      language === 'ru' ? 'ru-RU' : language === 'uz' ? 'uz-UZ' : 'en-US',
      { maximumFractionDigits: 2 }
    )} сум`

  const statsCards = [
    {
      title: t('familyMembers'),
      value: stats.members,
      icon: Users,
    },
    {
      title: t('totalBudget'),
      value: formatMoney(stats.balance),
      icon: Wallet,
    },
    {
      title: t('shopping'),
      value: stats.shopping,
      icon: ShoppingCart,
    },
    {
      title: t('tasks'),
      value: stats.tasks,
      icon: CheckSquare,
    },
  ]

  const quickActions = [
    { name: 'Shopping', label: t('shopping'), icon: ShoppingCart },
    { name: 'Calendar', label: t('calendar'), icon: CalendarDays },
    { name: 'Budget', label: t('budget'), icon: Wallet },
    { name: 'Family Map', label: t('familyMap'), icon: MapPin },
  ]

  return (
    <div className="dashboard">
      <header>
        <p className="page-label">{t('familySpace')}</p>

        <h1 className="page-title">
          {t('dashboard')} 👋
        </h1>

        <p className="page-description">
          {t('dashboardDescription')}
        </p>
      </header>

      <section className="stats-grid">
        {statsCards.map(item => {
          const Icon = item.icon

          return (
            <div className="stat-card" key={item.title}>
              <div className="stat-header">
                <span>{item.title}</span>
                <Icon size={22} className="stat-icon" />
              </div>

              <h2 className="stat-value">
                {loading ? '...' : item.value}
              </h2>
            </div>
          )
        })}
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <h2 className="panel-title">{t('quickAccess')}</h2>

          <div className="quick-grid">
            {quickActions.map(item => {
              const Icon = item.icon

              return (
                <button
                  key={item.name}
                  className="quick-button"
                  onClick={() => setActive(item.name)}
                >
                  <Icon size={23} />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="dashboard-panel">
          <h2 className="panel-title">{t('recentEvents')}</h2>

          <p className="empty-text">
            {t('noEvents')}
            <br />
            {t('eventsDescription')}
          </p>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
