# 🍎 СменаБел — App Store Connect submission pack

Всё, что надо вставить в App Store Connect → твоё приложение.

---

## 1. App Information (раздел «App Information»)

### Name (до 30 символов)
```
СменаБел
```
> Если занято — попробовать `Смена Бел`, `СменаБел.by`, `СменаБел — Смены`.

### Subtitle (до 30 символов)
```
Подработки и смены рядом
```

### Bundle ID
```
com.smenabay.app
```

### SKU
```
SMENABAY001
```

### Primary Category
```
Business
```
> Альтернатива: `Lifestyle` (если хочется более «потребительский» позиционирование).

### Secondary Category
```
Productivity
```

### Content Rights
- Does your app contain, show, or access third-party content? → **No**

### Age Rating
Запусти анкету Age Rating, ответы:
- **Cartoon or Fantasy Violence:** None
- **Realistic Violence:** None
- **Prolonged Graphic / Sadistic Violence:** None
- **Profanity / Crude Humor:** None
- **Mature/Suggestive Themes:** None
- **Horror/Fear Themes:** None
- **Medical/Treatment Information:** None
- **Alcohol, Tobacco, Drugs:** None
- **Sexual Content & Nudity:** None
- **Gambling:** None
- **Contests:** None
- **Unrestricted Web Access:** No
- **Gambling and Contests:** No

→ Ожидаемый рейтинг: **4+**

---

## 2. Pricing & Availability

- **Price:** Free
- **Availability:** All territories (или начни с Belarus + Russia + Kazakhstan + Ukraine)
- **In-App Purchases:** None — на iOS экран тарифов информационный, без цен и кнопок покупки

---

## 3. App Privacy (Apple Privacy Nutrition Label)

В App Store Connect → твоё app → **App Privacy → Get Started**

### Data Collection
**Yes**, the app collects data.

### Data Linked to User

| Data Type | Purpose | Linked? |
|---|---|---|
| **Name** (имя/фамилия) | App Functionality | ✓ |
| **Email Address** (если Google/Apple Sign-In) | App Functionality | ✓ |
| **Phone Number** | App Functionality + Identity Verification | ✓ |
| **Photos** (профиль + чат) | App Functionality | ✓ |
| **User Content / Messages** | App Functionality | ✓ |
| **User ID** (Firebase UID) | App Functionality, Analytics | ✓ |
| **Product Interaction** (открыл смену, откликнулся, опубликовал) | Analytics | ✓ |
| **Device ID** (Firebase Analytics) | Analytics | ✓ |
| **Coarse Location** | НЕ собирается (geo permissions заблокированы) | — |
| **Sensitive Info** (паспорт, медкнижка, кредитки) | НЕ собирается | — |

### Data Used to Track You
**No** — отслеживания между сторонними приложениями нет.

### Data Not Linked to You
- **Crash Data** — Firebase Crashlytics, включён с 18.09.2026.
- **Performance Data** — не собираем (Firebase Performance не подключён).

Пуш-токен устройства хранится в профиле пользователя (`users/{uid}.pushTokens`)
и используется только для уведомлений о смене — в анкете это часть
**App Functionality**, отдельного типа данных у Apple для него нет.

---

## 4. App Review Information

### Sign-in required?
**Yes** — приложение требует логин.

### Demo Account для review-команды Apple

⚠️ **Кнопки демо-аккаунтов убраны из релизной сборки** (Guideline 2.2 — в
опубликованном приложении не должно быть демо/бета-функциональности). Они
остались только под `__DEV__`.

Вместо них доступ ревьюеру даётся через **тестовые номера Firebase** — SMS
реально не отправляется, код фиксированный.

**Что сделать до отправки (обязательно):**

1. Firebase Console → проект `smenabay` → Authentication → Sign-in method →
   Phone → раскрыть **Phone numbers for testing**.
2. Добавить пары «номер → код»:

   | Номер | Код | Кто это в приложении |
   |---|---|---|
   | `+375 29 123 45 67` | `123456` | Алексей Ковалёв — исполнитель |
   | `+375 29 100 10 10` | `123456` | ШаурМания — заказчик |

3. В App Store Connect → App Review Information заполнить:
   - **Username:** `+375291234567`
   - **Password:** `123456`

Номера совпадают с профилями в приложении, поэтому после ввода кода ревьюер
сразу попадает в готовый аккаунт с историей смен, откликами и чатами.

### Contact Information
- **First name:** Vlad
- **Last name:** Lopunov
- **Phone:** +375... (твой)
- **Email:** vlopunov@gmail.com (твой)

### Notes for Reviewer
```
СменаБел — платформа подработок и посменной работы в Беларуси.
Для соискателей — поиск смен рядом, подача заявок в один тап,
чат с работодателем. Для работодателей — публикация смен и
управление откликами.

HOW TO SIGN IN
Phone number: +375291234567
Verification code: 123456
This is a Firebase test number — no real SMS is sent. It signs you in
as a job-seeker account with existing shifts, applications and chats.
For the employer side use +375291001010 with the same code 123456.

ACCOUNT DELETION (Guideline 5.1.1(v))
Profile tab (Я / Профиль) → scroll to the bottom → "Удалить аккаунт".
Two confirmations, then the account and all related data are erased.

USER SAFETY (Guideline 1.2)
Every chat, shift and public profile has a "···" menu in the header with
"Пожаловаться" (report, with reason picker) and "Заблокировать" (block).
Blocked users disappear from the feed, chat list, map and directory.

PAYMENTS
There are no in-app purchases. The iOS build shows no prices and no
purchase controls — employer billing is handled outside the app.

Sign in with Apple is offered alongside Google per Guideline 4.8.
Phone Auth uses Firebase Auth (APNs silent verification on iOS).
```

