
import { useEffect, useState } from 'react'
import {
  Users,
  ListTodo,
  Clock,
  CircleCheck,
  ShoppingCart,
  CalendarDays,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './Statistics.css'

function Statistics() {
  const [stats, setStats] = useState({
    members: 0,
    totalTasks: 0,
    pending: 0,
    progress: 0,
    completed: 0,
    shopping: 0,
    events: 0
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadStatistics() {
    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser()

      if (authError) throw authError

      if (!user) {
        setError('Сначала войди в аккаунт')
        return
      }

      // Получаем семейные группы пользователя
      const { data: memberships, error: membershipError } =
        await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)

      if (membershipError) throw membershipError

      const groupIds = [
        ...new Set((memberships || []).map(item => item.group_id))
      ]

      // Считаем уникальных участников всех своих групп
      let membersCount = 0

      if (groupIds.length > 0) {
        const { data: allMembers, error: membersError } =
          await supabase
            .from('group_members')
            .select('user_id')
            .in('group_id', groupIds)

        if (membersError) throw membersError

        membersCount = new Set(
          (allMembers || []).map(member => member.user_id)
        ).size
      }

      // Получаем задачи и их статусы
      const { data: tasks, error: tasksError } = await supabase
        .from('family_tasks')
        .select('status')

      if (tasksError) throw tasksError

      const allTasks = tasks || []

      const pending = allTasks.filter(
        task => task.status === 'pending'
      ).length

      const progress = allTasks.filter(
        task => task.status === 'progress'
      ).length

      const completed = allTasks.filter(
        task => task.status === 'completed'
      ).length

      // Считаем позиции списка покупок
      const { count: shoppingCount, error: shoppingError } =
        await supabase
          .from('shopping_items')
          .select('*', { count: 'exact', head: true })

      if (shoppingError) throw shoppingError

      // Считаем события календаря
      const { count: eventsCount, error: eventsError } =
        await supabase
          .from('calendar_events')
          .select('*', { count: 'exact', head: true })

      if (eventsError) throw eventsError

      setStats({
        members: membersCount,
        totalTasks: allTasks.length,
        pending,
        progress,
        completed,
        shopping: shoppingCount || 0,
        events: eventsCount || 0
      })
    } catch (err) {
      console.error('Statistics error:', err)
      setError(err.message || 'Не удалось загрузить статистику')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatistics()
  }, [])

  const completion = stats.totalTasks
    ? Math.round((stats.completed / stats.totalTasks) * 100)
    : 0

  const cards = [
    {
      title: 'Участники семьи',
      value: stats.members,
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Всего задач',
      value: stats.totalTasks,
      icon: ListTodo,
      color: 'blue'
    },
    {
      title: 'Ожидают',
      value: stats.pending,
      icon: Clock,
      color: 'orange'
    },
    {
      title: 'В процессе',
      value: stats.progress,
      icon: RefreshCw,
      color: 'cyan'
    },
    {
      title: 'Выполнено',
      value: stats.completed,
      icon: CircleCheck,
      color: 'green'
    },
    {
      title: 'Позиции покупок',
      value: stats.shopping,
      icon: ShoppingCart,
      color: 'pink'
    },
    {
      title: 'События календаря',
      value: stats.events,
      icon: CalendarDays,
      color: 'yellow'
    }
  ]

  return (
    <div className="family-page statistics-page">
      <div className="family-page-header">
        <div>
          <p className="family-page-label">FAMILYHUB</p>
          <h1 className="page-title">Статистика</h1>
          <p className="page-description">
            Все важные показатели вашей семьи в одном месте
          </p>
        </div>

        <button
          className="family-primary-btn statistics-refresh"
          onClick={loadStatistics}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Обновить
        </button>
      </div>

      {error && (
        <div className="statistics-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="statistics-loading">
          Загружаем статистику...
        </div>
      ) : (
        <>
          <div className="statistics-grid">
            {cards.map(card => {
              const Icon = card.icon

              return (
                <div
                  className="statistics-card"
                  key={card.title}
                >
                  <div className="statistics-card-top">
                    <span>{card.title}</span>
                    <div className={`statistics-icon ${card.color}`}>
                      <Icon size={22} />
                    </div>
                  </div>

                  <h2>{card.value.toLocaleString('ru-RU')}</h2>
                  <p>Общая статистика</p>
                </div>
              )
            })}
          </div>

          <div className="statistics-bottom">
            <div className="statistics-section-header">
              <div>
                <h2>Выполнение задач</h2>
                <p>Прогресс семейных дел</p>
              </div>

              <strong>{completion}%</strong>
            </div>

            <div className="statistics-progress">
              <div
                className="statistics-progress-fill"
                style={{ width: `${completion}%` }}
              />
            </div>

            <div className="statistics-legend">
              <span>
                <i className="legend-dot green-dot" />
                Выполнено: {stats.completed}
              </span>

              <span>
                <i className="legend-dot orange-dot" />
                Ожидают: {stats.pending}
              </span>

              <span>
                <i className="legend-dot blue-dot" />
                В процессе: {stats.progress}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Statistics
