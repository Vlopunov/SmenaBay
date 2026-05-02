# 🚀 СменаБел — материалы для Google Play Console

Всё готово для загрузки. Вот карта папки:

```
store-assets/
├── play-icon-512.png              ← иконка 512×512 для Play Console
├── feature-graphic-1024x500.png   ← баннер магазина 1024×500
├── STORE_LISTING.md               ← тексты (название, описания, категория)
├── DATA_SAFETY.md                 ← ответы на Data Safety анкету
├── SCREENSHOTS.md                 ← как сделать скриншоты
├── make_brand_icons.py            ← генератор иконок (на случай правок)
└── make_feature_graphic.py        ← генератор баннера
```

---

## 📋 Чек-лист перед публикацией

### Готово ✅
- [x] AAB собирается без ошибок через EAS
- [x] `expo-doctor` 17/17 проверок
- [x] Брендовые иконки (1024, adaptive, 48, 512)
- [x] Feature graphic 1024×500
- [x] Permissions объявлены в `app.json`
- [x] `versionCode` с авто-инкрементом
- [x] Privacy Policy: https://smenabel.by/privacy
- [x] Тексты для Play Store (см. `STORE_LISTING.md`)
- [x] Data Safety ответы (см. `DATA_SAFETY.md`)

### Нужно сделать тебе ⏳
- [ ] Дождаться завершения билда: https://expo.dev/accounts/lopunow/projects/SmenaBay/builds/24fe442f-f90c-4dde-b208-fbed5063d114
- [ ] Скачать `.aab` файл
- [ ] Сделать 4–8 скриншотов приложения (см. `SCREENSHOTS.md`)
- [ ] Создать приложение в Play Console
- [ ] Заполнить Store Listing по `STORE_LISTING.md`
- [ ] Загрузить графику (`play-icon-512.png`, `feature-graphic-1024x500.png`, скриншоты)
- [ ] Пройти анкеты: Content rating, Target audience, Data Safety
- [ ] Загрузить AAB в Internal testing
- [ ] Добавить себя в тестеры и проверить установку
- [ ] Когда всё работает → Promote в Production

---

## ⚡ Быстрые команды

```bash
# Статус текущего билда
eas build:list --limit 1

# Посмотреть логи последнего билда
eas build:view

# Скачать готовый AAB (после Finished)
eas build:download

# Автозагрузка в Play Console (после первой ручной загрузки, когда подключишь service account)
eas submit --platform android --latest
```