---

## 5. Version Information (раздел текущей версии 1.0.0)

### What's New in This Version
```
Первый релиз СменаБел.
• Поиск смен и подработок по Беларуси
• Подача заявок в один тап
• Чат с работодателями
• Профиль с отзывами
• Карта со сменами рядом
```

### Promotional Text (170 символов, можно менять без ревью)
```
142 смены прямо сейчас в твоём городе. Найди подработку рядом, отправь заявку в один тап и получай оплату в день смены.
```

### Description (до 4000 символов)
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

### Keywords (до 100 символов, через запятую)
```
смены,подработка,работа,вакансии,беларусь,минск,смена,заработок,подработки,фриланс
```

### Support URL
```
https://smenabel.by/support
```
> Страница поднята 02.10.2026: контакты, ссылка на FAQ и как удалить аккаунт.
> Тот же адрес берётся в приложении из `src/constants/links.js`.
> Для Google Play («Ссылка на удаление аккаунта»):
> `https://smenabel.by/support#delete-account`.

### Marketing URL (не обязательно)
```
https://smenabel.by
```

### Privacy Policy URL (обязательно)
```
https://smenabel.by/privacy
```

### Copyright
```
2026 SmenaBel
```

---

## 6. Build (после `eas submit`)

После того как IPA загрузится в App Store Connect и обработается (~10–30 мин):

1. **TestFlight → Builds** — увидишь билд `1.0.0 (2)`
2. Apple запросит **Export Compliance** — отвечай:
   - «Does your app use encryption?» → **No** (мы уже задали `ITSAppUsesNonExemptEncryption: false` в Info.plist)
3. **Internal Testing** — добавь группу, привяжи билд → invite себе
4. **External Testing** (опционально, до 10 000 человек) → надо первый раз пройти Apple review (~24 часа)
5. **Submit for Review** — для публичного релиза → ревью ~24-48 часов

---

## 7. Скриншоты

Сняты **с работающего приложения** в симуляторе (Release-сборка, без
dev-баннеров) — `store-assets/screenshots/ios-iphone69/`, 1320×2868,
это размер iPhone 16 Pro Max, принимается как «6.9 inch Display».

| Файл | Экран |
|---|---|
| `01-onboarding.png` | Первый экран — оффер и как это работает |
| `02-roles.png` | Выбор роли: исполнитель / заказчик |
| `03-feed.png` | Лента смен с фильтрами |
| `04-shift.png` | Карточка смены: оплата, время, адрес, требования |
| `05-map.png` | Карта смен рядом |
| `06-chat.png` | Чат с работодателем |
| `07-profile.png` | Профиль, рейтинг, бейджи |
| `08-employer.png` | Дашборд заказчика |

> Старые папки `ios-iphone67/`, `ios-iphone65/`, `ios-ipad13/`, `phone/`,
> `tablet7/`, `tablet10/` — это **нарисованные макеты** в устаревшем
> фиолетовом дизайне, сгенерированные `make_screenshots.py`. Они не
> соответствуют приложению (Guideline 2.3.3) — **не загружать**.

С осени 2024 Apple требует только один набор iPhone (6.9") — 6.5"
подтягивается автоматически. Набор для iPad нужен **только если**
в App Store Connect указана поддержка iPad; в `app.json` сейчас
`supportsTablet: true`, значит iPad-скриншоты обязательны — либо снять
их, либо выключить поддержку планшетов.

## 8. Что нужно ещё подготовить (вне Listing)

- ✅ App Privacy анкета — заполни как в #3
- ✅ Age Rating анкета — как в #1
- ✅ Скриншоты — см. #7
- ✅ App Icon — Apple извлекает его из IPA автоматически (1024×1024, без альфа-канала — проверено)
- ⚠️ Тестовые номера в Firebase Console — см. #4, без них ревьюер не войдёт

---

## Чек-лист отправки на ревью

- [ ] Тестовые номера добавлены в Firebase Console (#4) — **делать первым**
- [ ] App Information заполнено (#1)
- [ ] Pricing — Free, страны (#2)
- [ ] App Privacy анкета (#3)
- [ ] App Review Information: логин, код, Notes for Reviewer (#4)
- [ ] Version 1.0.0 описание + keywords (#5)
- [ ] Скриншоты 6.9" загружены из `ios-iphone69/` (#7)
- [ ] Решено, что делать с iPad: снять скриншоты или `supportsTablet: false`
- [ ] Build выбран и привязан к версии 1.0.0
- [ ] Export Compliance отвечен
- [ ] Submit for Review нажато

См. также `store-assets/SUBMISSION_STATUS.md` — что уже починено и что
осталось.
