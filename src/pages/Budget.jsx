
import { useEffect, useState } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './Budget.css'

const categories = {
  income: [
    ['salary', 'Зарплата'],
    ['business', 'Бизнес'],
    ['gift', 'Подарок'],
    ['other', 'Другое']
  ],
  expense: [
    ['food', 'Продукты'],
    ['transport', 'Транспорт'],
    ['shopping', 'Покупки'],
    ['utilities', 'Коммунальные услуги'],
    ['entertainment', 'Развлечения'],
    ['health', 'Здоровье'],
    ['other', 'Другое']
  ]
}

function Budget() {
  const [transactions, setTransactions] = useState([])
  const [groupId, setGroupId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')

  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'food',
    description: ''
  })

  async function loadTransactions() {
    setLoading(true)
    setError('')

    try {
      const { data: userData, error: authError } =
        await supabase.auth.getUser()

      if (authError) throw authError

      const user = userData?.user

      if (!user) {
        setError('Сначала войди в аккаунт')
        return
      }

      const { data: memberships, error: membershipError } =
        await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)

      if (membershipError) throw membershipError

      if (!memberships?.length) {
        setTransactions([])
        setGroupId('')
        return
      }

      const currentGroupId = memberships[0].group_id
      setGroupId(currentGroupId)

      const { data, error: transactionError } = await supabase
        .from('family_transactions')
        .select('*')
        .eq('group_id', currentGroupId)
        .order('created_at', { ascending: false })

      if (transactionError) throw transactionError

      setTransactions(data || [])
    } catch (err) {
      console.error('Budget error:', err)
      setError(err.message || 'Не удалось загрузить бюджет')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  async function addTransaction(e) {
    e.preventDefault()
    setError('')

    const amount = Number(form.amount)

    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError('Проверь название и сумму операции')
      return
    }

    if (!groupId) {
      setError('Сначала создай или выбери семейную группу')
      return
    }

    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user) {
        setError('Сначала войди в аккаунт')
        return
      }

      const { error: insertError } = await supabase
        .from('family_transactions')
        .insert({
          user_id: user.id,
          group_id: groupId,
          title: form.title.trim(),
          amount,
          type: form.type,
          category: form.category,
          description: form.description.trim()
        })

      if (insertError) throw insertError

      setForm({
        title: '',
        amount: '',
        type: 'expense',
        category: 'food',
        description: ''
      })

      setShowForm(false)
      await loadTransactions()
    } catch (err) {
      setError(err.message || 'Не удалось добавить операцию')
    }
  }

  async function deleteTransaction(id) {
    const confirmed = window.confirm('Удалить эту операцию?')

    if (!confirmed) return

    const { error: deleteError } = await supabase
      .from('family_transactions')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setTransactions(prev => prev.filter(item => item.id !== id))
  }

  const income = transactions
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  const expenses = transactions
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  const balance = income - expenses

  const filteredTransactions = transactions.filter(item => {
    if (filter === 'income') return item.type === 'income'
    if (filter === 'expense') return item.type === 'expense'
    return true
  })

  function money(value) {
    return `${value.toLocaleString('ru-RU', {
      maximumFractionDigits: 2
    })} сум`
  }

  function categoryName(item) {
    return categories[item.type]?.find(
      category => category[0] === item.category
    )?.[1] || 'Другое'
  }

  return (
    <div className="family-page budget-page">
      <div className="family-page-header">
        <div>
          <p className="family-page-label">FAMILYHUB</p>
          <h1 className="page-title">Семейный бюджет</h1>
          <p className="page-description">
            Контролируйте доходы и расходы семьи
          </p>
        </div>

        <button
          className="family-primary-btn"
          onClick={loadTransactions}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Обновить
        </button>
      </div>

      {error && (
        <div className="budget-error">{error}</div>
      )}

      <div className="budget-overview">
        <div className="budget-card balance-card">
          <div className="budget-card-icon">
            <Wallet size={23} />
          </div>
          <p>Общий баланс</p>
          <h2>{money(balance)}</h2>
        </div>

        <div className="budget-card">
          <div className="budget-card-icon income-icon">
            <TrendingUp size={23} />
          </div>
          <p>Доходы</p>
          <h2 className="income-text">{money(income)}</h2>
        </div>

        <div className="budget-card">
          <div className="budget-card-icon expense-icon">
            <TrendingDown size={23} />
          </div>
          <p>Расходы</p>
          <h2 className="expense-text">{money(expenses)}</h2>
        </div>
      </div>

      <div className="budget-content">
        <div className="budget-list-card">
          <div className="budget-toolbar">
            <div>
              <h2>История операций</h2>
              <p>{filteredTransactions.length} операций</p>
            </div>

            <button
              className="family-primary-btn"
              onClick={() => setShowForm(true)}
            >
              <Plus size={18} />
              Добавить
            </button>
          </div>

          <div className="budget-filters">
            {[
              ['all', 'Все'],
              ['income', 'Доходы'],
              ['expense', 'Расходы']
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
            <p className="budget-empty">Загрузка бюджета...</p>
          ) : filteredTransactions.length === 0 ? (
            <div className="budget-empty">
              <Wallet size={35} />
              <p>Операций пока нет</p>
              <span>Добавь первый доход или расход</span>
            </div>
          ) : (
            <div className="budget-transactions">
              {filteredTransactions.map(item => (
                <div className="budget-transaction" key={item.id}>
                  <div className={`budget-transaction-icon ${item.type}`}>
                    {item.type === 'income'
                      ? <ArrowUpCircle size={22} />
                      : <ArrowDownCircle size={22} />}
                  </div>

                  <div className="budget-transaction-info">
                    <strong>{item.title}</strong>
                    <span>
                      {categoryName(item)} · {
                        new Date(item.created_at).toLocaleDateString('ru-RU')
                      }
                    </span>
                  </div>

                  <strong className={
                    item.type === 'income'
                      ? 'income-text'
                      : 'expense-text'
                  }>
                    {item.type === 'income' ? '+' : '-'}
                    {money(Number(item.amount))}
                  </strong>

                  {item.user_id === transactions.find(
                    transaction => transaction.id === item.id
                  )?.user_id && (
                    <button
                      className="budget-delete"
                      onClick={() => deleteTransaction(item.id)}
                      title="Удалить"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div
          className="family-modal-overlay"
          onClick={() => setShowForm(false)}
        >
          <div
            className="family-modal budget-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="family-modal-header">
              <h2>Новая операция</h2>
              <button
                className="family-secondary-btn"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={addTransaction}>
              <label>Тип операции</label>
              <select
                value={form.type}
                onChange={e => setForm({
                  ...form,
                  type: e.target.value,
                  category: e.target.value === 'income' ? 'salary' : 'food'
                })}
              >
                <option value="expense">Расход</option>
                <option value="income">Доход</option>
              </select>

              <label>Название</label>
              <input
                value={form.title}
                onChange={e => setForm({
                  ...form,
                  title: e.target.value
                })}
                placeholder="Например, Покупка продуктов"
                required
              />

              <label>Сумма (сум)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={e => setForm({
                  ...form,
                  amount: e.target.value
                })}
                placeholder="Например, 150000"
                required
              />

              <label>Категория</label>
              <select
                value={form.category}
                onChange={e => setForm({
                  ...form,
                  category: e.target.value
                })}
              >
                {categories[form.type].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <label>Описание</label>
              <textarea
                value={form.description}
                onChange={e => setForm({
                  ...form,
                  description: e.target.value
                })}
                placeholder="Дополнительная информация..."
              />

              <button
                className="family-primary-btn"
                type="submit"
              >
                <Plus size={18} />
                Сохранить операцию
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Budget
