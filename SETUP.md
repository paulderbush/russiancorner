# Russian Corner — Полный гайд по запуску

---

## Часть 1 — GitHub: загрузка файлов

### Шаг 1. Создай аккаунт

Зайди на **github.com** → Sign up (если аккаунта нет).

### Шаг 2. Создай новый репозиторий

- Нажми **+** (правый верхний угол) → **New repository**
- Repository name: `russian-corner`
- Visibility: **Public** (нужно для бесплатного хостинга)
- Нажми **Create repository**

### Шаг 3. Загрузи файлы

На странице репозитория нажми **uploading an existing file** (или **Add file → Upload files**).

**Структура которая должна получиться:**
```
russian-corner/
├── index.html
├── success.html
├── package.json
├── vercel.json
├── .env.example
├── images/
│   ├── logo.png
│   ├── favicon.png
│   ├── olivier.jpg
│   ├── crab.jpg
│   ├── dumplings.jpg
│   ├── blini.jpg
│   └── sharlotka.jpg
└── api/
    ├── checkout.js
    └── webhook.js
```

**Важно про папки:** GitHub не позволяет создать пустую папку через браузер.
Чтобы создать папку `images/` — при загрузке просто перетащи все картинки сразу,
GitHub автоматически создаст нужные папки если файлы называются например `images/logo.png`.

Проще всего: в поле для загрузки перетащи сразу все файлы и папки целиком с рабочего стола.

### Шаг 4. Про картинки

Переименуй свои фото перед загрузкой:
- Логотип → `logo.png`
- Фавикон (маленькая иконка 32×32 или 64×64 px) → `favicon.png`
- Фото салата Оливье → `olivier.jpg`
- Фото крабового салата → `crab.jpg`
- Фото пельменей → `dumplings.jpg`
- Фото блинов → `blini.jpg`
- Фото шарлотки → `sharlotka.jpg`

Положи их в папку `images/` внутри репозитория.

> Если у тебя ещё нет фотографий — можно загрузить любые временные,
> сайт будет работать, просто карточки покажут запасной вариант.

---

## Часть 2 — Vercel: деплой сайта

### Шаг 1. Создай аккаунт Vercel

Зайди на **vercel.com** → **Sign up** → выбери **Continue with GitHub** — это важно, чтобы Vercel видел твой репозиторий.

### Шаг 2. Подключи репозиторий

- Нажми **Add New Project**
- Найди `russian-corner` в списке → нажми **Import**
- Vercel сам определит настройки → нажми **Deploy**

Через ~30 секунд сайт будет жить по адресу вида `russian-corner-abc123.vercel.app`

### Шаг 3. Добавь переменные окружения

В Vercel: **Project → Settings → Environment Variables**

Добавь каждую строку отдельно:

| Name | Value |
|------|-------|
| `STRIPE_SECRET_KEY` | заполнишь в Части 3 |
| `STRIPE_WEBHOOK_SECRET` | заполнишь в Части 3 |
| `RESEND_API_KEY` | заполнишь в Части 4 |
| `OWNER_EMAIL` | info@russiancorner.co.uk |
| `TELEGRAM_BOT_TOKEN` | заполнишь в Части 5 |
| `TELEGRAM_CHAT_ID` | заполнишь в Части 5 |
| `SITE_URL` | https://russiancorner.co.uk |

После добавления всех переменных — нажми **Redeploy** (Deployments → три точки → Redeploy).

### Шаг 4. Обнови ссылку в index.html

Найди в `index.html` эту строку:
```javascript
const CHECKOUT_API_URL = 'https://YOUR-PROJECT.vercel.app/api/checkout';
```
Замени `YOUR-PROJECT.vercel.app` на свой реальный Vercel URL.
Сохрани файл, загрузи обновлённый `index.html` на GitHub — Vercel задеплоит автоматически.

---

## Часть 3 — Stripe: приём оплаты

### Шаг 1. Аккаунт Stripe

Зайди на **stripe.com** → создай аккаунт, заполни данные компании (Hype Frame Ltd).

### Шаг 2. Получи API ключи

Stripe Dashboard → **Developers → API Keys**

- Скопируй **Secret key** (начинается с `sk_test_...`)
- Добавь в Vercel как `STRIPE_SECRET_KEY`

