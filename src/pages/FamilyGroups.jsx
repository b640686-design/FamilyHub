
// import { useEffect, useState } from 'react'
// import { supabase } from '../lib/supabase'
// import {
//   Users,
//   Plus,
//   Crown,
//   LoaderCircle,
//   UsersRound,
//   Copy,
//   Link,
//   KeyRound,
//   Lock,
//   Trash2,
//   UserRound,
//   RefreshCw,
//   House,
//   PawPrint,
//   Star,
//   Heart,
//   Check,
//   Image,
// } from 'lucide-react'
// import './FamilyGroups.css'

// const avatars = [
//   { id: 'home', label: 'Дом', Icon: House },
//   { id: 'family', label: 'Семья', Icon: UsersRound },
//   { id: 'paw', label: 'Лапки', Icon: PawPrint },
//   { id: 'crown', label: 'Корона', Icon: Crown },
//   { id: 'stars', label: 'Звёзды', Icon: Star },
// ]

// function GroupAvatar({ value, size = 32 }) {
//   const avatar = avatars.find((item) => item.id === value)
//   const Icon = avatar?.Icon || UsersRound

//   return (
//     <div className="family-group-icon">
//       <Icon size={size} strokeWidth={1.8} />
//     </div>
//   )
// }

// function AvatarPicker({ value, onChange }) {
//   return (
//     <div className="family-avatar-picker">
//       <span className="family-avatar-label">Выбери аватарку группы</span>

//       <div className="family-avatar-options">
//         {avatars.map(({ id, label, Icon }) => (
//           <button
//             key={id}
//             type="button"
//             className={`family-avatar-option ${value === id ? 'selected' : ''
//               }`}
//             onClick={() => onChange(id)}
//             aria-label={label}
//             title={label}
//           >
//             <Icon size={25} />
//             <span>{label}</span>
//             {value === id && (
//               <span className="family-avatar-check">
//                 <Check size={13} />
//               </span>
//             )}
//           </button>
//         ))}
//       </div>
//     </div>
//   )
// }

// function FamilyGroups() {
//   const [group, setGroup] = useState(null)

//   const [editingName, setEditingName] = useState(false)
//   const [newGroupName, setNewGroupName] = useState('')
//   const [savingName, setSavingName] = useState(false)

//   const [members, setMembers] = useState([])

//   const [name, setName] = useState('')
//   const [password, setPassword] = useState('')
//   const [joinCode, setJoinCode] = useState('')
//   const [joinPassword, setJoinPassword] = useState('')

//   const [selectedAvatar, setSelectedAvatar] = useState('home')
//   const [savingAvatar, setSavingAvatar] = useState(false)

//   const [familyCode, setFamilyCode] = useState('')
//   const [inviteLink, setInviteLink] = useState('')
//   const [pendingInvite, setPendingInvite] = useState('')

//   const [loading, setLoading] = useState(true)
//   const [creating, setCreating] = useState(false)
//   const [joining, setJoining] = useState(false)
//   const [savingPassword, setSavingPassword] = useState(false)
//   const [creatingInvite, setCreatingInvite] = useState(false)
//   const [acceptingInvite, setAcceptingInvite] = useState(false)
//   const [deleting, setDeleting] = useState(false)

//   const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)

//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')

//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search)
//     const token = params.get('invite')

//     if (token) setPendingInvite(token)
//   }, [])

//   async function loadFamily() {
//     setLoading(true)
//     setError('')

//     try {
//       const { data: userData, error: userError } =
//         await supabase.auth.getUser()

//       if (userError) throw userError
//       if (!userData.user) throw new Error('Сначала войди в аккаунт.')

//       const { data, error: groupError } = await supabase
//         .from('group_members')
//         .select(`
//           role,
//           family_groups (
//             id,
//             name,
//             created_at,
//             avatar_url
//           )
//         `)
//         .eq('user_id', userData.user.id)
//         .maybeSingle()

//       if (groupError) throw groupError

//       if (!data?.family_groups) {
//         setGroup(null)
//         setMembers([])
//         setFamilyCode('')
//         return
//       }

//       const currentGroup = {
//         ...data.family_groups,
//         role: data.role,
//       }

//       setGroup(currentGroup)
//       setSelectedAvatar(currentGroup.avatar_url || 'home')

//       const { data: memberData, error: memberError } =
//         await supabase
//           .from('group_members')
//           .select(`
//             user_id,
//             role,
//             joined_at,
//             profiles (
//               display_name,
//               avatar_url
//             )
//           `)
//           .eq('group_id', currentGroup.id)
//           .order('joined_at', { ascending: true })

//       if (memberError) throw memberError

//       setMembers(memberData || [])

//       if (currentGroup.role === 'admin') {
//         const { data: code, error: codeError } =
//           await supabase.rpc('get_family_join_code', {
//             _group_id: currentGroup.id,
//           })

//         if (codeError) throw codeError

//         setFamilyCode(code)
//       } else {
//         setFamilyCode('')
//       }
//     } catch (err) {
//       setError(err.message || 'Не удалось загрузить семейную группу.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     loadFamily()
//   }, [])

//   async function createFamily(e) {
//     e.preventDefault()
//     setCreating(true)
//     setError('')
//     setSuccess('')

//     try {
//       const { data: groupId, error } = await supabase.rpc(
//         'create_family_group',
//         { _name: name.trim() }
//       )

//       if (error) throw error

//       const { error: avatarError } = await supabase.rpc(
//         'set_family_avatar',
//         {
//           _group_id: groupId,
//           _avatar: selectedAvatar,
//         }
//       )

//       if (avatarError) throw avatarError

//       setName('')
//       setSelectedAvatar('home')
//       setSuccess('Семейная группа успешно создана!')
//       await loadFamily()
//     } catch (err) {
//       setError(err.message || 'Не удалось создать семью.')
//       await loadFamily()
//     } finally {
//       setCreating(false)
//     }
//   }

//   async function changeAvatar(avatarId) {
//     if (!group || group.role !== 'admin') return

