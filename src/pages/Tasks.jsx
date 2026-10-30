
import { useEffect, useState } from 'react'
import {
  CheckSquare,
  Plus,
  Trash2,
  Clock,
  CircleCheck,
  ListTodo,
  X,
  Filter,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
  })

  async function loadTasks() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('family_tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Tasks loading error:', error.message)
      setError('Не удалось загрузить задачи.')
    } else {
      setTasks(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadTasks()
  }, [])

  async function addTask(e) {
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
      .from('family_tasks')
      .insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        assigned_to: form.assigned_to.trim(),
        priority: form.priority,
      })

    if (error) {
      console.error('Tasks insert error:', error.message)
      setError('Не удалось сохранить задачу.')
      return
    }

    setForm({
      title: '',
      description: '',
      assigned_to: '',
      priority: 'medium',
    })

    setShowForm(false)
    await loadTasks()
  }

  async function deleteTask(id) {
    const { error } = await supabase
      .from('family_tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Tasks delete error:', error.message)
      setError('Не удалось удалить задачу.')
      return
    }

    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  async function changeStatus(id, status) {
    const { error } = await supabase
      .from('family_tasks')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Tasks update error:', error.message)
      setError('Не удалось изменить статус.')
      return
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, status } : task
      )
    )
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true
    if (filter === 'pending') return task.status === 'pending'
    if (filter === 'progress') return task.status === 'progress'
    if (filter === 'completed') return task.status === 'completed'
    return true
  })

  const completedCount = tasks.filter(
    (task) => task.status === 'completed'
  ).length

  const progressCount = tasks.filter(
    (task) => task.status === 'progress'
  ).length

  const pendingCount = tasks.filter(
    (task) => task.status === 'pending'
  ).length

  const priorityLabels = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
  }

  const statusLabels = {
    pending: 'Ожидает',
    progress: 'В процессе',
    completed: 'Выполнено',
  }

  return (
    <div className="family-page">
      <div className="family-page-header">
        <div>
          <p className="family-page-label">FAMILYHUB</p>
          <h1 className="page-title">Задачи</h1>
          <p className="page-description">
            Организуйте семейные дела вместе
          </p>
        </div>

        <div className="family-page-icon">
          <CheckSquare size={28} />
        </div>
      </div>

      {error && (
        <p className="page-description">{error}</p>
      )}

      <div className="tasks-stats">
        <div className="task-stat">
          <ListTodo size={22} />
          <span>Всего</span>
          <strong>{tasks.length}</strong>
        </div>

        <div className="task-stat">
          <Clock size={22} />
          <span>Ожидают</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="task-stat">
          <Clock size={22} />
          <span>В процессе</span>
          <strong>{progressCount}</strong>
        </div>

        <div className="task-stat">
          <CircleCheck size={22} />
          <span>Выполнено</span>
          <strong>{completedCount}</strong>
        </div>
      </div>

      <div className="family-page-card">
        <div className="tasks-toolbar">
          <div>
            <h2>Список задач</h2>
            <p className="page-description">
              {filteredTasks.length} задач
            </p>
          </div>

          <button
            className="family-primary-btn"
            onClick={() => {
              setError('')
              setShowForm(true)
            }}
          >
            <Plus size={18} />
            Добавить
          </button>
        </div>

        <div className="tasks-filter">
          <Filter size={17} />

          {[
            ['all', 'Все'],
            ['pending', 'Ожидают'],
            ['progress', 'В процессе'],
            ['completed', 'Выполнены'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? 'active' : ''}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="page-description">Загрузка задач...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="page-description">
            Здесь пока нет задач.
          </p>
        ) : (
          <div className="tasks-list">
            {filteredTasks.map((task) => (
              <div className="task-item" key={task.id}>
                <div className="task-content">
                  <h3>{task.title}</h3>

                  {task.description && (
                    <p>{task.description}</p>
                  )}

                  <div className="task-meta">
                    {task.assigned_to && (
                      <span>
                        Исполнитель: {task.assigned_to}
                      </span>
                    )}

                    <span className={`task-priority ${task.priority}`}>
                      Приоритет: {priorityLabels[task.priority]}
                    </span>
                  </div>

                  <select
                    className="task-status"
                    value={task.status}
                    onChange={(e) =>
                      changeStatus(task.id, e.target.value)
                    }
                  >
                    {Object.entries(statusLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <button
                  className="family-secondary-btn"
                  onClick={() => deleteTask(task.id)}
                  title="Удалить задачу"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="family-modal-overlay"
          onClick={() => setShowForm(false)}
        >
          <div
            className="family-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="family-modal-header">
              <h2>Новая задача</h2>

              <button
                className="family-secondary-btn"
                onClick={() => setShowForm(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={addTask}>
              <label>Название задачи</label>
              <input
                type="text"
                placeholder="Например, купить продукты"
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

              <label>Исполнитель</label>
              <input
                type="text"
                placeholder="Например, Папа"
                value={form.assigned_to}
                onChange={(e) =>
                  setForm({
                    ...form,
                    assigned_to: e.target.value,
                  })
                }
              />

              <label>Приоритет</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority: e.target.value,
                  })
                }
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>

              <button
                className="family-primary-btn"
                type="submit"
              >
                <Plus size={18} />
                Сохранить задачу
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks
