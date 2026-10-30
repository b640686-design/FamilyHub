
import { useEffect, useState } from 'react'
import {
  ShoppingCart,
  Plus,
  Trash2,
  X,
  Package,
  CheckCircle2,
  Wallet,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const categories = [
  'Продукты',
  'Напитки',
  'Дом',
  'Техника',
  'Одежда',
  'Другое',
]

const money = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 2,
})

function Shopping() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    name: '',
    quantity: '1',
    price: '',
    category: 'Продукты',
  })

  async function loadItems() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Shopping loading error:', error.message)
      setError('Не удалось загрузить список покупок.')
    } else {
      setItems(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadItems()
  }, [])

  async function addItem(e) {
    e.preventDefault()
    setError('')

    const quantity = Number(form.quantity)
    const price = Number(form.price || 0)

    if (!form.name.trim()) return

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError('Количество должно быть целым числом больше 0.')
      return
    }

    if (!Number.isFinite(price) || price < 0) {
      setError('Укажи корректную цену.')
      return
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Не удалось определить пользователя.')
      return
    }

    const { error } = await supabase
      .from('shopping_items')
      .insert({
        user_id: user.id,
        name: form.name.trim(),
        quantity,
        price,
        category: form.category,
      })

    if (error) {
      console.error('Shopping insert error:', error.message)
      setError('Не удалось сохранить товар.')
      return
    }

    setForm({
      name: '',
      quantity: '1',
      price: '',
      category: 'Продукты',
    })

    setShowForm(false)
    await loadItems()
  }

  async function toggleBought(item) {
    setError('')

    const { error } = await supabase
      .from('shopping_items')
      .update({ is_bought: !item.is_bought })
      .eq('id', item.id)

    if (error) {
      console.error('Shopping update error:', error.message)
      setError('Не удалось изменить статус покупки.')
      return
    }

    setItems((prev) =>
      prev.map((current) =>
        current.id === item.id
          ? { ...current, is_bought: !item.is_bought }
          : current
      )
    )
  }

  async function deleteItem(id) {
    setError('')

    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Shopping delete error:', error.message)
      setError('Не удалось удалить товар.')
      return
    }

    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const filteredItems = items.filter((item) => {
    if (filter === 'bought') return item.is_bought
    if (filter === 'remaining') return !item.is_bought
    return true
  })

  const boughtItems = items.filter((item) => item.is_bought)

  const totalPrice = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  )

  const boughtPrice = boughtItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  )

  const remainingCount = items.filter(
    (item) => !item.is_bought
  ).length

  function formatMoney(value) {
    return `${money.format(value)} сум`
  }

  return (
    <div className="family-page">
      <div className="family-page-header">
        <div>
          <p className="family-page-label">FAMILYHUB</p>
          <h1 className="page-title">Покупки</h1>
          <p className="page-description">
            Семейный список покупок в одном месте
          </p>
        </div>

        <div className="family-page-icon">
          <ShoppingCart size={28} />
        </div>
      </div>

      {error && (
        <p className="page-description">{error}</p>
      )}

      <div className="shopping-stats">
        <div className="shopping-stat">
          <Package size={22} />
          <span>Всего товаров</span>
          <strong>{items.length}</strong>
        </div>

        <div className="shopping-stat">
          <CheckCircle2 size={22} />
          <span>Куплено</span>
          <strong>{boughtItems.length}</strong>
        </div>

        <div className="shopping-stat">
          <ShoppingCart size={22} />
          <span>Осталось</span>
          <strong>{remainingCount}</strong>
        </div>

        <div className="shopping-stat">
          <Wallet size={22} />
          <span>Общая стоимость</span>
          <strong>{formatMoney(totalPrice)}</strong>
        </div>
      </div>

      <div className="family-page-card">
        <div className="shopping-toolbar">
          <div>
            <h2>Список покупок</h2>
            <p className="page-description">
              Куплено на {formatMoney(boughtPrice)}
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
          {[
            ['all', 'Все'],
            ['remaining', 'Осталось'],
            ['bought', 'Куплено'],
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
          <p className="page-description">
            Загрузка покупок...
          </p>
        ) : filteredItems.length === 0 ? (
          <p className="page-description">
            В этом списке пока нет товаров.
          </p>
        ) : (
          <div className="shopping-list">
            {filteredItems.map((item) => (
              <div className="shopping-item" key={item.id}>
                <input
                  className="shopping-check"
                  type="checkbox"
                  checked={item.is_bought}
                  onChange={() => toggleBought(item)}
                  aria-label="Отметить как купленный"
                />

                <div className="shopping-item-info">
                  <h3
                    style={{
                      textDecoration: item.is_bought
                        ? 'line-through'
                        : 'none',
                      opacity: item.is_bought ? 0.6 : 1,
                    }}
                  >
                    {item.name}
                  </h3>

                  <p>
                    {item.category} · Количество: {item.quantity}
                  </p>
                </div>

                <span className="shopping-price">
                  {formatMoney(Number(item.price) * item.quantity)}
                </span>

                <button
                  className="family-secondary-btn"
                  onClick={() => deleteItem(item.id)}
                  title="Удалить товар"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="shopping-total">
          <span>Общая стоимость</span>
          <span>{formatMoney(totalPrice)}</span>
        </div>
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
              <h2>Добавить товар</h2>

              <button
                className="family-secondary-btn"
                onClick={() => setShowForm(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={addItem}>
              <label>Название товара</label>
              <input
                type="text"
                placeholder="Например, молоко"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />

              <label>Количество</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
                required
              />

              <label>Цена за одну единицу (сум)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Например, 15000"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value })
                }
              />

              <label>Категория</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <button
                className="family-primary-btn"
                type="submit"
              >
                <Plus size={18} />
                Сохранить товар
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Shopping