//     setSavingAvatar(true)
//     setError('')
//     setSuccess('')

//     try {
//       const { error } = await supabase.rpc(
//         'set_family_avatar',
//         {
//           _group_id: group.id,
//           _avatar: avatarId,
//         }
//       )

//       if (error) throw error

//       setSelectedAvatar(avatarId)
//       setGroup((previous) => ({
//         ...previous,
//         avatar_url: avatarId,
//       }))

//       setSuccess('Аватарка семьи обновлена!')
//     } catch (err) {
//       setError(err.message || 'Не удалось изменить аватарку.')
//     } finally {
//       setSavingAvatar(false)
//     }
//   }

//   async function renameGroup() {
//     if (!newGroupName.trim()) return

//     setSavingName(true)

//     const { error } = await supabase.rpc('rename_family_group', {
//       _group_id: group.id,
//       _new_name: newGroupName.trim(),
//     })

//     if (error) {
//       setError(error.message)
//     } else {
//       setGroup((prev) => ({
//         ...prev,
//         name: newGroupName.trim(),
//       }))

//       setEditingName(false)
//       setNewGroupName('')
//       setSuccess('Название группы успешно изменено!')
//     }

//     setSavingName(false)
//   }

//   async function savePassword(e) {
//     e.preventDefault()
//     setSavingPassword(true)
//     setError('')
//     setSuccess('')

//     try {
//       const { error } = await supabase.rpc(
//         'set_family_password',
//         {
//           _group_id: group.id,
//           _password: password,
//         }
//       )

//       if (error) throw error

//       setPassword('')
//       setSuccess('Пароль семьи успешно сохранён!')
//     } catch (err) {
//       setError(err.message || 'Не удалось сохранить пароль.')
//     } finally {
//       setSavingPassword(false)
//     }
//   }

//   async function createInvite() {
//     setCreatingInvite(true)
//     setError('')
//     setSuccess('')
//     setInviteLink('')

//     try {
//       const { data, error } = await supabase.rpc(
//         'create_family_invite',
//         { _group_id: group.id }
//       )

//       if (error) throw error

//       setInviteLink(
//         `https://familyhub-liard-gamma.vercel.app/?invite=${encodeURIComponent(data)}`
//       )
//       setSuccess('Приглашение создано! Оно действует 7 дней.')
//     } catch (err) {
//       setError(err.message || 'Не удалось создать приглашение.')
//     } finally {
//       setCreatingInvite(false)
//     }
//   }

//   async function copyText(value, message) {
//     try {
//       await navigator.clipboard.writeText(value)
//       setSuccess(message)
//       setError('')
//     } catch {
//       setError('Не удалось скопировать. Скопируй текст вручную.')
//     }
//   }

//   async function joinFamily(e) {
//     e.preventDefault()
//     setJoining(true)
//     setError('')
//     setSuccess('')

//     try {
//       const { error } = await supabase.rpc(
//         'join_family_by_password',
//         {
//           _join_code: joinCode.trim(),
//           _password: joinPassword,
//         }
//       )

//       if (error) throw error

//       setJoinCode('')
//       setJoinPassword('')
//       setSuccess('Ты успешно вступил в семейную группу!')
//       await loadFamily()
//     } catch (err) {
//       setError(err.message || 'Не удалось вступить в семью.')
//     } finally {
//       setJoining(false)
//     }
//   }

//   async function acceptInvite() {
//     setAcceptingInvite(true)
//     setError('')
//     setSuccess('')

//     try {
//       const { error } = await supabase.rpc(
//         'join_family_by_invite',
//         { _token: pendingInvite }
//       )

//       if (error) throw error

//       setPendingInvite('')

//       window.history.replaceState(
//         {},
//         '',
//         window.location.pathname
//       )

//       setSuccess('Ты успешно вступил в семейную группу!')
//       await loadFamily()
//     } catch (err) {
//       setError(err.message || 'Не удалось принять приглашение.')
//     } finally {
//       setAcceptingInvite(false)
//     }
//   }

//   async function removeMember(userId) {
//     const confirmed = window.confirm(
//       'Удалить этого участника из семейной группы?'
//     )

//     if (!confirmed) return

//     setError('')
//     setSuccess('')

//     try {
//       const { error } = await supabase.rpc(
//         'remove_family_member',
//         {
//           _group_id: group.id,
//           _user_id: userId,
//         }
//       )

//       if (error) throw error

//       setSuccess('Участник удалён из семьи.')
//       await loadFamily()
//     } catch (err) {
//       setError(err.message || 'Не удалось удалить участника.')
//     }
//   }

//   async function deleteFamily() {
//     const confirmed = window.confirm(
//       'ВНИМАНИЕ! Семья, её участники и приглашения будут удалены. Это действие нельзя отменить. Продолжить?'
//     )

//     if (!confirmed) return

//     setDeleting(true)
//     setError('')
//     setSuccess('')

//     try {
//       const { error } = await supabase.rpc(
//         'delete_family_group',
//         { _group_id: group.id }
//       )

//       if (error) throw error

//       setGroup(null)
//       setMembers([])
//       setFamilyCode('')
//       setInviteLink('')
//       setSuccess('Семейная группа удалена.')
//     } catch (err) {
//       setError(err.message || 'Не удалось удалить семью.')
//     } finally {
//       setDeleting(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="family-loading">
//         <LoaderCircle className="family-spinner" size={28} />
//         <p>Загружаем семейное пространство...</p>
//       </div>
//     )
//   }

//   return (
//     <div className="family-groups-page">
//       <header className="family-page-header">
//         <p className="page-label">ТВОИ БЛИЗКИЕ</p>
//         <h1 className="page-title">Семейные группы</h1>
//         <p className="page-description">
//           Создавай семейное пространство и приглашай близких.
//         </p>
//       </header>

//       {error && (
//         <div className="family-alert family-alert-error">
//           {error}
//         </div>
//       )}

//       {success && (
//         <div className="family-alert family-alert-success">
//           {success}
//         </div>
//       )}

