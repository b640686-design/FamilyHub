
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Users,
  Mail,
  Lock,
  UserRound,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react'
import './Auth.css'

function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [isResetPassword, setIsResetPassword] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Определяем переход по ссылке восстановления пароля
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPassword(true)
        setIsForgotPassword(false)
        setIsLogin(false)
        setMessage('Придумай новый пароль.')
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Установка нового пароля
      if (isResetPassword) {
        const { error } = await supabase.auth.updateUser({
          password,
        })

        if (error) throw error

        setMessage('Пароль успешно изменён! Теперь можешь войти.')
        setIsResetPassword(false)
        setIsLogin(true)
        setPassword('')
        return
      }

      // Вход
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
      } else {
        // Регистрация
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name,
            },
          },
        })

        if (error) throw error

        if (data.user?.identities?.length === 0) {
          setMessage(
            'Если этот адрес уже зарегистрирован, попробуй войти или восстановить пароль. Если нет — проверь почту.'
          )
        } else {
          setMessage(
            'Регистрация отправлена! Проверь почту и подтверди email.'
          )
        }
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Отправка письма для восстановления
  async function handleForgotPassword(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })

      if (error) throw error

      setMessage(
        'Если аккаунт с таким адресом существует, на почту придёт письмо для восстановления пароля.'
      )
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setIsLogin(!isLogin)
    setIsForgotPassword(false)
    setIsResetPassword(false)
    setPassword('')
    setShowPassword(false)
    setMessage('')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <Users size={34} />
        </div>

        <h1 className="auth-title">
          Family<span>Hub</span>
        </h1>

        <p className="auth-subtitle">
          {isResetPassword
            ? 'Создай новый пароль'
            : isForgotPassword
              ? 'Восстановление доступа'
              : isLogin
                ? 'С возвращением!'
                : 'Создай своё семейное пространство'}
        </p>

        {/* Восстановление пароля */}
        {isForgotPassword ? (
          <form
            className="auth-form"
            onSubmit={handleForgotPassword}
          >
            <div className="auth-field">
              <label>Email</label>

              <div className="auth-input-wrap">
                <Mail size={19} />

                <input
                  className="auth-input"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                />
              </div>
            </div>

            <button
              className="auth-submit"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Отправка...' : 'Отправить письмо'}
            </button>

            <button
              className="auth-back"
              type="button"
              onClick={() => {
                setIsForgotPassword(false)
                setMessage('')
              }}
            >
              <ArrowLeft size={17} />
              Вернуться ко входу
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>

            {!isLogin && !isResetPassword && (
              <div className="auth-field">
                <label>Имя</label>

                <div className="auth-input-wrap">
                  <UserRound size={19} />

                  <input
                    className="auth-input"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Твоё имя"
                  />
                </div>
              </div>
            )}

            {!isResetPassword && (
              <div className="auth-field">
                <label>Email</label>

                <div className="auth-input-wrap">
                  <Mail size={19} />

                  <input
                    className="auth-input"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label>
                {isResetPassword ? 'Новый пароль' : 'Пароль'}
              </label>

              <div className="auth-input-wrap">
                <Lock size={19} />

                <input
                  className="auth-input"
                  required
                  minLength={6}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                />

                <button
                  className="auth-password-toggle"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? 'Скрыть пароль' : 'Показать пароль'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {isLogin && (
              <button
                className="auth-forgot"
                type="button"
                onClick={() => {
                  setIsForgotPassword(true)
                  setMessage('')
                }}
              >
                Забыли пароль?
              </button>
            )}

            <button
              className="auth-submit"
              disabled={loading}
              type="submit"
            >
              {loading
                ? 'Подождите...'
                : isResetPassword
                  ? 'Изменить пароль'
                  : isLogin
                    ? 'Войти в FamilyHub'
                    : 'Создать аккаунт'}
            </button>
          </form>
        )}

        {message && (
          <div className="auth-message">
            {message}
          </div>
        )}

        {!isForgotPassword && !isResetPassword && (
          <div className="auth-switch">
            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}

            <button type="button" onClick={switchMode}>
              {isLogin ? 'Регистрация' : 'Войти'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default Auth
