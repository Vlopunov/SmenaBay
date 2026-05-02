# 📱 СменаБел — материалы для Google Play Console

Всё, что нужно скопировать в Play Console. Идём сверху вниз по разделам консоли.

---

## 1. App details / Main store listing

### App name (до 30 символов)
```
СменаБел
```

### Short description (до 80 символов)
```
Подработки и смены в Беларуси: находи работу или подбирай сотрудников.
```

### Full description (до 4000 символов)
```
СменаБел — платформа для посменной работы и подработок в Беларуси. Приложение объединяет соискателей и работодателей в одном месте.

🔹 Для соискателей
• Находите смены рядом с вами — фильтры по городу, району, категории, оплате за смену.
• Подавайте заявку в один тап, отслеживайте статус в разделе «Мои смены».
• Общайтесь с работодателем в чате, уточняйте детали до выхода на смену.
• Получайте и оставляйте отзывы — формируйте репутацию.
• Сохраняйте интересные вакансии в «Избранное».

🔹 Для работодателей
• Публикуйте смены за минуту: адрес, дата, время, оплата, требования.
• Получайте отклики от проверенных исполнителей.
• Ведите переписку с кандидатами и команду постоянных работников.
• Управляйте локациями компании — создавайте несколько точек и смен одновременно.

🔹 Почему СменаБел
• Быстро — отклик и подбор занимают минуты, а не дни.
• Удобно — карта с ближайшими сменами, понятные карточки вакансий.
• Безопасно — реальные профили с рейтингом и отзывами после смены.
• Бесплатно для соискателей.

СменаБел подходит для работы в торговле, общепите, логистике, уборке, промо и event-индустрии, на производстве и в сервисе.

Политика конфиденциальности: https://smenabel.by/privacy
Условия использования: https://smenabel.by/terms
```

### App category
- **Category:** Business (или Jobs)
- **Tags:** до 5 — например: Jobs, Employment, Work, Shifts, Part-time

### Contact details
- **Website:** `https://smenabel.by`
- **Email:** твой рабочий email
- **Phone:** опционально

---

## 2. Graphics / Media — ВСЁ ГОТОВО ✅

| Ассет | Размер | Файл |
|---|---|---|
| **App icon** | 512×512 PNG | `store-assets/play-icon-512.png` ✅ |
| **Feature graphic** | 1024×500 PNG | `store-assets/feature-graphic-1024x500.png` ✅ |
| **Phone screenshots** (6 шт) | 1080×1920 | `store-assets/screenshots/phone/01-06 *.png` ✅ |
| **7″ tablet screenshots** (2 шт) | 1200×2134 | `store-assets/screenshots/tablet7/*.png` ✅ |
| **10″ tablet screenshots** (2 шт) | 1440×2560 | `store-assets/screenshots/tablet10/*.png` ✅ |

### Порядок загрузки скриншотов для телефона (важно — первые 2–3 определяют конверсию)
1. `01-feed.png` — «Смены рядом с тобой» (список вакансий)
2. `02-shift.png` — «Всё о смене в одном месте» (карточка)
3. `03-map.png` — «Карта смен рядом»
4. `04-chat.png` — «Чат с работодателем»
5. `05-profile.png` — «Репутация на твоей стороне» (профиль + отзывы)
6. `06-employer.png` — «Публикуй смены за минуту» (для работодателей)

---

## 3. Privacy Policy
```
https://smenabel.by/privacy
```

---

## 4. App content (анкеты)

### Ads
**No, my app does not contain ads**

### App access
Приложение требует логин. Вариант ответа: **«All or some functionality is restricted»** →
- Username: создай тестовый аккаунт работодателя в проде, например `test_reviewer@smenabel.by` + пароль
- Username: + тестовый аккаунт соискателя
- **Instructions:** «Sign in via email+password or Google. Explore shifts, apply to one, open chat with employer, edit profile.»

### Content rating
Пройти анкету IARC. Правильные ответы для СменаБел:
- Violence: **No**
- Sex/Nudity: **No**
- Profanity: **No**
- Controlled substances: **No**
- Gambling: **No**
- User interactions: **Yes** (есть чат между пользователями)
- Shares location: **No** (мы заблокировали permissions)
- Shares personal information: **Yes** (имя, фото, отзывы видны другим пользователям)
→ Ожидаемый рейтинг: **3+ / Everyone / PEGI 3**

### Target audience
- **Target age group:** 18+ (т.к. это работа; Google требует 18+ для job-apps с зарплатой)
- **Appeals to children:** No

### News app
**No**

### COVID-19 contact tracing
**No**

### Data safety — ОТДЕЛЬНЫЙ ФАЙЛ
См. `DATA_SAFETY.md`.

### Government app
**No**

### Financial features
**No** (мы не проводим платежи в приложении)

### Health
**No**

### Advertising ID
**No** — приложение не использует AdID.

---

## 5. Pricing & distribution

- **Free** / paid: **Free**
- **Countries:** выбери все, начни с **Belarus**. Можно добавить RU, UA, KZ и др. по желанию.
- **Contains ads:** No
- **In-app purchases:** No

---

## 6. Release (Internal testing — первый заход)

**Release name:** `1.0.0 (3)`

**Release notes (RU):**
```
Первый публичный релиз СменаБел.
• Поиск смен и подработок по Беларуси
• Подача заявок в один тап
• Чат с работодателями
• Профиль с отзывами
• Карта со сменами рядом
```

**Release notes (EN):**
```
First public release of SmenaBel.
• Find shifts and part-time jobs across Belarus
• One-tap applications
• In-app chat with employers
• Profile with ratings
• Map view with nearby shifts
```
