
import { createContext, useContext, useEffect, useState } from 'react'

const LanguageContext = createContext(null)

const translations = {
  ru: {
    dashboard: 'Главная',
    familyGroups: 'Семейные группы',
    calendar: 'Календарь',
    tasks: 'Задачи',
    shopping: 'Покупки',
    budget: 'Бюджет',
    statistics: 'Статистика',
    familyMap: 'Карта семьи',
    profile: 'Профиль',
    settings: 'Настройки',
    logout: 'Выйти',
    welcome: 'Добро пожаловать',
    totalMembers: 'Участники',
    totalTasks: 'Всего задач',
    completed: 'Выполнено',
    pending: 'Ожидает',
    progress: 'В процессе',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    add: 'Добавить',
    loading: 'Загрузка...',

    preferences: 'PREFERENCES',
    settingsDescription: 'Настрой FamilyHub под себя',
    appearance: 'Внешний вид',
    appearanceDescription: 'Выбери оформление приложения',
    darkDescription: 'Тёмная тема',
    lightDescription: 'Светлая тема',
    premiumDescription: 'Фиолетовая тема',
    language: 'Язык',
    languageDescription: 'Выбери язык приложения',
    security: 'Безопасность',
    securityDescription: 'Управление безопасностью аккаунта',
    passwordComingSoon: 'Изменение пароля добавим следующим этапом',
    familyMembers: 'Участники семьи',
    totalBudget: 'Общий бюджет',
    familySpace: 'СЕМЕЙНОЕ ПРОСТРАНСТВО',
    dashboardDescription: 'Всё важное для вашей семьи — в одном месте.',
    quickAccess: 'Быстрый доступ',
    recentEvents: 'Последние события',
    noEvents: 'Пока событий нет.',
    eventsDescription: 'Здесь будут отображаться действия участников семьи.',
  },

  en: {
    dashboard: 'Dashboard',
    familyGroups: 'Family Groups',
    calendar: 'Calendar',
    tasks: 'Tasks',
    shopping: 'Shopping',
    budget: 'Budget',
    statistics: 'Statistics',
    familyMap: 'Family Map',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Log out',
    welcome: 'Welcome',
    totalMembers: 'Members',
    totalTasks: 'Total tasks',
    completed: 'Completed',
    pending: 'Pending',
    progress: 'In progress',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    add: 'Add',
    loading: 'Loading...',

    preferences: 'PREFERENCES',
    settingsDescription: 'Customize FamilyHub your way',
    appearance: 'Appearance',
    appearanceDescription: 'Choose your app theme',
    darkDescription: 'Dark theme',
    lightDescription: 'Light theme',
    premiumDescription: 'Purple theme',
    language: 'Language',
    languageDescription: 'Choose your app language',
    security: 'Security',
    securityDescription: 'Manage account security',
    passwordComingSoon: 'Password changes will be added in a future update',
    familyMembers: 'Family members',
    totalBudget: 'Total budget',
    familySpace: 'FAMILY SPACE',
    dashboardDescription: 'Everything important for your family in one place.',
    quickAccess: 'Quick access',
    recentEvents: 'Recent events',
    noEvents: 'No events yet.',
    eventsDescription: 'Family members’ activities will appear here.',
  },

  uz: {
    dashboard: 'Bosh sahifa',
    familyGroups: 'Oila guruhlari',
    calendar: 'Taqvim',
    tasks: 'Vazifalar',
    shopping: 'Xaridlar',
    budget: 'Byudjet',
    statistics: 'Statistika',
    familyMap: 'Oila xaritasi',
    profile: 'Profil',
    settings: 'Sozlamalar',
    logout: 'Chiqish',
    welcome: 'Xush kelibsiz',
    totalMembers: 'A’zolar',
    totalTasks: 'Jami vazifalar',
    completed: 'Bajarildi',
    pending: 'Kutilmoqda',
    progress: 'Jarayonda',
    save: 'Saqlash',
    cancel: 'Bekor qilish',
    delete: 'O‘chirish',
    add: 'Qo‘shish',
    loading: 'Yuklanmoqda...',

    preferences: 'SOZLAMALAR',
    settingsDescription: 'FamilyHub ilovasini o‘zingizga moslang',
    appearance: 'Tashqi ko‘rinish',
    appearanceDescription: 'Ilova mavzusini tanlang',
    darkDescription: 'Qorong‘i mavzu',
    lightDescription: 'Yorug‘ mavzu',
    premiumDescription: 'Binafsha mavzu',
    language: 'Til',
    languageDescription: 'Ilova tilini tanlang',
    security: 'Xavfsizlik',
    securityDescription: 'Hisob xavfsizligini boshqarish',
    passwordComingSoon: 'Parolni o‘zgartirish keyingi yangilanishda qo‘shiladi',
    familyMembers: 'Oila a’zolari',
    totalBudget: 'Umumiy byudjet',
    familySpace: 'OILA MAKONI',
    dashboardDescription: 'Oilangiz uchun barcha muhim narsalar bir joyda.',
    quickAccess: 'Tezkor kirish',
    recentEvents: 'So‘nggi voqealar',
    noEvents: 'Hozircha voqealar yo‘q.',
    eventsDescription: 'Bu yerda oila a’zolarining faoliyati ko‘rsatiladi.',
  },
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('familyhub-language')

    return translations[savedLanguage] ? savedLanguage : 'ru'
  })

  useEffect(() => {
    localStorage.setItem('familyhub-language', language)
  }, [language])

  const t = (key) => {
    return translations[language]?.[key] || translations.ru[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }

  return context
}