//       {pendingInvite && (
//         <section className="family-tool-card family-pending-invite">
//           <div className="family-tool-icon">
//             <UsersRound size={25} />
//           </div>

//           <h2>Тебя пригласили в семью!</h2>

//           <p>
//             Прими приглашение, чтобы присоединиться к семейной группе.
//           </p>

//           <button
//             className="family-create-button"
//             onClick={acceptInvite}
//             disabled={acceptingInvite || !!group}
//             type="button"
//           >
//             {acceptingInvite ? (
//               <LoaderCircle className="family-spinner" size={18} />
//             ) : (
//               <UsersRound size={18} />
//             )}
//             {group ? 'Ты уже состоишь в семье' : 'Принять приглашение'}
//           </button>
//         </section>
//       )}

//       {group ? (
//         <>
//           <section className="family-group-card">
//             <GroupAvatar value={group.avatar_url} size={32} />

//             <div className="family-group-info">
//               <span className="family-status">
//                 <span className="family-status-dot" />
//                 Семейная группа
//               </span>

//               <h2>{group.name}</h2>

//               <p>
//                 Создана{' '}
//                 {new Date(group.created_at).toLocaleDateString('ru-RU')}
//               </p>
//             </div>

//             <div className="family-role">
//               <Crown size={17} />
//               {group.role === 'admin' ? 'Администратор' : 'Участник'}
//             </div>
//           </section>


//           {group.role === 'admin' && (
//             <section className="family-avatar-settings">
//               <button
//                 type="button"
//                 className="family-avatar-toggle"
//                 onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
//               >
//                 <Image size={18} />
//                 Изменить аватарку
//                 <span>{avatarMenuOpen ? '▲' : '▼'}</span>
//               </button>

//               {avatarMenuOpen && (
//                 <AvatarPicker
//                   value={selectedAvatar}
//                   onChange={(id) => {
//                     changeAvatar(id)
//                     setAvatarMenuOpen(false)
//                   }}
//                 />
//               )}

//               {savingAvatar && (
//                 <span className="family-saving-avatar">
//                   <LoaderCircle className="family-spinner" size={16} />
//                   Сохраняем...
//                 </span>
//               )}
//             </section>
//           )}

//           {group.role === 'admin' && (
//             <section className="family-name-settings">
//               {editingName ? (
//                 <div className="family-name-editor">
//                   <input
//                     type="text"
//                     value={newGroupName}
//                     onChange={(e) => setNewGroupName(e.target.value)}
//                     placeholder="Новое название группы"
//                     maxLength={50}
//                   />

//                   <button
//                     type="button"
//                     onClick={renameGroup}
//                     disabled={savingName || newGroupName.trim().length < 2}
//                   >
//                     {savingName ? 'Сохранение...' : 'Сохранить'}
//                   </button>

//                   <button
//                     type="button"
//                     onClick={() => {
//                       setEditingName(false)
//                       setNewGroupName('')
//                     }}
//                   >
//                     Отмена
//                   </button>
//                 </div>
//               ) : (
//                 <button
//                   type="button"
//                   className="family-avatar-toggle"
//                   onClick={() => {
//                     setNewGroupName(group.name)
//                     setEditingName(true)
//                   }}
//                 >
//                   Изменить название
//                   <span>▼</span>
//                 </button>
//               )}
//             </section>
//           )}


//           <section className="family-members-section">
//             <div className="family-section-heading">
//               <div>
//                 <h2>Участники семьи</h2>
//                 <p>{members.length} из 20 участников</p>
//               </div>

//               <button
//                 className="family-refresh-button"
//                 onClick={loadFamily}
//                 type="button"
//                 title="Обновить"
//               >
//                 <RefreshCw size={18} />
//               </button>
//             </div>

//             <div className="family-members-list">
//               {members.map((member) => (
//                 <div className="family-member" key={member.user_id}>
//                   <div className="family-member-avatar">
//                     {member.profiles?.avatar_url ? (
//                       <img
//                         src={member.profiles.avatar_url}
//                         alt=""
//                       />
//                     ) : (
//                       <UserRound size={21} />
//                     )}
//                   </div>

//                   <div className="family-member-info">
//                     <strong>
//                       {member.profiles?.display_name || 'Пользователь'}
//                     </strong>

//                     <span>
//                       {member.role === 'admin'
//                         ? 'Создатель семьи'
//                         : 'Участник семьи'}
//                     </span>

//                     <small>
//                       В семье с{' '}
//                       {new Date(member.joined_at).toLocaleDateString('ru-RU')}
//                     </small>
//                   </div>

//                   {member.role === 'admin' ? (
//                     <span className="family-admin-badge">
//                       <Crown size={14} />
//                       Admin
//                     </span>
//                   ) : (
//                     group.role === 'admin' && (
//                       <button
//                         className="family-remove-button"
//                         type="button"
//                         onClick={() => removeMember(member.user_id)}
//                         title="Удалить участника"
//                       >
//                         <Trash2 size={17} />
//                       </button>
//                     )
//                   )}
//                 </div>
//               ))}
//             </div>
//           </section>

//           {group.role === 'admin' && (
//             <>
//               <div className="family-tools-grid">
//                 <section className="family-tool-card">
//                   <div className="family-tool-icon">
//                     <KeyRound size={25} />
//                   </div>

//                   <h2>Код семьи</h2>

//                   <p>
//                     Передай код человеку, которого хочешь пригласить.
//                     Ему также понадобится пароль семьи.
//                   </p>

//                   <div className="family-code-box">
//                     <strong>{familyCode || 'Загрузка...'}</strong>

//                     <button
//                       type="button"
//                       onClick={() =>
//                         copyText(familyCode, 'Код семьи скопирован!')
//                       }
//                       disabled={!familyCode}
//                       title="Копировать код"
//                     >
//                       <Copy size={17} />
//                     </button>
//                   </div>
//                 </section>

//                 <section className="family-tool-card">
//                   <div className="family-tool-icon">
//                     <Lock size={25} />
//                   </div>

//                   <h2>Пароль семьи</h2>

//                   <p>
//                     Установи новый пароль для вступления по коду.
//                   </p>

//                   <form onSubmit={savePassword}>
//                     <label htmlFor="family-password">
//                       Новый пароль
//                     </label>

//                     <input
//                       id="family-password"
//                       type="password"
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       placeholder="Минимум 6 символов"
//                       minLength={6}
//                       maxLength={72}
//                       required
//                     />

//                     <button
//                       className="family-create-button"
//                       type="submit"
//                       disabled={savingPassword}
//                     >
//                       {savingPassword ? (
//                         <LoaderCircle className="family-spinner" size={18} />
//                       ) : (
//                         <Lock size={18} />
//                       )}
//                       Сохранить пароль
//                     </button>
//                   </form>
//                 </section>

//                 <section className="family-tool-card">
//                   <div className="family-tool-icon">
//                     <Link size={25} />
//                   </div>

//                   <h2>Приглашение по ссылке</h2>

//                   <p>
//                     Создай одноразовую ссылку. Она действует 7 дней.
//                   </p>

//                   <button
//                     className="family-create-button"
//                     type="button"
//                     onClick={createInvite}
//                     disabled={creatingInvite}
//                   >
//                     {creatingInvite ? (
//                       <LoaderCircle className="family-spinner" size={18} />
//                     ) : (
//                       <Plus size={18} />
//                     )}
//                     Создать приглашение
//                   </button>

//                   {inviteLink && (
//                     <div className="family-invite-result">
//                       <label>Ссылка-приглашение</label>

//                       <input value={inviteLink} readOnly />

//                       <button
//                         className="family-copy-button"
//                         type="button"
//                         onClick={() =>
//                           copyText(inviteLink, 'Ссылка скопирована!')
//                         }
//                       >
//                         <Copy size={17} />
//                         Копировать ссылку
//                       </button>
//                     </div>
//                   )}
//                 </section>
//               </div>

//               <section className="family-danger-zone">
//                 <div>
//                   <h2>Удаление семьи</h2>
//                   <p>
//                     Удаление необратимо. Все участники будут
//                     исключены из группы.
//                   </p>
//                 </div>

//                 <button
//                   type="button"
//                   className="family-delete-button"
//                   onClick={deleteFamily}
//                   disabled={deleting}
//                 >
//                   {deleting ? (
//                     <LoaderCircle className="family-spinner" size={18} />
//                   ) : (
//                     <Trash2 size={18} />
//                   )}
//                   Удалить семью
//                 </button>
//               </section>
//             </>
//           )}
//         </>
//       ) : (
//         <div className="family-tools-grid">
//           <section className="family-create-card">
//             <div className="family-create-icon">
//               <Users size={32} />
//             </div>

//             <h2>Создай свою семью</h2>

//             <p>
//               Придумай название семейной группы. После создания
//               ты станешь её администратором.
//             </p>

//             <form
//               onSubmit={createFamily}
//               className="family-create-form"
//             >
//               <label htmlFor="family-name">Название семьи</label>

//               <input
//                 id="family-name"
//                 type="text"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 placeholder="Например, Моя семья"
//                 minLength={2}
//                 maxLength={50}
//                 required
//               />

//               <AvatarPicker
//                 value={selectedAvatar}
//                 onChange={setSelectedAvatar}
//               />

//               <button
//                 type="submit"
//                 className="family-create-button"
//                 disabled={creating}
//               >
//                 {creating ? (
//                   <LoaderCircle className="family-spinner" size={19} />
//                 ) : (
//                   <Plus size={20} />
//                 )}
//                 Создать семейную группу
//               </button>
//             </form>

//             <div className="family-create-note">
//               <UsersRound size={18} />
//               <span>Максимум 20 участников в одной семье.</span>
//             </div>
//           </section>

//           <section className="family-tool-card">
//             <div className="family-tool-icon">
//               <KeyRound size={25} />
//             </div>

//             <h2>Вступить в семью</h2>

//             <p>
//               Введи код и пароль, которые тебе передал администратор.
//               Название семьи вводить не нужно.
//             </p>

//             <form onSubmit={joinFamily}>
//               <label htmlFor="join-code">Код семьи</label>

//               <input
//                 id="join-code"
//                 type="text"
//                 value={joinCode}
//                 onChange={(e) => setJoinCode(e.target.value)}
//                 placeholder="Введи код семьи"
//                 required
//               />

//               <label htmlFor="join-password">Пароль семьи</label>

//               <input
//                 id="join-password"
//                 type="password"
//                 value={joinPassword}
//                 onChange={(e) => setJoinPassword(e.target.value)}
//                 placeholder="Введи пароль"
//                 required
//               />

//               <button
//                 className="family-create-button"
//                 type="submit"
//                 disabled={joining}
//               >
//                 {joining ? (
//                   <LoaderCircle className="family-spinner" size={18} />
//                 ) : (
//                   <UsersRound size={18} />
//                 )}
//                 Вступить в семью
//               </button>
//             </form>
//           </section>
//         </div>
//       )}
//     </div>
//   )
// }

// export default FamilyGroups







import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Users,
  Plus,
  Crown,
  LoaderCircle,
  UsersRound,
  Copy,
  Link,
  KeyRound,
  Lock,
  Trash2,
  UserRound,
  RefreshCw,
  House,
  PawPrint,
  Star,
  Check,
  Image,
} from 'lucide-react'
import './FamilyGroups.css'

const avatars = [
  { id: 'home', label: 'Дом', Icon: House },
  { id: 'family', label: 'Семья', Icon: UsersRound },
  { id: 'paw', label: 'Лапки', Icon: PawPrint },
  { id: 'crown', label: 'Корона', Icon: Crown },
  { id: 'stars', label: 'Звёзды', Icon: Star },
]

