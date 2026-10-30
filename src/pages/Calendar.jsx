
import { useEffect, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Clock,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

function getDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_time: '',
  })

  // Загружаем события из Supabase
  async function loadEvents() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('event_date', { ascending: true })

    if (error) {
      console.error('Calendar loading error:', error.message)
      setError('Не удалось загрузить события.')
    } else {
      setEvents(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Понедельник — первый день недели
  const startDay = (firstDay.getDay() + 6) % 7

  const calendarDays = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const selectedKey = getDateKey(selectedDate)

  const selectedEvents = events.filter(
    (event) => event.event_date === selectedKey
  )

  async function addEvent(e) {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) return

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Не удалось определить пользователя.')
      return
    }

    const { error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        event_date: selectedKey,
        event_time: form.event_time || null,
      })

    if (error) {
      console.error('Calendar insert error:', error.message)
      setError('Не удалось сохранить событие.')
      return
    }

    setForm({
      title: '',
      description: '',
      event_time: '',
    })

    setShowModal(false)
    await loadEvents()
  }

  async function deleteEvent(id) {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Calendar delete error:', error.message)
      setError('Не удалось удалить событие.')
      return
    }

    setEvents((prev) => prev.filter((event) => event.id !== id))
  }

  function changeMonth(direction) {
    setCurrentDate(
      new Date(year, month + direction, 1)
    )
  }

  function selectDay(day) {
    if (!day) return

    const date = new Date(year, month, day)
    setSelectedDate(date)
  }

  const monthName = currentDate.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="family-page">
      <div className="family-page-header">
        <div>
          <p className="family-page-label">FAMILYHUB</p>
          <h1 className="page-title">Календарь</h1>
          <p className="page-description">
            Все важные семейные события в одном месте
          </p>
        </div>

        <div className="family-page-icon">
          <CalendarDays size={28} />
        </div>
      </div>

      {error && (
        <p className="page-description">{error}</p>
      )}

      <div className="family-page-card">
        <div className="calendar-header">
          <button
            className="family-secondary-btn"
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft size={18} />
          </button>

          <h2 className="calendar-month">{monthName}</h2>

          <button
            className="family-secondary-btn"
            onClick={() => changeMonth(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="calendar-grid">
          {weekDays.map((day) => (
            <div className="calendar-weekday" key={day}>
              {day}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} />
            }

            const date = new Date(year, month, day)
            const dateKey = getDateKey(date)

            const hasEvent = events.some(
              (event) => event.event_date === dateKey
            )

            const isSelected = dateKey === selectedKey
            const isToday =
              dateKey === getDateKey(new Date())

            return (
              <button
                key={day}
                className={`calendar-day ${
                  isSelected ? 'calendar-day-selected' : ''
                } ${isToday ? 'calendar-day-today' : ''}`}
                onClick={() => selectDay(day)}
              >
                {day}
                {hasEvent && (
                  <span className="calendar-event-dot" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="family-page-card">
        <div className="calendar-events-header">
          <div>
            <h2>
              {selectedDate.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
              })}
            </h2>
            <p className="page-description">
              События на выбранный день
            </p>
          </div>

          <button
            className="family-primary-btn"
            onClick={() => {
              setError('')
              setShowModal(true)
            }}
          >
            <Plus size={18} />
            Добавить
          </button>
        </div>

        {loading ? (
          <p className="page-description">Загрузка событий...</p>
        ) : selectedEvents.length === 0 ? (
          <p className="page-description">
            На этот день пока нет событий.
          </p>
        ) : (
          <div className="calendar-events-list">
            {selectedEvents.map((event) => (
              <div className="calendar-event-item" key={event.id}>
                <div>
                  <h3>{event.title}</h3>

                  {event.description && (
                    <p>{event.description}</p>
                  )}

                  {event.event_time && (
                    <span>
                      <Clock size={14} />
                      {event.event_time.slice(0, 5)}
                    </span>
                  )}
                </div>

                <button
                  className="family-secondary-btn"
                  onClick={() => deleteEvent(event.id)}
                  title="Удалить событие"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="family-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="family-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="family-modal-header">
              <h2>Новое событие</h2>

              <button
                className="family-secondary-btn"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={addEvent}>
              <label>Название события</label>
              <input
                type="text"
                placeholder="Например, день рождения"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                required
              />

              <label>Описание</label>
              <textarea
                placeholder="Дополнительная информация..."
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />

              <label>Время</label>
              <input
                type="time"
                value={form.event_time}
                onChange={(e) =>
                  setForm({
                    ...form,
                    event_time: e.target.value,
                  })
                }
              />

              <button
                className="family-primary-btn"
                type="submit"
              >
                <Plus size={18} />
                Сохранить событие
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
