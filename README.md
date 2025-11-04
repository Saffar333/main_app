# Telegram Characters App

Полноценное Telegram Mini App с двумя страницами: Персонажи и Профиль.

## Функционал

### Страница "Персонажи"
- ✅ Две вкладки: **Публичные** и **Личные** персонажи
- ✅ Кнопка создания нового персонажа (+)
- ✅ Выбор персонажа для общения
- ✅ Real-time обновления через Supabase
- ✅ Отправка выбранного персонажа в Telegram бота

### Страница "Профиль"
- ✅ Аватар и имя пользователя из Telegram
- ✅ Telegram ID
- ✅ Статистика: общее количество сообщений и за день
- ✅ Информация о пользователе (username, язык, Premium статус)
- ✅ Платформа (iOS/Android/Desktop)

### Страница "Создание персонажа"
- ✅ Форма создания персонажа
- ✅ Загрузка аватара в Supabase Storage
- ✅ Выбор публичный/личный персонаж
- ✅ Привязка к Telegram ID создателя

## Структура проекта

```
telegram-app/
├── index.html          # Главная страница с навигацией
├── create.html         # Страница создания персонажа
├── config.js           # Конфигурация Supabase
├── js/
│   └── app.js          # Основная логика приложения
├── vercel.json         # Конфигурация для Vercel
├── package.json        # Метаданные проекта
└── README.md           # Документация
```

## База данных Supabase

### Таблица `users`
```sql
- id (PRIMARY KEY)
- telegram_id (UNIQUE)
- username
- first_name
- created_at
- last_active
- active_character_id
- total_message_count
- daily_message_count
- last_message_at
```

### Таблица `characters`
```sql
- id (PRIMARY KEY)
- name
- description
- personality
- greeting_message
- avatar_url
- is_preset (true = публичный, false = личный)
- creator_id (FOREIGN KEY → users.id)
- created_at
- is_active
```

## Деплой на Vercel

### Способ 1: Через веб-интерфейс
1. Загрузите папку `telegram-app` в Git репозиторий
2. Зайдите на [vercel.com](https://vercel.com)
3. Импортируйте репозиторий
4. Deploy!

### Способ 2: Drag & Drop
1. Зайдите на [vercel.com](https://vercel.com)
2. Перетащите папку `telegram-app`
3. Done!

### Способ 3: Vercel CLI
```bash
cd telegram-app
vercel
```

## Настройка в BotFather

После деплоя:

```
1. Откройте @BotFather
2. /newapp
3. Выберите бота
4. URL: https://your-app.vercel.app
```

## Локальная разработка

```bash
cd telegram-app
python -m http.server 8000
```

Откройте: http://localhost:8000

⚠️ **Важно**: Данные пользователя доступны только при открытии через Telegram!

## Как это работает

1. **Пользователь открывает Web App в Telegram**
   - Telegram передает `user.id`, `username`, `first_name` через `tg.initDataUnsafe.user`

2. **Просмотр персонажей**
   - Загружаются все персонажи из Supabase
   - Фильтруются по типу: публичные (`is_preset = true`) или личные (`creator_id = текущий пользователь`)

3. **Создание персонажа**
   - Форма отправляет данные в Supabase
   - Автоматически привязывается `telegram_id` и `creator_id`
   - Аватар загружается в Supabase Storage

4. **Выбор персонажа**
   - Данные отправляются в бота через `tg.sendData()`
   - Бот получает `telegram_id` и `character_id`
   - Бот сохраняет выбор пользователя

5. **Профиль**
   - Загружаются данные из таблицы `users` по `telegram_id`
   - Отображается статистика сообщений

## Требования

- Telegram Bot
- Supabase проект с таблицами `users`, `characters`
- Supabase Storage bucket `character-avatars`
- Vercel аккаунт

## Технологии

- Vanilla JavaScript
- Telegram Web App API
- Supabase (PostgreSQL + Storage + Realtime)
- Vercel (Static Hosting)
