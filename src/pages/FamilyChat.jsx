
import { useEffect, useRef, useState } from 'react'
import {
  MessageCircle,
  Send,
  Trash2,
  LoaderCircle,
  Users,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

import './FamilyPages.css'

function FamilyChat({ setActive }) {
  const { t, language } = useLanguage()

  const [user, setUser] = useState(null)
  const [profileAvatar, setProfileAvatar] = useState(null)
  const [profileName, setProfileName] = useState('')
  const [groupId, setGroupId] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const bottomRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    let mounted = true

    async function initializeChat() {
      setLoading(true)
      setError('')

      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData?.user) {
        if (mounted) {
          setError('Не удалось определить пользователя.')
          setLoading(false)
        }
        return
      }

      const currentUser = authData.user

      if (!mounted) return
      setUser(currentUser)

      // Получаем имя и аватар из profiles
      const { data: profile, error: profileError } =
        await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', currentUser.id)
          .maybeSingle()

      if (profileError) {
        if (mounted) {
          setError(profileError.message)
          setLoading(false)
        }
        return
      }

      if (!mounted) return

      setProfileName(profile?.display_name || 'User')
      setProfileAvatar(profile?.avatar_url || null)

      // Получаем семейную группу
      const { data: membership, error: membershipError } =
        await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', currentUser.id)
          .maybeSingle()

      if (membershipError) {
        if (mounted) {
          setError(membershipError.message)
          setLoading(false)
        }
        return
      }

      if (!membership) {
        if (mounted) {
          setGroupId(null)
          setLoading(false)
        }
        return
      }

      if (!mounted) return
      setGroupId(membership.group_id)

      // Загружаем сообщения
      const { data: initialMessages, error: messagesError } =
        await supabase
          .from('family_messages')
          .select('*')
          .eq('group_id', membership.group_id)
          .order('created_at', { ascending: true })

      if (messagesError) {
        if (mounted) {
          setError(messagesError.message)
          setLoading(false)
        }
        return
      }

      if (!mounted) return

      setMessages(initialMessages || [])
      setLoading(false)
    }

    initializeChat()

    return () => {
      mounted = false

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  // Realtime: новые сообщения
  useEffect(() => {
    if (!groupId) return

    const channel = supabase
      .channel(`family-chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          setMessages((current) => {
            if (current.some((item) => item.id === payload.new.id)) {
              return current
            }

            return [...current, payload.new]
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)

      if (channelRef.current === channel) {
        channelRef.current = null
      }
    }
  }, [groupId])

  // Прокрутка к последнему сообщению
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [messages])

  // Отправка сообщения
  async function sendMessage(e) {
    e.preventDefault()

    const text = message.trim()

    if (!text || !groupId || !user || sending) return

    if (text.length > 2000) {
      setError('Максимальная длина сообщения — 2000 символов.')
      return
    }

    setSending(true)
    setError('')

    const { data, error: sendError } = await supabase
      .from('family_messages')
      .insert({
        group_id: groupId,
        user_id: user.id,
        message: text,
      })
      .select()
      .single()

    if (sendError) {
      setError(sendError.message)
    } else if (data) {
      setMessages((current) => {
        if (current.some((item) => item.id === data.id)) {
          return current
        }

        return [...current, data]
      })

      setMessage('')
    }

    setSending(false)
  }

  // Удаление сообщения
  async function deleteMessage(id) {
    const confirmed = window.confirm(
      'Удалить это сообщение?'
    )

    if (!confirmed) return

    const { error: deleteError } = await supabase
      .from('family_messages')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setMessages((current) =>
      current.filter((item) => item.id !== id)
    )
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat(
      language === 'uz' ? 'uz-UZ' :
      language === 'en' ? 'en-US' : 'ru-RU',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    ).format(new Date(date))
  }

  function formatDate(date) {
    const locale =
      language === 'uz' ? 'uz-UZ' :
      language === 'en' ? 'en-US' : 'ru-RU'

    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date))
  }

  function getInitial(name) {
    return (name || 'U').trim().charAt(0).toUpperCase()
  }

  function renderAvatar(avatar, name, own = false) {
    return (
      <div className={`family-chat-avatar ${own ? 'own-avatar' : ''}`}>
        {avatar ? (
          <img src={avatar} alt={name || 'Avatar'} />
        ) : (
          getInitial(name)
        )}
      </div>
    )
  }

  return (
    <div className="family-page family-chat-page">
      <div className="family-page-header">
        <div>
          <p className="family-page-label">FAMILYHUB</p>
          <h1 className="page-title">{t('familyChat')}</h1>
          <p className="page-description">
            {t('chatDescription')}
          </p>
        </div>

        <div className="family-page-icon">
          <MessageCircle size={27} />
        </div>
      </div>

      <div className="family-chat-card">
        <div className="family-chat-top">
          <div className="family-chat-top-icon">
            <Users size={20} />
          </div>

          <div>
            <h2>{t('familyChat')}</h2>
            <p>{t('chatDescription')}</p>
          </div>

          <span className="family-chat-live">
            <span />
            Live
          </span>
        </div>

        {loading ? (
          <div className="family-chat-state">
            <LoaderCircle className="family-chat-spinner" size={30} />
            <p>{t('loading')}</p>
          </div>
        ) : !groupId ? (
          <div className="family-chat-state">
            <div className="family-chat-empty-icon">
              <Users size={30} />
            </div>

            <h3>Ты пока не состоишь в семейной группе</h3>
            <p>
              Создай группу или вступи в существующую,
              чтобы начать общение.
            </p>

            <button
              className="family-primary-btn"
              onClick={() => setActive?.('Family Groups')}
            >
              <Users size={17} />
              {t('familyGroups')}
            </button>
          </div>
        ) : (
          <>
            <div className="family-chat-messages">
              {messages.length === 0 ? (
                <div className="family-chat-empty">
                  <div className="family-chat-empty-icon">
                    <MessageCircle size={30} />
                  </div>

                  <h3>{t('noMessages')}</h3>
                  <p>{t('chatDescription')}</p>
                </div>
              ) : (
                messages.map((item, index) => {
                  const own = item.user_id === user?.id

                  const showDate =
                    index === 0 ||
                    new Date(item.created_at).toDateString() !==
                    new Date(messages[index - 1].created_at).toDateString()

                  const senderName = own
                    ? profileName || item.sender_name
                    : item.sender_name

                  const avatar = own
                    ? profileAvatar || item.sender_avatar
                    : item.sender_avatar

                  return (
                    <div key={item.id}>
                      {showDate && (
                        <div className="family-chat-date">
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      )}

                      <div
                        className={`family-chat-message ${
                          own ? 'own' : ''
                        }`}
                      >
                        {!own && renderAvatar(
                          avatar,
                          senderName
                        )}

                        <div className="family-chat-message-content">
                          <span className="family-chat-sender">
                            {senderName || 'User'}
                          </span>

                          <div className="family-chat-bubble">
                            <p>{item.message}</p>

                            <div className="family-chat-message-meta">
                              <time>
                                {formatTime(item.created_at)}
                              </time>

                              {own && (
                                <button
                                  className="family-chat-delete"
                                  onClick={() => deleteMessage(item.id)}
                                  title={t('deleteMessage')}
                                  aria-label={t('deleteMessage')}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {own && renderAvatar(
                          avatar,
                          senderName,
                          true
                        )}
                      </div>
                    </div>
                  )
                })
              )}

              <div ref={bottomRef} />
            </div>

            {error && (
              <div className="family-chat-error">
                {error}
              </div>
            )}

            <form
              className="family-chat-form"
              onSubmit={sendMessage}
            >
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('messagePlaceholder')}
                maxLength={2000}
                rows={1}
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    e.currentTarget.form?.requestSubmit()
                  }
                }}
              />

              <button
                type="submit"
                className="family-chat-send"
                disabled={!message.trim() || sending}
                title={t('sendMessage')}
              >
                {sending ? (
                  <LoaderCircle
                    className="family-chat-spinner"
                    size={20}
                  />
                ) : (
                  <Send size={19} />
                )}
              </button>
            </form>

            <div className="family-chat-hint">
              Enter — отправить · Shift + Enter — новая строка
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default FamilyChat
