# MindKeep iPhone — ТЗ

Версия: 2026-09-15
Платформа первой поставки: **iOS (iPhone)**
Следующая платформа: Android из того же Expo-кода, не раньше стабильного TestFlight.

Это рабочий документ. Новые фичи сайта не копируем в приложение автоматически — каждый экран явно входит в фазу.

## 1. Оценка текущего проекта

MindKeep уже полноценный веб-продукт, не прототип.

| Слой | Состояние | Вывод для мобилки |
|------|-----------|-------------------|
| API (Express + Prisma + Postgres) | Задачи, повторения 3/7/30, заметки, калории/вода, финансы, уведомления | Переиспользуем как есть |
| Авторизация | JWT: httpOnly cookie **или** `Authorization: Bearer` | Cookie — сайт, Bearer — приложение |
| CSRF | Мутации: allowed Origin или заголовок `X-Requested-With: learning-reminder` | Для приложения достаточно заголовка + Bearer |
| Клиент | React SPA, Tailwind, React Router, Hostinger | **Не оборачиваем.** Пишем native UI |
| i18n | ru / uk / en / fi | Переносим строки |
| Пуш | Нет. In-app + hourly `reminderJob` | Сначала inbox, потом APNs |
| Админка / блог / гайд | Веб | Не переносим |

**Вердикт:** мобилку правильно делать в этом репозитории отдельным пакетом. Неправильно превращать `client/` в приложение (Capacitor / WebView).

## 2. Цели v1

Пользователь с iPhone может:

1. Войти тем же аккаунтом, что на сайте.
2. Видеть день: задачи, повторения, калории и воду.
3. Закрыть или пропустить повторение (3 / 7 / 30 считает сервер).
4. Вести задачи на день и приёмы пищи со стаканами воды.
5. Быстро записать заметку.

Один аккаунт, одни данные, сайт продолжает работать.

## 3. Не входит в iPhone v1

- Админка
- Блог, лендинг, SEO
- Лес, статистика-график, план месяца
- Полноценный офлайн-режим
- Google Sign-In (фаза после email)
- Android / Play Store
- Обёртка сайта в Capacitor

Гайд и контакты можно открыть Safari-ссылкой на mindkeep.cloud.

## 4. Стек и структура репо

```text
learning-reminder/
  client/     # сайт — не трогаем ради мобилки без нужды
  server/     # общий API
  mobile/     # Expo (React Native) — iOS first
  docs/ios-app.md
```

- **Expo + TypeScript + React Navigation** (tabs + native stack)
- **TanStack Query** как на сайте
- Сессия в **Keychain**, не в cookie
- Языки: те же 4 JSON (копия или позже общий пакет)

Нативные модули (Keychain, позже APNs) подключаем через Expo. EAS Build для TestFlight.

## 5. Контракт с API

Базовый URL: тот же Railway (`https://api.mindkeep.cloud` в проде).

### 5.1 Авторизация (обязательное изменение сервера)

Сейчас `requireAuth` читает только cookie.

Нужно:

1. Принимать JWT из `Authorization: Bearer <token>` **или** из cookie.
2. `POST /api/auth/login` и `register` возвращают `{ user, token }` в JSON (cookie для сайта можно оставлять).
3. Приложение шлёт `X-Requested-With: learning-reminder` и **не** полагается на cookie.
4. Logout на телефоне = удалить токен из Keychain. Опционально `POST /logout`.
5. Refresh-токена нет — как на сайте, TTL 7 дней, при 401 — экран входа.

Сайт после этого не должен разлогиниться.

### 5.2 Даты

- Задачи, еда, вода: клиент шлёт `YYYY-MM-DD`. Сервер кладёт UTC noon. Не слать ISO datetime.
- Повторения «сегодня / просрочено»: только по `User.timezone` (IANA, по умолчанию `Europe/Helsinki`).
- Интервалы 3/7/30 создаёт сервер при создании материала. Клиент даты не считает.

### 5.3 Эндпоинты v1 (уже существуют)

- Auth: `/api/auth/login`, `/register`, `/me`, `/logout`
- Tasks: `GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/:id`
- Reminders: `/today`, `/overdue`, `/upcoming`, `/calendar`, `POST :id/complete|skip`
- Materials + categories
- Nutrition: period, settings, meals, water
- Notes
- Notifications list / unread / read
- Statistics dashboard — только для виджетов Today, отдельный экран не делаем

## 6. Навигация

Пять вкладок:

| Tab | Содержание |
|-----|------------|
| **Today** | Задачи сегодня (чекбокс), повторения due/overdue, калории/вода, бейдж непрочитанных |
| **Review** | Inbox Complete / Skip; стек: материалы, категория, календарь повторений |
| **Tasks** | День + месяц, как `/tasks` |
| **Fuel** | Норма, приёмы пищи, стаканы, календарь — как `/calories` |
| **More** | Заметки, уведомления, финансы, язык, timezone, гайд/контакты (Safari), выход |