// Сжатие фотографии перед загрузкой
async function compressAvatar(file) {
  const bitmap = await createImageBitmap(file)

  const maxSize = 512

  const scale = Math.min(
    maxSize / bitmap.width,
    maxSize / bitmap.height,
    1
  )

  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    bitmap.close()
    throw new Error('Не удалось обработать фотографию.')
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Не удалось сжать фотографию.'))
          return
        }

        resolve(blob)
      },
      'image/webp',
      0.82
    )
  })
}

// Получение пути фотографии из публичной ссылки
function getAvatarPath(url, groupId) {
  if (!url || !url.startsWith('http')) return null

  try {
    const pathname = new URL(url).pathname
    const marker = '/family_groups/'
    const index = pathname.indexOf(marker)

    if (index === -1) return null

    const path = decodeURIComponent(
      pathname.slice(index + marker.length)
    )

    // Проверяем, что фотография принадлежит именно этой семье
    if (!path.startsWith(`${groupId}/`)) return null

    return path
  } catch {
    return null
  }
}

async function deleteOldAvatar(oldAvatarUrl, groupId) {
  const oldPath = getAvatarPath(oldAvatarUrl, groupId)

  console.log('Старая ссылка:', oldAvatarUrl)
  console.log('ID семьи:', groupId)
  console.log('Путь для удаления:', oldPath)

  if (!oldPath) {
    console.log('Путь не найден — удаление пропущено')
    return
  }

  const { data, error } = await supabase.storage
    .from('family_groups')
    .remove([oldPath])

  console.log('Результат удаления:', data)
  console.log('Ошибка удаления:', error)
}

function GroupAvatar({ value, size = 32 }) {
  const isImage =
    typeof value === 'string' && value.startsWith('http')

  if (isImage) {
    return (
      <div className="family-group-icon">
        <img
          src={value}
          alt="Аватар семьи"
          className="family-group-avatar-image"
        />
      </div>
    )
  }

  const avatar = avatars.find((item) => item.id === value)
  const Icon = avatar?.Icon || UsersRound

  return (
    <div className="family-group-icon">
      <Icon size={size} strokeWidth={1.8} />
    </div>
  )
}

function AvatarPicker({
  value,
  onChange,
  onCustomSelect,
  customPreview,
}) {
  const isCustom =
    typeof value === 'string' && value.startsWith('http')

  return (
    <div className="family-avatar-picker">
      <span className="family-avatar-label">
        Выбери аватарку группы
      </span>

      <div className="family-avatar-options">
        {avatars.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`family-avatar-option ${value === id ? 'selected' : ''
              }`}
            onClick={() => onChange(id)}
            aria-label={label}
            title={label}
          >
            <Icon size={25} />
            <span>{label}</span>

            {value === id && (
              <span className="family-avatar-check">
                <Check size={13} />
              </span>
            )}
          </button>
        ))}

        <label
          className={`family-avatar-option family-custom-avatar ${isCustom || customPreview ? 'selected' : ''
            }`}
          title="Выбрать свою фотографию"
        >
          {customPreview || isCustom ? (
            <img
              src={customPreview || value}
              alt="Своя аватарка"
            />
          ) : (
            <Image size={25} />
          )}

          <span>Своя</span>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0]

              if (file) {
                onCustomSelect(file)
              }

              e.target.value = ''
            }}
          />

          {(isCustom || customPreview) && (
            <span className="family-avatar-check">
              <Check size={13} />
            </span>
          )}
        </label>
      </div>
    </div>
  )
}

