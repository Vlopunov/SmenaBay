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
- **In-App Purchases:** None

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
| **User ID** (Firebase UID) | App Functionality | ✓ |
| **Coarse Location** | НЕ собирается (geo permissions заблокированы) | — |
| **Sensitive Info** (паспорт, медкнижка, кредитки) | НЕ собирается | — |

### Data Used to Track You
**No** — отслеживания между сторонними приложениями нет.

### Data Not Linked to You
- **Crash Data** (через Firebase Crashlytics, если включишь) — но сейчас НЕ собираем

---

## 4. App Review Information

### Sign-in required?
**Yes** — приложение требует логин.

### Demo Account для review-команды Apple
Создай тестовый аккаунт в проде и заполни:
- **Username:** `+375291234567` (или e-mail демо-аккаунта)
- **Password:** *6-значный SMS-код или фиксированный пароль*

> Apple-ревьюер должен иметь возможность зайти. В review notes укажи: «Use demo phone +375291234567. SMS code 123456 (mock fallback). Or use any registered demo account from login screen.»

### Contact Information
- **First name:** Vlad
- **Last name:** Lopunov
- **Phone:** +375... (твой)
- **Email:** vlopunov@gmail.com (твой)

### Notes for Reviewer
```
СменаБел — платформа подработок и посменной работы в Беларуси.
Для соискателей — поиск смен рядом, подача заявок в один тап,
чат с работодателем. Для работодателей — публикация смен,
управление откликами.

Для ревью можно использовать демо-аккаунты, доступные на экране
входа: исполнители (+375291234567, +375337654321) и заказчики
(+375291001010, +375293003030). После ввода номера в demo-режиме
SMS-код любой 6-значный.

Sign in with Apple интегрирован согласно требованиям Guideline 4.8.
Phone Auth работает через Firebase Auth + Play Integrity / SafetyNet.
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
> Если не существует — временно поставь главную: `https://smenabel.by`

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

## 7. Что нужно ещё подготовить (вне Listing)

- ✅ App Privacy анкета — заполни как в #3
- ✅ Age Rating анкета — как в #1
- ⚠️ Скриншоты — см. отдельно `IOS_SCREENSHOTS.md`
- ⚠️ App Icon в Assets — Apple извлекает его из IPA автоматически (у нас он уже есть в проекте)
- ⚠️ Демо-аккаунт для ревью — убедись что демо-телефоны на экране входа работают

---

## Чек-лист отправки на ревью

- [ ] App Information заполнено (#1)
- [ ] Pricing — Free, страны (#2)
- [ ] App Privacy анкета (#3)
- [ ] App Review Information с демо-аккаунтом (#4)
- [ ] Version 1.0.0 описание + keywords (#5)
- [ ] Скриншоты загружены (минимум 6.7" iPhone + iPad 13")
- [ ] Build выбран и привязан к версии 1.0.0
- [ ] Export Compliance отвечен
- [ ] Submit for Review нажато
