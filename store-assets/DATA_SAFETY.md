# 🔐 Data Safety — анкета для Google Play Console

Анкета в Play Console: **App content → Data safety**.
Ниже — ответы для СменаБел. Основано на фактическом сборе данных (Firebase Auth + Firestore).

---

## 1. Does your app collect or share any of the required user data types?
**Yes**

## 2. Is all of the user data collected by your app encrypted in transit?
**Yes** — Firebase использует HTTPS/TLS по умолчанию.

## 3. Do you provide a way for users to request that their data be deleted?
**Yes** — пользователь может удалить аккаунт в профиле (и/или написать на support email). Политика конфиденциальности описывает процедуру.

---

## Data types — что отмечать

### Personal info
| Тип данных | Собирается | Shared | Required | Purpose | Optional |
|---|:-:|:-:|:-:|---|:-:|
| **Name** | ✅ | ❌ | ✅ | Account management, App functionality | ❌ |
| **Email** | ✅ | ❌ | ✅ | Account management, App functionality, Communications | ❌ |
| **User IDs** | ✅ | ❌ | ✅ | Account management, App functionality, Analytics | ❌ |
| **Phone number** | ⚪ (если собираешь) | ❌ | ⚪ | Account management, Communications | ❌ |
| **Address** | ❌ | — | — | — | — |
| **Race/ethnicity** | ❌ | — | — | — | — |
| **Political/religious** | ❌ | — | — | — | — |
| **Sexual orientation** | ❌ | — | — | — | — |
| **Other info** | ❌ | — | — | — | — |

### Financial info
Ничего не отмечать — приложение не обрабатывает платежи.

### Health and fitness
Ничего не отмечать.

### Messages
| Тип | Собирается | Shared | Required | Purpose |
|---|:-:|:-:|:-:|---|
| **In-app messages** | ✅ | ❌ | ✅ | App functionality |

(чат между работодателем и соискателем хранится в Firestore)

### Photos and videos
| Тип | Собирается | Shared | Required | Purpose |
|---|:-:|:-:|:-:|---|
| **Photos** | ✅ | ❌ | ❌ (optional) | App functionality, Account management |

(фото профиля + фото в чат)

### Audio files
Ничего не отмечать.

### Files and docs
Ничего не отмечать.

### Calendar
Ничего не отмечать.

### Contacts
Ничего не отмечать.

### App activity
| Тип | Собирается | Shared | Required | Purpose |
|---|:-:|:-:|:-:|---|
| **App interactions** | ✅ | ❌ | ✅ | Analytics, App functionality |
| **Other user-generated content** | ✅ | ❌ | ❌ | App functionality (отзывы, заявки на смены, публикации вакансий) |

### Web browsing
Ничего не отмечать.

### App info and performance
| Тип | Собирается | Shared | Required | Purpose |
|---|:-:|:-:|:-:|---|
| **Crash logs** | ✅ | ❌ | ✅ | Analytics, App functionality |
| **Diagnostics** | ⚪ (если используешь Firebase Performance) | ❌ | ❌ | Analytics |

### Device or other IDs
| Тип | Собирается | Shared | Required | Purpose |
|---|:-:|:-:|:-:|---|
| **Device or other IDs** | ✅ | ❌ | ✅ | Analytics, Fraud prevention, App functionality |

(Firebase Installation ID)

### Location
❌ **Ничего не отмечать.** Разрешения `ACCESS_FINE_LOCATION` и `ACCESS_COARSE_LOCATION` явно заблокированы в `app.json` (`blockedPermissions`). Приложение работает только с адресами, введёнными вручную.

---

## Security practices (вопросы в конце анкеты)

| Вопрос | Ответ |
|---|:-:|
| Data is encrypted in transit | ✅ Yes |
| Users can request data deletion | ✅ Yes |
| App follows Families Policy | ❌ No (18+) |
| Independent security review | ❌ No |

---

## ⚠️ Важно

1. **При смене функций** (например, добавишь геолокацию) — обязательно обнови эту анкету. Google рандомно проверяет и за несоответствие может снять приложение с публикации.
2. **Политика конфиденциальности** (`https://smenabel.by/privacy`) должна явно перечислять все эти типы данных — проверь, что там есть разделы про email, имя, фото, сообщения.
3. Если сомневаешься в пункте — ставь более консервативный вариант (Yes, собираем), это безопаснее, чем недоуказать.