> Сейчас используем test keys. Когда будешь готов принимать реальные деньги — переключи тоггл вверху Stripe Dashboard с Test на Live и возьми `sk_live_...` ключ.

### Шаг 3. Настрой Webhook

Stripe Dashboard → **Developers → Webhooks → Add endpoint**

- **Endpoint URL:** `https://russian-corner-abc123.vercel.app/api/webhook`
  (используй свой реальный Vercel URL)
- **Events to listen:** выбери `checkout.session.completed`
- Нажми **Add endpoint**

После создания нажми на webhook → скопируй **Signing secret** (начинается с `whsec_...`)
→ добавь в Vercel как `STRIPE_WEBHOOK_SECRET`

### Шаг 4. Настрой автоматические чеки клиентам

Stripe Dashboard → **Settings → Emails**
- Включи **Successful payments** → Stripe будет автоматически отправлять чек клиенту на email

### Шаг 5. Тестирование

Сделай тестовый заказ на сайте, на странице оплаты Stripe используй:
- Карта: `4242 4242 4242 4242`
- Дата: любая будущая (например `12/28`)
- CVC: любые 3 цифры (например `123`)

---

## Часть 4 — Resend: email уведомления тебе

Resend отправляет тебе письмо с деталями каждого заказа.

### Шаг 1. Создай аккаунт

Зайди на **resend.com** → Sign up (бесплатно: 3 000 писем/месяц).

### Шаг 2. Подключи домен

- Resend Dashboard → **Domains → Add Domain**
- Введи `russiancorner.co.uk`
- Resend покажет DNS-записи которые нужно добавить у регистратора домена (там где покупал домен — GoDaddy, Namecheap и т.д.)
- Добавь эти записи, нажми **Verify** — обычно проходит за 10–30 минут

### Шаг 3. Получи API ключ

Resend Dashboard → **API Keys → Create API Key**
- Скопируй ключ (начинается с `re_...`)
- Добавь в Vercel как `RESEND_API_KEY`

> Без подтверждённого домена письма будут идти от `onboarding@resend.dev` —
> это работает для теста, но для боевого режима нужен свой домен.

---

## Часть 5 — Telegram бот: уведомления в мессенджер

### Шаг 1. Создай бота

- Открой Telegram → найди **@BotFather**
- Напиши `/newbot`
- Имя бота: `Russian Corner Orders` (или любое)
- Username: например `russiancorner_orders_bot` (должен быть уникальным, заканчиваться на `_bot`)
- BotFather пришлёт токен вида `1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ`
- Добавь в Vercel как `TELEGRAM_BOT_TOKEN`

### Шаг 2. Получи свой Chat ID

- Найди своего бота в Telegram по username → нажми **Start**
- Открой в браузере эту ссылку (замени TOKEN на свой токен):
  ```
  https://api.telegram.org/bot<TOKEN>/getUpdates
  ```
- В ответе найди `"chat":{"id": 123456789}` — это твой Chat ID
- Добавь в Vercel как `TELEGRAM_CHAT_ID`

### Шаг 3. Проверь

После тестового заказа через Stripe ты должен получить сообщение в Telegram с деталями заказа.

---

## Часть 6 — Свой домен russiancorner.co.uk

### Подключи домен к Vercel

Vercel Dashboard → **Project → Settings → Domains → Add**
- Введи `russiancorner.co.uk` и `www.russiancorner.co.uk`
- Vercel покажет DNS-записи которые нужно прописать у регистратора

### Пропиши DNS у регистратора

| Тип | Имя | Значение |
|-----|-----|----------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

DNS обновляется за 10 минут — несколько часов.

---

## Итоговый чеклист запуска

- [ ] Все файлы загружены на GitHub
- [ ] Картинки в папке `images/`
- [ ] Сайт задеплоен на Vercel
- [ ] `CHECKOUT_API_URL` обновлён в `index.html`
- [ ] Stripe: получены API ключи, настроен Webhook
- [ ] Resend: домен подтверждён, API ключ получен
- [ ] Telegram: бот создан, Chat ID получен
- [ ] Все переменные добавлены в Vercel, сделан Redeploy
- [ ] Проведён тестовый заказ картой `4242 4242 4242 4242`
- [ ] Проверен email с деталями заказа
- [ ] Проверено Telegram уведомление
- [ ] Переключён Stripe на Live mode (когда готов к реальным платежам)