function FamilyGroups() {
  const [group, setGroup] = useState(null)

  const [editingName, setEditingName] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [members, setMembers] = useState([])

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinPassword, setJoinPassword] = useState('')

  const [selectedAvatar, setSelectedAvatar] = useState('home')
  const [customAvatarFile, setCustomAvatarFile] = useState(null)
  const [customAvatarPreview, setCustomAvatarPreview] = useState('')
  const [savingAvatar, setSavingAvatar] = useState(false)

  const [familyCode, setFamilyCode] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [pendingInvite, setPendingInvite] = useState('')

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [acceptingInvite, setAcceptingInvite] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('invite')

    if (token) setPendingInvite(token)
  }, [])

  // Сжатие и загрузка фотографии в Supabase Storage
  async function uploadCustomAvatar(
    file,
    groupId,
    oldAvatarUrl = null
  ) {
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Выбери фотографию PNG, JPG или WEBP.')
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Размер фотографии не должен превышать 5 МБ.')
    }

    // Сжимаем фотографию
    const compressedFile = await compressAvatar(file)

    // Создаём уникальное имя файла
    const filePath = `${groupId}/${crypto.randomUUID()}.webp`

    // Загружаем сжатую фотографию
    const { error: uploadError } = await supabase.storage
      .from('family_groups')
      .upload(filePath, compressedFile, {
        contentType: 'image/webp',
        upsert: false,
      })

    if (uploadError) throw uploadError

    // Получаем публичную ссылку
    const { data } = supabase.storage
      .from('family_groups')
      .getPublicUrl(filePath)

    const publicUrl = data.publicUrl

    // Сохраняем ссылку в базе данных
    const { error: updateError } = await supabase
      .from('family_groups')
      .update({ avatar_url: publicUrl })
      .eq('id', groupId)

    // Если база не обновилась, удаляем только что загруженный файл
    if (updateError) {
      await supabase.storage
        .from('family_groups')
        .remove([filePath])

      throw updateError
    }

    // Удаляем предыдущую фотографию после успешного обновления
    if (oldAvatarUrl?.startsWith('http')) {
      await deleteOldAvatar(oldAvatarUrl, groupId)
    }

    return publicUrl
  }

  // Выбор фотографии из галереи
  function handleCustomAvatar(file) {
    if (!file) return

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Выбери фотографию PNG, JPG или WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Размер фотографии не должен превышать 5 МБ.')
      return
    }

    setError('')
    setSuccess('')

    if (customAvatarPreview) {
      URL.revokeObjectURL(customAvatarPreview)
    }

    setCustomAvatarFile(file)
    setCustomAvatarPreview(URL.createObjectURL(file))
  }

  async function loadFamily() {
    setLoading(true)
    setError('')

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError) throw userError
      if (!userData.user) {
        throw new Error('Сначала войди в аккаунт.')
      }

      const { data, error: groupError } = await supabase
        .from('group_members')
        .select(`
          role,
          family_groups (
            id,
            name,
            created_at,
            avatar_url
          )
        `)
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (groupError) throw groupError

      if (!data?.family_groups) {
        setGroup(null)
        setMembers([])
        setFamilyCode('')
        return
      }

      const currentGroup = {
        ...data.family_groups,
        role: data.role,
      }

      setGroup(currentGroup)
      setSelectedAvatar(currentGroup.avatar_url || 'home')

      const { data: memberData, error: memberError } =
        await supabase
          .from('group_members')
          .select(`
            user_id,
            role,
            joined_at,
            profiles (
              display_name,
              avatar_url
            )
          `)
          .eq('group_id', currentGroup.id)
          .order('joined_at', { ascending: true })

      if (memberError) throw memberError

      setMembers(memberData || [])

      if (currentGroup.role === 'admin') {
        const { data: code, error: codeError } =
          await supabase.rpc('get_family_join_code', {
            _group_id: currentGroup.id,
          })

        if (codeError) throw codeError

        setFamilyCode(code)
      } else {
        setFamilyCode('')
      }
    } catch (err) {
      setError(err.message || 'Не удалось загрузить семейную группу.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFamily()
  }, [])

  // Создание семьи
  async function createFamily(e) {
    e.preventDefault()
    setCreating(true)
    setError('')
    setSuccess('')

    try {
      const { data: groupId, error } = await supabase.rpc(
        'create_family_group',
        { _name: name.trim() }
      )

      if (error) throw error

      if (customAvatarFile) {
        await uploadCustomAvatar(customAvatarFile, groupId)
      } else {
        const { error: avatarError } = await supabase.rpc(
          'set_family_avatar',
          {
            _group_id: groupId,
            _avatar: selectedAvatar,
          }
        )

        if (avatarError) throw avatarError
      }

      setName('')
      setSelectedAvatar('home')
      setCustomAvatarFile(null)

      if (customAvatarPreview) {
        URL.revokeObjectURL(customAvatarPreview)
      }

      setCustomAvatarPreview('')
      setSuccess('Семейная группа успешно создана!')

      await loadFamily()
    } catch (err) {
      setError(err.message || 'Не удалось создать семью.')
      await loadFamily()
    } finally {
      setCreating(false)
    }
  }

  // Выбор одной из пяти стандартных аватарок
  async function changeAvatar(avatarId) {
    if (!group || group.role !== 'admin') return

    setSavingAvatar(true)
    setError('')
    setSuccess('')

    try {
      const oldAvatarUrl = group.avatar_url

      const { error } = await supabase.rpc(
        'set_family_avatar',
        {
          _group_id: group.id,
          _avatar: avatarId,
        }
      )

      if (error) throw error

      // Удаляем старую фотографию, если она была
      if (
        typeof oldAvatarUrl === 'string' &&
        oldAvatarUrl.startsWith('http')
      ) {
        await deleteOldAvatar(oldAvatarUrl, group.id)
      }

      setSelectedAvatar(avatarId)
      setCustomAvatarFile(null)

      if (customAvatarPreview) {
        URL.revokeObjectURL(customAvatarPreview)
      }

      setCustomAvatarPreview('')

      setGroup((previous) => ({
        ...previous,
        avatar_url: avatarId,
      }))

      setSuccess('Аватарка семьи обновлена!')
    } catch (err) {
      setError(err.message || 'Не удалось изменить аватарку.')
    } finally {
      setSavingAvatar(false)
    }
  }

  // Загрузка собственной фотографии для существующей семьи
  async function changeCustomAvatar(file) {
    if (!group || group.role !== 'admin') return

    setSavingAvatar(true)
    setError('')
    setSuccess('')

    try {
      const publicUrl = await uploadCustomAvatar(
        file,
        group.id,
        group.avatar_url
      )

      setSelectedAvatar(publicUrl)
      setCustomAvatarFile(null)

      if (customAvatarPreview) {
        URL.revokeObjectURL(customAvatarPreview)
      }

      setCustomAvatarPreview('')

      setGroup((previous) => ({
        ...previous,
        avatar_url: publicUrl,
      }))

      setSuccess('Фотография семьи обновлена!')
    } catch (err) {
      setError(err.message || 'Не удалось загрузить фотографию.')
    } finally {
      setSavingAvatar(false)
    }
  }

  async function renameGroup() {
    if (!newGroupName.trim()) return

    setSavingName(true)

    const { error } = await supabase.rpc('rename_family_group', {
      _group_id: group.id,
      _new_name: newGroupName.trim(),
    })

    if (error) {
      setError(error.message)
    } else {
      setGroup((prev) => ({
        ...prev,
        name: newGroupName.trim(),
      }))

      setEditingName(false)
      setNewGroupName('')
      setSuccess('Название группы успешно изменено!')
    }

    setSavingName(false)
  }

  async function savePassword(e) {
    e.preventDefault()
    setSavingPassword(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.rpc(
        'set_family_password',
        {
          _group_id: group.id,
          _password: password,
        }
      )

      if (error) throw error

      setPassword('')
      setSuccess('Пароль семьи успешно сохранён!')
    } catch (err) {
      setError(err.message || 'Не удалось сохранить пароль.')
    } finally {
      setSavingPassword(false)
    }
  }

  async function createInvite() {
    setCreatingInvite(true)
    setError('')
    setSuccess('')
    setInviteLink('')

    try {
      const { data, error } = await supabase.rpc(
        'create_family_invite',
        { _group_id: group.id }
      )

      if (error) throw error

      setInviteLink(
        `https://familyhub-liard-gamma.vercel.app/?invite=${encodeURIComponent(data)}`
      )

      setSuccess('Приглашение создано! Оно действует 7 дней.')
    } catch (err) {
      setError(err.message || 'Не удалось создать приглашение.')
    } finally {
      setCreatingInvite(false)
    }
  }

  async function copyText(value, message) {
    try {
      await navigator.clipboard.writeText(value)
      setSuccess(message)
      setError('')
    } catch {
      setError('Не удалось скопировать. Скопируй текст вручную.')
    }
  }

  async function joinFamily(e) {
    e.preventDefault()
    setJoining(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.rpc(
        'join_family_by_password',
        {
          _join_code: joinCode.trim(),
          _password: joinPassword,
        }
      )

      if (error) throw error

      setJoinCode('')
      setJoinPassword('')
      setSuccess('Ты успешно вступил в семейную группу!')

      await loadFamily()
    } catch (err) {
      setError(err.message || 'Не удалось вступить в семью.')
    } finally {
      setJoining(false)
    }
  }

  async function acceptInvite() {
    setAcceptingInvite(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.rpc(
        'join_family_by_invite',
        { _token: pendingInvite }
      )

      if (error) throw error

      setPendingInvite('')

      window.history.replaceState(
        {},
        '',
        window.location.pathname
      )

      setSuccess('Ты успешно вступил в семейную группу!')
      await loadFamily()
    } catch (err) {
      setError(err.message || 'Не удалось принять приглашение.')
    } finally {
      setAcceptingInvite(false)
    }
  }

  async function removeMember(userId) {
    const confirmed = window.confirm(
      'Удалить этого участника из семейной группы?'
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.rpc(
        'remove_family_member',
        {
          _group_id: group.id,
          _user_id: userId,
        }
      )

      if (error) throw error

      setSuccess('Участник удалён из семьи.')
      await loadFamily()
    } catch (err) {
      setError(err.message || 'Не удалось удалить участника.')
    }
  }

  async function deleteFamily() {
    const confirmed = window.confirm(
      'ВНИМАНИЕ! Семья, её участники и приглашения будут удалены. Это действие нельзя отменить. Продолжить?'
    )

    if (!confirmed) return

    setDeleting(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.rpc(
        'delete_family_group',
        { _group_id: group.id }
      )

      if (error) throw error

      setGroup(null)
      setMembers([])
      setFamilyCode('')
      setInviteLink('')
      setSuccess('Семейная группа удалена.')
    } catch (err) {
      setError(err.message || 'Не удалось удалить семью.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="family-loading">
        <LoaderCircle className="family-spinner" size={28} />
        <p>Загружаем семейное пространство...</p>
      </div>
    )
  }

  return (
    <div className="family-groups-page">
      <header className="family-page-header">
        <p className="page-label">ТВОИ БЛИЗКИЕ</p>
        <h1 className="page-title">Семейные группы</h1>
        <p className="page-description">
          Создавай семейное пространство и приглашай близких.
        </p>
      </header>

      {error && (
        <div className="family-alert family-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="family-alert family-alert-success">
          {success}
        </div>
      )}

      {pendingInvite && (
        <section className="family-tool-card family-pending-invite">
          <div className="family-tool-icon">
            <UsersRound size={25} />
          </div>

          <h2>Тебя пригласили в семью!</h2>

          <p>
            Прими приглашение, чтобы присоединиться к семейной группе.
          </p>

          <button
            className="family-create-button"
            onClick={acceptInvite}
            disabled={acceptingInvite || !!group}
            type="button"
          >
            {acceptingInvite ? (
              <LoaderCircle className="family-spinner" size={18} />
            ) : (
              <UsersRound size={18} />
            )}
            {group ? 'Ты уже состоишь в семье' : 'Принять приглашение'}
          </button>
        </section>
      )}

      {group ? (
        <>
          <section className="family-group-card">
            <GroupAvatar value={group.avatar_url} size={32} />

            <div className="family-group-info">
              <span className="family-status">
                <span className="family-status-dot" />
                Семейная группа
              </span>

              <h2>{group.name}</h2>

              <p>
                Создана{' '}
                {new Date(group.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>

            <div className="family-role">
              <Crown size={17} />
              {group.role === 'admin' ? 'Администратор' : 'Участник'}
            </div>
          </section>

          {group.role === 'admin' && (
            <section className="family-avatar-settings">
              <button
                type="button"
                className="family-avatar-toggle"
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              >
                <Image size={18} />
                Изменить аватарку
                <span>{avatarMenuOpen ? '▲' : '▼'}</span>
              </button>

              {avatarMenuOpen && (
                <AvatarPicker
                  value={selectedAvatar}
                  customPreview={customAvatarPreview}
                  onChange={changeAvatar}
                  onCustomSelect={changeCustomAvatar}
                />
              )}

              {savingAvatar && (
                <span className="family-saving-avatar">
                  <LoaderCircle className="family-spinner" size={16} />
                  Сохраняем...
                </span>
              )}
            </section>
          )}

          {group.role === 'admin' && (
            <section className="family-name-settings">
              {editingName ? (
                <div className="family-name-editor">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Новое название группы"
                    maxLength={50}
                  />

                  <button
                    type="button"
                    onClick={renameGroup}
                    disabled={savingName || newGroupName.trim().length < 2}
                  >
                    {savingName ? 'Сохранение...' : 'Сохранить'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(false)
                      setNewGroupName('')
                    }}
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="family-avatar-toggle"
                  onClick={() => {
                    setNewGroupName(group.name)
                    setEditingName(true)
                  }}
                >
                  Изменить название
                  <span>▼</span>
                </button>
              )}
            </section>
          )}

          <section className="family-members-section">
            <div className="family-section-heading">
              <div>
                <h2>Участники семьи</h2>
                <p>{members.length} из 20 участников</p>
              </div>

              <button
                className="family-refresh-button"
                onClick={loadFamily}
                type="button"
                title="Обновить"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="family-members-list">
              {members.map((member) => (
                <div className="family-member" key={member.user_id}>
                  <div className="family-member-avatar">
                    {member.profiles?.avatar_url ? (
                      <img
                        src={member.profiles.avatar_url}
                        alt=""
                      />
                    ) : (
                      <UserRound size={21} />
                    )}
                  </div>

                  <div className="family-member-info">
                    <strong>
                      {member.profiles?.display_name || 'Пользователь'}
                    </strong>

                    <span>
                      {member.role === 'admin'
                        ? 'Создатель семьи'
                        : 'Участник семьи'}
                    </span>

                    <small>
                      В семье с{' '}
                      {new Date(member.joined_at).toLocaleDateString('ru-RU')}
                    </small>
                  </div>

                  {member.role === 'admin' ? (
                    <span className="family-admin-badge">
                      <Crown size={14} />
                      Admin
                    </span>
                  ) : (
                    group.role === 'admin' && (
                      <button
                        className="family-remove-button"
                        type="button"
                        onClick={() => removeMember(member.user_id)}
                        title="Удалить участника"
                      >
                        <Trash2 size={17} />
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </section>

          {group.role === 'admin' && (
            <>
              <div className="family-tools-grid">
                <section className="family-tool-card">
                  <div className="family-tool-icon">
                    <KeyRound size={25} />
                  </div>

                  <h2>Код семьи</h2>

                  <p>
                    Передай код человеку, которого хочешь пригласить.
                    Ему также понадобится пароль семьи.
                  </p>

                  <div className="family-code-box">
                    <strong>{familyCode || 'Загрузка...'}</strong>

                    <button
                      type="button"
                      onClick={() =>
                        copyText(familyCode, 'Код семьи скопирован!')
                      }
                      disabled={!familyCode}
                      title="Копировать код"
                    >
                      <Copy size={17} />
                    </button>
                  </div>
                </section>

                <section className="family-tool-card">
                  <div className="family-tool-icon">
                    <Lock size={25} />
                  </div>

                  <h2>Пароль семьи</h2>

                  <p>
                    Установи новый пароль для вступления по коду.
                  </p>

                  <form onSubmit={savePassword}>
                    <label htmlFor="family-password">
                      Новый пароль
                    </label>

                    <input
                      id="family-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      minLength={6}
                      maxLength={72}
                      required
                    />

                    <button
                      className="family-create-button"
                      type="submit"
                      disabled={savingPassword}
                    >
                      {savingPassword ? (
                        <LoaderCircle className="family-spinner" size={18} />
                      ) : (
                        <Lock size={18} />
                      )}
                      Сохранить пароль
                    </button>
                  </form>
                </section>

                <section className="family-tool-card">
                  <div className="family-tool-icon">
                    <Link size={25} />
                  </div>

                  <h2>Приглашение по ссылке</h2>

                  <p>
                    Создай одноразовую ссылку. Она действует 7 дней.
                  </p>

                  <button
                    className="family-create-button"
                    type="button"
                    onClick={createInvite}
                    disabled={creatingInvite}
                  >
                    {creatingInvite ? (
                      <LoaderCircle className="family-spinner" size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                    Создать приглашение
                  </button>

                  {inviteLink && (
                    <div className="family-invite-result">
                      <label>Ссылка-приглашение</label>

                      <input value={inviteLink} readOnly />

                      <button
                        className="family-copy-button"
                        type="button"
                        onClick={() =>
                          copyText(inviteLink, 'Ссылка скопирована!')
                        }
                      >
                        <Copy size={17} />
                        Копировать ссылку
                      </button>
                    </div>
                  )}
                </section>
              </div>

              <section className="family-danger-zone">
                <div>
                  <h2>Удаление семьи</h2>
                  <p>
                    Удаление необратимо. Все участники будут
                    исключены из группы.
                  </p>
                </div>

                <button
                  type="button"
                  className="family-delete-button"
                  onClick={deleteFamily}
                  disabled={deleting}
                >
                  {deleting ? (
                    <LoaderCircle className="family-spinner" size={18} />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  Удалить семью
                </button>
              </section>
            </>
          )}
        </>
      ) : (
        <div className="family-tools-grid">
          <section className="family-create-card">
            <div className="family-create-icon">
              <Users size={32} />
            </div>

            <h2>Создай свою семью</h2>

            <p>
              Придумай название семейной группы. После создания
              ты станешь её администратором.
            </p>

            <form
              onSubmit={createFamily}
              className="family-create-form"
            >
              <label htmlFor="family-name">Название семьи</label>

              <input
                id="family-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например, Моя семья"
                minLength={2}
                maxLength={50}
                required
              />

              <AvatarPicker
                value={selectedAvatar}
                customPreview={customAvatarPreview}
                onChange={(id) => {
                  setSelectedAvatar(id)
                  setCustomAvatarFile(null)

                  if (customAvatarPreview) {
                    URL.revokeObjectURL(customAvatarPreview)
                  }

                  setCustomAvatarPreview('')
                }}
                onCustomSelect={handleCustomAvatar}
              />

              <button
                type="submit"
                className="family-create-button"
                disabled={creating}
              >
                {creating ? (
                  <LoaderCircle className="family-spinner" size={19} />
                ) : (
                  <Plus size={20} />
                )}
                Создать семейную группу
              </button>
            </form>

            <div className="family-create-note">
              <UsersRound size={18} />
              <span>Максимум 20 участников в одной семье.</span>
            </div>
          </section>

          <section className="family-tool-card">
            <div className="family-tool-icon">
              <KeyRound size={25} />
            </div>

            <h2>Вступить в семью</h2>

            <p>
              Введи код и пароль, которые тебе передал администратор.
              Название семьи вводить не нужно.
            </p>

            <form onSubmit={joinFamily}>
              <label htmlFor="join-code">Код семьи</label>

              <input
                id="join-code"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Введи код семьи"
                required
              />

              <label htmlFor="join-password">Пароль семьи</label>

              <input
                id="join-password"
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Введи пароль"
                required
              />

              <button
                className="family-create-button"
                type="submit"
                disabled={joining}
              >
                {joining ? (
                  <LoaderCircle className="family-spinner" size={18} />
                ) : (
                  <UsersRound size={18} />
                )}
                Вступить в семью
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default FamilyGroups