Админа в приложении нет.

## 7. Экраны по фазам

Каждая фаза закрывается, когда сценарий проходит на симуляторе iPhone **и** на одном реальном устройстве (или TestFlight).

### Phase 0 — Сервер (без UI телефона)

- [x] Bearer в `requireAuth`
- [x] Логин/регистрация отдают `token` в JSON
- [x] Сайт по cookie по-прежнему входит
- [x] Проверка: `GET /api/auth/me` с Bearer без cookie

### Phase 1 — Каркас приложения

- [x] `mobile/` в workspaces, Expo SDK, iOS-only target на старте
- [x] Экраны Login / Register (email + пароль, без Google)
- [x] Токен в Keychain, `AuthProvider`
- [x] Смена языка ru/uk/en/fi
- [x] Пустые 5 табов после входа

Запуск: `npm run dev:mobile`. На Windows iOS-симулятора нет — ставьте Expo Go на iPhone. Пока Phase 0 не задеплоен на Railway, логин с телефона к `api.mindkeep.cloud` не сохранит сессию (нет `token` в JSON). Локально: `EXPO_PUBLIC_API_URL=http://<LAN-IP>:4000`.

### Phase 2 — Today

- [x] Задачи сегодня: отметить выполненной
- [x] Счётчик повторений сегодня + просрочено, переход в Review
- [x] Калории и стаканы сегодня (чтение + клик по воде)
- [x] Пустые состояния

### Phase 3 — Review (ядро продукта)

- [x] Список overdue / today / upcoming
- [x] Complete и Skip
- [x] Материалы: список, создание (learnedAt → сервер ставит 3/7/30), карточка, архив
- [x] Категории
- [x] Календарь повторений на месяц

### Phase 4 — Tasks

- [x] Календарь месяца, выбранный день
- [x] Создание (название, минуты, дата), выполнение, удаление
- [x] Не делаем Forest

### Phase 5 — Fuel (калории и вода)

- [x] Норма ккал и стаканов
- [x] Добавление приёма (название + ккал), сумма за день
- [x] Перебор нормы виден (не блокируем)
- [x] Стаканы кликом
- [x] Календарь дней

### Phase 6 — Notes

- [x] Список, поиск
- [x] Создание / просмотр / правка / удаление

### Phase 7 — Уведомления

- [x] Список in-app, прочитать одно / все
- [x] Бейдж на Today / More
- [ ] Позже: APNs из `reminderJob` (отдельная подфаза, нужен Apple Developer)

### Phase 8 — Финансы и поставка

- [x] Бюджет + операции (упрощённый UI, не копия трёх веб-страниц)
- [x] EAS-конфиг, иконка, splash, privacy `https://mindkeep.cloud/privacy` (TestFlight — `eas login` + Apple Developer)
- [ ] Только после этого — Android target

### Phase 9 — Настройки телефона

- [x] Timezone в More (`PATCH /api/auth/me`) — повторения считаются по поясу аккаунта
- [x] Гайд и контакты — Safari на mindkeep.cloud
- [ ] Тема светлая/тёмная (сейчас тёмная, как сайт; системную можно взять после TestFlight)

## 8. UX-правила

- Нативные жесты и системная навигация, не веб-сайдбар.
- Крупные зоны нажатия, как у стаканов воды на сайте.
- Ошибки сети показывать явно, не молча.
- Тема светлая/тёмная — можно взять системную в v1.
- Timezone: поле в More (сейчас на сайте задаётся при регистрации и почти не редактируется — на телефоне это важнее).

## 9. Аккаунты и магазины

- Тот же backend, те же пользователи.
- Bundle ID и App Store Connect заводим в Phase 1 (без публикации).
- Значки «App Store / Google Play» на лендинге остаются «скоро», пока нет TestFlight.

## 10. Риски

1. Cookie-only auth — закрыто в Phase 0 (Bearer рядом с cookie).
2. Google iOS SDK — не блокирует v1.
3. Пуш без APNs не разбудит пользователя — честно опираемся на виджет Today + in-app, пока нет сертификатов.
4. Общие компоненты с сайтом (Tailwind) экономии не дадут — не пытаемся.

## 11. Как двигаемся

Следующий шаг: **задеплоить API** (`PATCH /api/auth/me`), чтобы смена пояса работала на телефоне к `api.mindkeep.cloud`.

Затем **TestFlight**: `npx eas-cli login`, из `mobile/`: `npx eas build -p ios --profile preview`. Нужен Apple Developer.

APNs и Android — после TestFlight. Тема остаётся тёмной, как на сайте.
