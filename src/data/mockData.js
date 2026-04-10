// СменаБай — Mock Data
// Реалистичные данные для Минска, Беларусь

// ============ WORKERS (10) ============
export const MOCK_WORKERS = [
  {
    id: 'w1',
    role: 'worker',
    firstName: 'Алексей',
    lastName: 'Ковалёв',
    phone: '+375291234567',
    city: 'Минск',
    avatar: 'https://i.pravatar.cc/200?img=3',
    categories: ['ПВЗ', 'Склад', 'Грузчик'],
    rating: 4.9,
    shiftsCompleted: 87,
    totalEarned: 5240,
    badges: ['verified', 'top10', 'fifty_shifts', 'no_cancels'],
    documents: { passport: true, medicalBook: false },
    verified: true,
    registeredAt: '2025-06-15',
  },
  {
    id: 'w2',
    role: 'worker',
    firstName: 'Дарья',
    lastName: 'Новикова',
    phone: '+375337654321',
    city: 'Минск',
    avatar: 'https://i.pravatar.cc/200?img=5',
    categories: ['Продавец', 'Промоутер', 'Официант'],
    rating: 4.7,
    shiftsCompleted: 42,
    totalEarned: 2870,
    badges: ['verified', 'no_cancels'],
    documents: { passport: true, medicalBook: true },
    verified: true,
    registeredAt: '2025-08-20',
  },
  {
    id: 'w3',
    role: 'worker',
    firstName: 'Иван',
    lastName: 'Белый',
    phone: '+375441112233',
    city: 'Минск',
    avatar: 'https://i.pravatar.cc/200?img=7',
    categories: ['Грузчик', 'Разнорабочий', 'Склад'],
    rating: 4.5,
    shiftsCompleted: 120,
    totalEarned: 7800,
    badges: ['verified', 'top10', 'fifty_shifts'],
    documents: { passport: true, medicalBook: false },
    verified: true,
    registeredAt: '2025-03-10',
  },
  {
    id: 'w4',
    role: 'worker',
    firstName: 'Екатерина',
    lastName: 'Сидорчук',
    phone: '+375295556677',
    city: 'Минск',
    avatar: 'https://i.pravatar.cc/200?img=9',
    categories: ['Клининг', 'ПВЗ'],
    rating: 5.0,
    shiftsCompleted: 28,
    totalEarned: 1680,
    badges: ['verified', 'no_cancels', 'medical_book'],
    documents: { passport: true, medicalBook: true },
    verified: true,
    registeredAt: '2025-10-01',
  },
  {
    id: 'w5',
    role: 'worker',
    firstName: 'Максим',
    lastName: 'Жук',
    phone: '+375336667788',
    city: 'Минск',
    avatar: 'https://i.pravatar.cc/200?img=11',
    categories: ['Курьер', 'Разнорабочий'],
    rating: 3.8,
    shiftsCompleted: 15,
    totalEarned: 980,
    badges: [],
    documents: { passport: false, medicalBook: false },
    verified: false,
    registeredAt: '2026-01-15',
  },
  {
    id: 'w6',
    role: 'worker',
    firstName: 'Анна',
    lastName: 'Козлова',
    phone: '+375297778899',
    city: 'Минск',
    avatar: 'https://i.pravatar.cc/200?img=1',
    categories: ['Официант', 'Повар', 'Продавец'],
    rating: 4.6,
    shiftsCompleted: 35,
    totalEarned: 2450,
    badges: ['verified', 'medical_book'],
    documents: { passport: true, medicalBook: true },
    verified: true,
    registeredAt: '2025-09-05',
  },
  {
    id: 'w7',
    role: 'worker',
    firstName: 'Павел',
    lastName: 'Григорьев',
    phone: '+375448889900',
    city: 'Гомель',
    avatar: 'https://i.pravatar.cc/200?img=13',
    categories: ['Склад', 'Грузчик', 'Разнорабочий'],
    rating: 4.2,
    shiftsCompleted: 8,
    totalEarned: 520,
    badges: ['newbie'],
    documents: { passport: false, medicalBook: false },
    verified: false,
    registeredAt: '2026-02-20',
  },
  {
    id: 'w8',
    role: 'worker',
    firstName: 'Виктория',
    lastName: 'Мельник',
    phone: '+375290001122',
    city: 'Минск',
    avatar: 'https://i.pravatar.cc/200?img=10',
    categories: ['Промоутер', 'Продавец', 'Официант'],
    rating: 4.8,
    shiftsCompleted: 55,
    totalEarned: 3520,
    badges: ['verified', 'fifty_shifts', 'no_cancels'],
    documents: { passport: true, medicalBook: false },
    verified: true,
    registeredAt: '2025-07-12',
  },
  {
    id: 'w9',
    role: 'worker',
    firstName: 'Артём',
    lastName: 'Лукашевич',
    phone: '+375332223344',
    city: 'Минск',
    avatar: 'https://i.pravatar.cc/200?img=15',
    categories: ['ПВЗ', 'Курьер'],
    rating: 3.5,
    shiftsCompleted: 3,
    totalEarned: 180,
    badges: ['newbie'],
    documents: { passport: false, medicalBook: false },
    verified: false,
    registeredAt: '2026-03-28',
  },
  {
    id: 'w10',
    role: 'worker',
    firstName: 'Ольга',
    lastName: 'Петрович',
    phone: '+375443344556',
    city: 'Брест',
    avatar: 'https://i.pravatar.cc/200?img=16',
    categories: ['Клининг', 'ПВЗ', 'Продавец'],
    rating: 4.4,
    shiftsCompleted: 22,
    totalEarned: 1320,
    badges: ['verified'],
    documents: { passport: true, medicalBook: false },
    verified: true,
    registeredAt: '2025-11-18',
  },
];

// ============ COMPANIES (8) ============
export const MOCK_COMPANIES = [
  {
    id: 'c1',
    role: 'employer',
    companyName: 'Ozon ПВЗ Минск',
    unp: '193456789',
    contactPerson: 'Светлана Иванова',
    phone: '+375291001010',
    city: 'Минск',
    logo: 'https://i.pravatar.cc/200?img=60',
    businessCategory: 'ПВЗ',
    rating: 4.6,
    reviewsCount: 45,
    totalShiftsPublished: 180,
    plan: 'premium',
    planExpiresAt: '2026-12-31',
    locations: [
      { id: 'loc1', companyId: 'c1', address: 'пр. Независимости, 58', city: 'Минск', lat: 53.9006, lng: 27.5590, name: 'ПВЗ Немига' },
      { id: 'loc2', companyId: 'c1', address: 'ул. Сурганова, 27', city: 'Минск', lat: 53.9235, lng: 27.5882, name: 'ПВЗ Академия наук' },
    ],
    registeredAt: '2025-01-15',
  },
  {
    id: 'c2',
    role: 'employer',
    companyName: 'Wildberries ПВЗ',
    unp: '291234567',
    contactPerson: 'Андрей Комаров',
    phone: '+375332002020',
    city: 'Минск',
    logo: 'https://i.pravatar.cc/200?img=61',
    businessCategory: 'ПВЗ',
    rating: 4.3,
    reviewsCount: 38,
    totalShiftsPublished: 150,
    plan: 'business',
    planExpiresAt: '2026-09-30',
    locations: [
      { id: 'loc3', companyId: 'c2', address: 'ул. Притыцкого, 83', city: 'Минск', lat: 53.9080, lng: 27.4820, name: 'ПВЗ Каменная горка' },
    ],
    registeredAt: '2025-02-20',
  },
  {
    id: 'c3',
    role: 'employer',
    companyName: 'Кафе «Васильки»',
    unp: '190987654',
    contactPerson: 'Марина Соколова',
    phone: '+375293003030',
    city: 'Минск',
    logo: 'https://i.pravatar.cc/200?img=62',
    businessCategory: 'HoReCa',
    rating: 4.8,
    reviewsCount: 52,
    totalShiftsPublished: 95,
    plan: 'business',
    planExpiresAt: '2026-08-15',
    locations: [
      { id: 'loc4', companyId: 'c3', address: 'ул. Якуба Коласа, 37', city: 'Минск', lat: 53.9180, lng: 27.5840, name: 'Васильки Коласа' },
      { id: 'loc5', companyId: 'c3', address: 'пр. Победителей, 65', city: 'Минск', lat: 53.9150, lng: 27.5380, name: 'Васильки Победителей' },
    ],
    registeredAt: '2025-04-10',
  },
  {
    id: 'c4',
    role: 'employer',
    companyName: 'Ресторан «Литвины»',
    unp: '192345678',
    contactPerson: 'Олег Тарасов',
    phone: '+375444004040',
    city: 'Минск',
    logo: 'https://i.pravatar.cc/200?img=63',
    businessCategory: 'HoReCa',
    rating: 4.1,
    reviewsCount: 19,
    totalShiftsPublished: 40,
    plan: 'free',
    planExpiresAt: null,
    locations: [
      { id: 'loc6', companyId: 'c4', address: 'ул. Зыбицкая, 6', city: 'Минск', lat: 53.9030, lng: 27.5560, name: 'Литвины Зыбицкая' },
    ],
    registeredAt: '2025-06-01',
  },
  {
    id: 'c5',
    role: 'employer',
    companyName: 'Склад-Логистик',
    unp: '193567890',
    contactPerson: 'Дмитрий Волков',
    phone: '+375295005050',
    city: 'Минск',
    logo: 'https://i.pravatar.cc/200?img=64',
    businessCategory: 'Склад/Логистика',
    rating: 4.4,
    reviewsCount: 67,
    totalShiftsPublished: 220,
    plan: 'premium',
    planExpiresAt: '2026-11-30',
    locations: [
      { id: 'loc7', companyId: 'c5', address: 'ул. Тимирязева, 121А', city: 'Минск', lat: 53.9320, lng: 27.5170, name: 'Склад Тимирязева' },
      { id: 'loc8', companyId: 'c5', address: 'ул. Шаранговича, 19', city: 'Минск', lat: 53.9275, lng: 27.5055, name: 'Склад Шаранговича' },
    ],
    registeredAt: '2025-01-05',
  },
  {
    id: 'c6',
    role: 'employer',
    companyName: 'ТЦ «Галерея»',
    unp: '290876543',
    contactPerson: 'Наталья Крук',
    phone: '+375336006060',
    city: 'Минск',
    logo: 'https://i.pravatar.cc/200?img=65',
    businessCategory: 'Ритейл',
    rating: 4.5,
    reviewsCount: 28,
    totalShiftsPublished: 75,
    plan: 'business',
    planExpiresAt: '2026-10-15',
    locations: [
      { id: 'loc9', companyId: 'c6', address: 'пр. Победителей, 9', city: 'Минск', lat: 53.9090, lng: 27.5480, name: 'Галерея Победителей' },
    ],
    registeredAt: '2025-05-22',
  },
  {
    id: 'c7',
    role: 'employer',
    companyName: 'Чисто-Блеск',
    unp: '191234560',
    contactPerson: 'Елена Макарова',
    phone: '+375447007070',
    city: 'Минск',
    logo: 'https://i.pravatar.cc/200?img=66',
    businessCategory: 'Клининг',
    rating: 4.7,
    reviewsCount: 34,
    totalShiftsPublished: 110,
    plan: 'business',
    planExpiresAt: '2026-07-20',
    locations: [
      { id: 'loc10', companyId: 'c7', address: 'ул. Немига, 12', city: 'Минск', lat: 53.9040, lng: 27.5530, name: 'Офис Немига' },
    ],
    registeredAt: '2025-03-01',
  },
  {
    id: 'c8',
    role: 'employer',
    companyName: 'Минск-Продукт',
    unp: '193210987',
    contactPerson: 'Виктор Савицкий',
    phone: '+375298008080',
    city: 'Минск',
    logo: 'https://i.pravatar.cc/200?img=67',
    businessCategory: 'Производство',
    rating: 3.9,
    reviewsCount: 12,
    totalShiftsPublished: 30,
    plan: 'free',
    planExpiresAt: null,
    locations: [
      { id: 'loc11', companyId: 'c8', address: 'ул. Харьковская, 50', city: 'Минск', lat: 53.8660, lng: 27.6140, name: 'Завод Харьковская' },
    ],
    registeredAt: '2025-09-15',
  },
];

// ============ SHIFTS (25) ============
const today = new Date();
const fmt = (d) => d.toISOString().split('T')[0];
const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

export const MOCK_SHIFTS = [
  // TODAY
  { id: 's1', companyId: 'c1', locationId: 'loc1', title: 'Оператор ПВЗ', description: 'Приём и выдача заказов Ozon. Сканирование посылок, помощь клиентам. Обучение на месте.', date: addDays(0), timeStart: '10:00', timeEnd: '18:00', durationHours: 8, pay: 65, payPerHour: 8.13, spotsTotal: 2, spotsTaken: 1, urgent: true, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: true, minAge: 18, ownClothes: false, other: null }, status: 'active', createdAt: addDays(-1) },
  { id: 's2', companyId: 'c5', locationId: 'loc7', title: 'Грузчик', description: 'Разгрузка фур, распределение товаров по зонам хранения. Работа в команде 4 человека.', date: addDays(0), timeStart: '08:00', timeEnd: '16:00', durationHours: 8, pay: 75, payPerHour: 9.38, spotsTotal: 4, spotsTaken: 2, urgent: true, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: false, minAge: 18, ownClothes: true, other: 'Удобная обувь обязательна' }, status: 'active', createdAt: addDays(-2) },
  { id: 's3', companyId: 'c3', locationId: 'loc4', title: 'Официант', description: 'Обслуживание гостей в зале. Приём заказов, подача блюд, расчёт. Опыт приветствуется.', date: addDays(0), timeStart: '12:00', timeEnd: '22:00', durationHours: 10, pay: 90, payPerHour: 9.0, spotsTotal: 3, spotsTaken: 3, urgent: false, requirements: { noExperienceOk: false, medicalBookRequired: true, smartphoneRequired: false, minAge: 18, ownClothes: false, other: 'Аккуратный внешний вид' }, status: 'filled', createdAt: addDays(-3) },

  // TOMORROW
  { id: 's4', companyId: 'c2', locationId: 'loc3', title: 'Оператор ПВЗ Wildberries', description: 'Выдача и приём товаров. Работа с кассой и терминалом. Консультирование клиентов.', date: addDays(1), timeStart: '09:00', timeEnd: '21:00', durationHours: 12, pay: 95, payPerHour: 7.92, spotsTotal: 2, spotsTaken: 0, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: true, minAge: 18, ownClothes: false, other: null }, status: 'active', createdAt: addDays(-1) },
  { id: 's5', companyId: 'c7', locationId: 'loc10', title: 'Уборщик офисов', description: 'Генеральная уборка офисных помещений. Мытьё полов, протирка поверхностей, вынос мусора.', date: addDays(1), timeStart: '07:00', timeEnd: '13:00', durationHours: 6, pay: 45, payPerHour: 7.5, spotsTotal: 3, spotsTaken: 1, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: false, minAge: null, ownClothes: false, other: null }, status: 'active', createdAt: addDays(-1) },
  { id: 's6', companyId: 'c6', locationId: 'loc9', title: 'Продавец-консультант', description: 'Консультирование покупателей, помощь в выборе одежды, работа в примерочной, поддержание порядка в зале.', date: addDays(1), timeStart: '10:00', timeEnd: '20:00', durationHours: 10, pay: 80, payPerHour: 8.0, spotsTotal: 2, spotsTaken: 0, urgent: false, requirements: { noExperienceOk: false, medicalBookRequired: false, smartphoneRequired: false, minAge: 18, ownClothes: false, other: 'Приятный внешний вид, коммуникабельность' }, status: 'active', createdAt: addDays(-2) },
  { id: 's7', companyId: 'c4', locationId: 'loc6', title: 'Помощник повара', description: 'Подготовка ингредиентов, помощь в приготовлении блюд, поддержание чистоты на кухне.', date: addDays(1), timeStart: '11:00', timeEnd: '23:00', durationHours: 12, pay: 110, payPerHour: 9.17, spotsTotal: 1, spotsTaken: 0, urgent: true, requirements: { noExperienceOk: true, medicalBookRequired: true, smartphoneRequired: false, minAge: 18, ownClothes: false, other: null }, status: 'active', createdAt: addDays(0) },

  // DAY +2
  { id: 's8', companyId: 'c1', locationId: 'loc2', title: 'Оператор ПВЗ', description: 'Приём и выдача заказов. Работа с ПО Ozon, сканер, принтер этикеток.', date: addDays(2), timeStart: '10:00', timeEnd: '20:00', durationHours: 10, pay: 80, payPerHour: 8.0, spotsTotal: 1, spotsTaken: 0, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: true, minAge: 18, ownClothes: false, other: null }, status: 'active', createdAt: addDays(-1) },
  { id: 's9', companyId: 'c5', locationId: 'loc8', title: 'Сборщик заказов', description: 'Сборка заказов по накладным. Упаковка, маркировка, передача на отгрузку.', date: addDays(2), timeStart: '06:00', timeEnd: '14:00', durationHours: 8, pay: 70, payPerHour: 8.75, spotsTotal: 5, spotsTaken: 2, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: false, minAge: 18, ownClothes: true, other: 'Закрытая обувь' }, status: 'active', createdAt: addDays(-2) },
  { id: 's10', companyId: 'c3', locationId: 'loc5', title: 'Официант', description: 'Обслуживание столиков, знание меню, работа с R-Keeper.', date: addDays(2), timeStart: '16:00', timeEnd: '00:00', durationHours: 8, pay: 72, payPerHour: 9.0, spotsTotal: 2, spotsTaken: 0, urgent: false, requirements: { noExperienceOk: false, medicalBookRequired: true, smartphoneRequired: false, minAge: 18, ownClothes: false, other: null }, status: 'active', createdAt: addDays(-1) },

  // DAY +3
  { id: 's11', companyId: 'c8', locationId: 'loc11', title: 'Разнорабочий', description: 'Помощь на производственной линии. Упаковка готовой продукции, уборка рабочего места.', date: addDays(3), timeStart: '08:00', timeEnd: '17:00', durationHours: 9, pay: 68, payPerHour: 7.56, spotsTotal: 3, spotsTaken: 0, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: true, smartphoneRequired: false, minAge: 18, ownClothes: true, other: null }, status: 'active', createdAt: addDays(-1) },
  { id: 's12', companyId: 'c7', locationId: 'loc10', title: 'Уборщик', description: 'Ежедневная уборка коммерческих помещений. Санузлы, коридоры, офисы.', date: addDays(3), timeStart: '18:00', timeEnd: '22:00', durationHours: 4, pay: 32, payPerHour: 8.0, spotsTotal: 2, spotsTaken: 0, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: false, minAge: null, ownClothes: false, other: null }, status: 'active', createdAt: addDays(0) },
  { id: 's13', companyId: 'c6', locationId: 'loc9', title: 'Промоутер', description: 'Раздача листовок и промо-материалов у входа в ТЦ. Общение с посетителями, презентация акций.', date: addDays(3), timeStart: '11:00', timeEnd: '19:00', durationHours: 8, pay: 55, payPerHour: 6.88, spotsTotal: 4, spotsTaken: 1, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: false, minAge: null, ownClothes: false, other: 'Активность и общительность' }, status: 'active', createdAt: addDays(-2) },

  // DAY +4
  { id: 's14', companyId: 'c2', locationId: 'loc3', title: 'Сортировщик Wildberries', description: 'Сортировка и раскладка товаров на ПВЗ, работа со сканером, приём возвратов.', date: addDays(4), timeStart: '08:00', timeEnd: '14:00', durationHours: 6, pay: 48, payPerHour: 8.0, spotsTotal: 2, spotsTaken: 0, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: true, minAge: 18, ownClothes: false, other: null }, status: 'active', createdAt: addDays(-1) },
  { id: 's15', companyId: 'c5', locationId: 'loc7', title: 'Водитель погрузчика', description: 'Работа на электропогрузчике. Перемещение паллет на складе.', date: addDays(4), timeStart: '07:00', timeEnd: '19:00', durationHours: 12, pay: 120, payPerHour: 10.0, spotsTotal: 1, spotsTaken: 0, urgent: true, requirements: { noExperienceOk: false, medicalBookRequired: false, smartphoneRequired: false, minAge: 18, ownClothes: true, other: 'Удостоверение водителя погрузчика обязательно' }, status: 'active', createdAt: addDays(0) },
  { id: 's16', companyId: 'c3', locationId: 'loc4', title: 'Бармен', description: 'Приготовление коктейлей и напитков, обслуживание гостей за барной стойкой.', date: addDays(4), timeStart: '18:00', timeEnd: '02:00', durationHours: 8, pay: 85, payPerHour: 10.63, spotsTotal: 1, spotsTaken: 0, urgent: false, requirements: { noExperienceOk: false, medicalBookRequired: true, smartphoneRequired: false, minAge: 18, ownClothes: false, other: 'Опыт работы от 6 месяцев' }, status: 'active', createdAt: addDays(-1) },

  // DAY +5
  { id: 's17', companyId: 'c1', locationId: 'loc1', title: 'Курьер ПВЗ', description: 'Доставка крупногабаритных заказов по Минску. Свой транспорт не требуется.', date: addDays(5), timeStart: '09:00', timeEnd: '18:00', durationHours: 9, pay: 85, payPerHour: 9.44, spotsTotal: 2, spotsTaken: 0, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: true, minAge: 18, ownClothes: false, other: null }, status: 'active', createdAt: addDays(-1) },
  { id: 's18', companyId: 'c4', locationId: 'loc6', title: 'Официант', description: 'Обслуживание VIP-зала. Знание винной карты приветствуется.', date: addDays(5), timeStart: '17:00', timeEnd: '01:00', durationHours: 8, pay: 95, payPerHour: 11.88, spotsTotal: 2, spotsTaken: 0, urgent: false, requirements: { noExperienceOk: false, medicalBookRequired: true, smartphoneRequired: false, minAge: 18, ownClothes: false, other: 'Опыт работы обязателен' }, status: 'active', createdAt: addDays(0) },

  // DAY +6
  { id: 's19', companyId: 'c7', locationId: 'loc10', title: 'Мойщик окон', description: 'Мойка окон в бизнес-центре (нижние этажи). Все материалы предоставляются.', date: addDays(6), timeStart: '08:00', timeEnd: '16:00', durationHours: 8, pay: 70, payPerHour: 8.75, spotsTotal: 3, spotsTaken: 0, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: false, minAge: 18, ownClothes: true, other: null }, status: 'active', createdAt: addDays(-1) },
  { id: 's20', companyId: 'c5', locationId: 'loc8', title: 'Комплектовщик', description: 'Подбор товаров по заказам со стеллажей, формирование коробок, наклейка этикеток.', date: addDays(6), timeStart: '06:00', timeEnd: '18:00', durationHours: 12, pay: 100, payPerHour: 8.33, spotsTotal: 6, spotsTaken: 0, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: false, minAge: 18, ownClothes: true, other: null }, status: 'active', createdAt: addDays(0) },

  // COMPLETED (past)
  { id: 's21', companyId: 'c1', locationId: 'loc1', title: 'Оператор ПВЗ', description: 'Приём и выдача заказов.', date: addDays(-3), timeStart: '10:00', timeEnd: '18:00', durationHours: 8, pay: 65, payPerHour: 8.13, spotsTotal: 2, spotsTaken: 2, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: true, minAge: 18, ownClothes: false, other: null }, status: 'completed', createdAt: addDays(-5) },
  { id: 's22', companyId: 'c3', locationId: 'loc4', title: 'Официант', description: 'Обслуживание гостей.', date: addDays(-5), timeStart: '12:00', timeEnd: '22:00', durationHours: 10, pay: 90, payPerHour: 9.0, spotsTotal: 2, spotsTaken: 2, urgent: false, requirements: { noExperienceOk: false, medicalBookRequired: true, smartphoneRequired: false, minAge: 18, ownClothes: false, other: null }, status: 'completed', createdAt: addDays(-7) },
  { id: 's23', companyId: 'c5', locationId: 'loc7', title: 'Грузчик', description: 'Разгрузка товаров.', date: addDays(-7), timeStart: '08:00', timeEnd: '16:00', durationHours: 8, pay: 75, payPerHour: 9.38, spotsTotal: 3, spotsTaken: 3, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: false, minAge: 18, ownClothes: true, other: null }, status: 'completed', createdAt: addDays(-9) },
  { id: 's24', companyId: 'c7', locationId: 'loc10', title: 'Уборщик', description: 'Уборка офисов.', date: addDays(-2), timeStart: '07:00', timeEnd: '13:00', durationHours: 6, pay: 45, payPerHour: 7.5, spotsTotal: 2, spotsTaken: 2, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: false, minAge: null, ownClothes: false, other: null }, status: 'completed', createdAt: addDays(-4) },

  // CANCELLED
  { id: 's25', companyId: 'c8', locationId: 'loc11', title: 'Разнорабочий', description: 'Помощь на производстве.', date: addDays(-1), timeStart: '08:00', timeEnd: '17:00', durationHours: 9, pay: 68, payPerHour: 7.56, spotsTotal: 2, spotsTaken: 1, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: true, smartphoneRequired: false, minAge: 18, ownClothes: true, other: null }, status: 'cancelled', createdAt: addDays(-4) },
];

// ============ APPLICATIONS (30) ============
export const MOCK_APPLICATIONS = [
  // Active shift s1 — 1 approved (w1), 1 pending (w2)
  { id: 'a1', shiftId: 's1', workerId: 'w1', status: 'approved', appliedAt: addDays(-1), respondedAt: addDays(-1) },
  { id: 'a2', shiftId: 's1', workerId: 'w2', status: 'pending', appliedAt: addDays(0), respondedAt: null },

  // Active shift s2 — 2 approved (w3, w5), 1 pending (w9)
  { id: 'a3', shiftId: 's2', workerId: 'w3', status: 'approved', appliedAt: addDays(-2), respondedAt: addDays(-2) },
  { id: 'a4', shiftId: 's2', workerId: 'w5', status: 'approved', appliedAt: addDays(-1), respondedAt: addDays(-1) },
  { id: 'a5', shiftId: 's2', workerId: 'w9', status: 'pending', appliedAt: addDays(0), respondedAt: null },

  // Filled shift s3 — all approved
  { id: 'a6', shiftId: 's3', workerId: 'w2', status: 'approved', appliedAt: addDays(-3), respondedAt: addDays(-3) },
  { id: 'a7', shiftId: 's3', workerId: 'w6', status: 'approved', appliedAt: addDays(-3), respondedAt: addDays(-3) },
  { id: 'a8', shiftId: 's3', workerId: 'w8', status: 'approved', appliedAt: addDays(-3), respondedAt: addDays(-3) },
  { id: 'a9', shiftId: 's3', workerId: 'w4', status: 'rejected', appliedAt: addDays(-3), respondedAt: addDays(-3) },

  // Tomorrow shifts
  { id: 'a10', shiftId: 's4', workerId: 'w1', status: 'pending', appliedAt: addDays(0), respondedAt: null },
  { id: 'a11', shiftId: 's5', workerId: 'w4', status: 'approved', appliedAt: addDays(-1), respondedAt: addDays(0) },
  { id: 'a12', shiftId: 's7', workerId: 'w6', status: 'pending', appliedAt: addDays(0), respondedAt: null },

  // Completed shifts — all approved
  { id: 'a13', shiftId: 's21', workerId: 'w1', status: 'approved', appliedAt: addDays(-5), respondedAt: addDays(-5) },
  { id: 'a14', shiftId: 's21', workerId: 'w8', status: 'approved', appliedAt: addDays(-5), respondedAt: addDays(-5) },
  { id: 'a15', shiftId: 's22', workerId: 'w2', status: 'approved', appliedAt: addDays(-7), respondedAt: addDays(-7) },
  { id: 'a16', shiftId: 's22', workerId: 'w6', status: 'approved', appliedAt: addDays(-7), respondedAt: addDays(-7) },
  { id: 'a17', shiftId: 's23', workerId: 'w3', status: 'approved', appliedAt: addDays(-9), respondedAt: addDays(-9) },
  { id: 'a18', shiftId: 's23', workerId: 'w5', status: 'approved', appliedAt: addDays(-9), respondedAt: addDays(-9) },
  { id: 'a19', shiftId: 's23', workerId: 'w1', status: 'approved', appliedAt: addDays(-9), respondedAt: addDays(-9) },
  { id: 'a20', shiftId: 's24', workerId: 'w4', status: 'approved', appliedAt: addDays(-4), respondedAt: addDays(-4) },
  { id: 'a21', shiftId: 's24', workerId: 'w10', status: 'approved', appliedAt: addDays(-4), respondedAt: addDays(-4) },

  // Rejected
  { id: 'a22', shiftId: 's6', workerId: 'w9', status: 'rejected', appliedAt: addDays(-1), respondedAt: addDays(0) },
  { id: 'a23', shiftId: 's8', workerId: 'w5', status: 'rejected', appliedAt: addDays(-1), respondedAt: addDays(0) },

  // Cancelled by worker
  { id: 'a24', shiftId: 's9', workerId: 'w7', status: 'cancelled_by_worker', appliedAt: addDays(-2), respondedAt: null },
  { id: 'a25', shiftId: 's11', workerId: 'w3', status: 'pending', appliedAt: addDays(0), respondedAt: null },
  { id: 'a26', shiftId: 's13', workerId: 'w8', status: 'approved', appliedAt: addDays(-2), respondedAt: addDays(-1) },
  { id: 'a27', shiftId: 's14', workerId: 'w2', status: 'pending', appliedAt: addDays(0), respondedAt: null },
  { id: 'a28', shiftId: 's15', workerId: 'w3', status: 'pending', appliedAt: addDays(0), respondedAt: null },

  // Cancelled shift
  { id: 'a29', shiftId: 's25', workerId: 'w5', status: 'approved', appliedAt: addDays(-4), respondedAt: addDays(-3) },
  { id: 'a30', shiftId: 's25', workerId: 'w7', status: 'pending', appliedAt: addDays(-3), respondedAt: null },
];

// ============ REVIEWS (40) ============
export const MOCK_REVIEWS = [
  // Worker about company
  { id: 'r1', type: 'worker_about_company', authorId: 'w1', targetId: 'c1', shiftId: 's21', overallRating: 5, categoryRatings: { conditions: 5, descriptionMatch: 5, attitude: 5, paymentSpeed: 5 }, text: 'Отличный ПВЗ, всё организовано, быстрая оплата. Рекомендую!', anonymous: false, recommendAgain: null, createdAt: addDays(-2) },
  { id: 'r2', type: 'worker_about_company', authorId: 'w8', targetId: 'c1', shiftId: 's21', overallRating: 4, categoryRatings: { conditions: 4, descriptionMatch: 5, attitude: 4, paymentSpeed: 4 }, text: 'Хорошие условия, но бывает много работы в пиковые часы.', anonymous: false, recommendAgain: null, createdAt: addDays(-2) },
  { id: 'r3', type: 'worker_about_company', authorId: 'w2', targetId: 'c3', shiftId: 's22', overallRating: 5, categoryRatings: { conditions: 5, descriptionMatch: 5, attitude: 5, paymentSpeed: 5 }, text: 'Прекрасное кафе! Коллектив дружелюбный, чаевые хорошие.', anonymous: false, recommendAgain: null, createdAt: addDays(-4) },
  { id: 'r4', type: 'worker_about_company', authorId: 'w6', targetId: 'c3', shiftId: 's22', overallRating: 5, categoryRatings: { conditions: 5, descriptionMatch: 4, attitude: 5, paymentSpeed: 5 }, text: 'Очень довольна! Управляющая помогала во всём.', anonymous: false, recommendAgain: null, createdAt: addDays(-4) },
  { id: 'r5', type: 'worker_about_company', authorId: 'w3', targetId: 'c5', shiftId: 's23', overallRating: 4, categoryRatings: { conditions: 4, descriptionMatch: 4, attitude: 4, paymentSpeed: 5 }, text: 'Нормальный склад, работа тяжёлая, но платят хорошо и вовремя.', anonymous: false, recommendAgain: null, createdAt: addDays(-6) },
  { id: 'r6', type: 'worker_about_company', authorId: 'w5', targetId: 'c5', shiftId: 's23', overallRating: 3, categoryRatings: { conditions: 3, descriptionMatch: 3, attitude: 4, paymentSpeed: 5 }, text: 'Тяжело физически. Описание не совсем соответствовало.', anonymous: true, recommendAgain: null, createdAt: addDays(-6) },
  { id: 'r7', type: 'worker_about_company', authorId: 'w1', targetId: 'c5', shiftId: 's23', overallRating: 5, categoryRatings: { conditions: 4, descriptionMatch: 5, attitude: 5, paymentSpeed: 5 }, text: 'Работаю здесь регулярно. Стабильный заказчик, рекомендую.', anonymous: false, recommendAgain: null, createdAt: addDays(-6) },
  { id: 'r8', type: 'worker_about_company', authorId: 'w4', targetId: 'c7', shiftId: 's24', overallRating: 5, categoryRatings: { conditions: 5, descriptionMatch: 5, attitude: 5, paymentSpeed: 4 }, text: 'Всё чисто и аккуратно организовано. Спасибо!', anonymous: false, recommendAgain: null, createdAt: addDays(-1) },
  { id: 'r9', type: 'worker_about_company', authorId: 'w10', targetId: 'c7', shiftId: 's24', overallRating: 4, categoryRatings: { conditions: 4, descriptionMatch: 4, attitude: 5, paymentSpeed: 4 }, text: 'Хороший клининг, работа не сложная.', anonymous: false, recommendAgain: null, createdAt: addDays(-1) },
  { id: 'r10', type: 'worker_about_company', authorId: 'w5', targetId: 'c8', shiftId: 's25', overallRating: 2, categoryRatings: { conditions: 2, descriptionMatch: 2, attitude: 3, paymentSpeed: 1 }, text: 'Смену отменили в последний момент, оплату не получил.', anonymous: true, recommendAgain: null, createdAt: addDays(-1) },

  // Additional worker_about_company reviews
  { id: 'r11', type: 'worker_about_company', authorId: 'w2', targetId: 'c1', shiftId: 's21', overallRating: 5, categoryRatings: { conditions: 5, descriptionMatch: 5, attitude: 5, paymentSpeed: 5 }, text: null, anonymous: false, recommendAgain: null, createdAt: addDays(-3) },
  { id: 'r12', type: 'worker_about_company', authorId: 'w3', targetId: 'c2', shiftId: 's21', overallRating: 4, categoryRatings: { conditions: 4, descriptionMatch: 4, attitude: 3, paymentSpeed: 5 }, text: 'Много работы, но платят.', anonymous: false, recommendAgain: null, createdAt: addDays(-5) },
  { id: 'r13', type: 'worker_about_company', authorId: 'w6', targetId: 'c4', shiftId: 's22', overallRating: 4, categoryRatings: { conditions: 4, descriptionMatch: 4, attitude: 4, paymentSpeed: 3 }, text: 'Ресторан хороший, но оплата задерживается.', anonymous: false, recommendAgain: null, createdAt: addDays(-6) },
  { id: 'r14', type: 'worker_about_company', authorId: 'w8', targetId: 'c6', shiftId: 's22', overallRating: 5, categoryRatings: { conditions: 5, descriptionMatch: 5, attitude: 5, paymentSpeed: 5 }, text: 'ТЦ очень удобно расположен, работать приятно.', anonymous: false, recommendAgain: null, createdAt: addDays(-4) },
  { id: 'r15', type: 'worker_about_company', authorId: 'w1', targetId: 'c2', shiftId: 's21', overallRating: 4, categoryRatings: { conditions: 4, descriptionMatch: 4, attitude: 4, paymentSpeed: 4 }, text: null, anonymous: false, recommendAgain: null, createdAt: addDays(-8) },
  { id: 'r16', type: 'worker_about_company', authorId: 'w4', targetId: 'c5', shiftId: 's23', overallRating: 4, categoryRatings: { conditions: 3, descriptionMatch: 4, attitude: 5, paymentSpeed: 5 }, text: 'Склад далеко, но условия нормальные.', anonymous: false, recommendAgain: null, createdAt: addDays(-7) },
  { id: 'r17', type: 'worker_about_company', authorId: 'w9', targetId: 'c1', shiftId: 's21', overallRating: 5, categoryRatings: { conditions: 5, descriptionMatch: 5, attitude: 5, paymentSpeed: 5 }, text: 'Первая смена, всё понравилось!', anonymous: false, recommendAgain: null, createdAt: addDays(-3) },
  { id: 'r18', type: 'worker_about_company', authorId: 'w2', targetId: 'c7', shiftId: 's24', overallRating: 5, categoryRatings: { conditions: 5, descriptionMatch: 5, attitude: 5, paymentSpeed: 5 }, text: null, anonymous: false, recommendAgain: null, createdAt: addDays(-2) },
  { id: 'r19', type: 'worker_about_company', authorId: 'w8', targetId: 'c5', shiftId: 's23', overallRating: 4, categoryRatings: { conditions: 4, descriptionMatch: 4, attitude: 4, paymentSpeed: 5 }, text: 'Стабильно и предсказуемо, это хорошо.', anonymous: false, recommendAgain: null, createdAt: addDays(-7) },
  { id: 'r20', type: 'worker_about_company', authorId: 'w3', targetId: 'c3', shiftId: 's22', overallRating: 5, categoryRatings: { conditions: 5, descriptionMatch: 5, attitude: 5, paymentSpeed: 5 }, text: 'Лучшее кафе для подработки!', anonymous: false, recommendAgain: null, createdAt: addDays(-5) },

  // Company about worker
  { id: 'r21', type: 'company_about_worker', authorId: 'c1', targetId: 'w1', shiftId: 's21', overallRating: 5, categoryRatings: { punctuality: 5, workQuality: 5, communication: 5, appearance: 5 }, text: 'Отличный сотрудник! Пунктуальный, ответственный. Ждём снова.', anonymous: false, recommendAgain: true, createdAt: addDays(-2) },
  { id: 'r22', type: 'company_about_worker', authorId: 'c1', targetId: 'w8', shiftId: 's21', overallRating: 4, categoryRatings: { punctuality: 4, workQuality: 5, communication: 4, appearance: 4 }, text: 'Хорошо справилась, немного опоздала.', anonymous: false, recommendAgain: true, createdAt: addDays(-2) },
  { id: 'r23', type: 'company_about_worker', authorId: 'c3', targetId: 'w2', shiftId: 's22', overallRating: 5, categoryRatings: { punctuality: 5, workQuality: 5, communication: 5, appearance: 5 }, text: 'Замечательная официантка! Гости довольны.', anonymous: false, recommendAgain: true, createdAt: addDays(-4) },
  { id: 'r24', type: 'company_about_worker', authorId: 'c3', targetId: 'w6', shiftId: 's22', overallRating: 5, categoryRatings: { punctuality: 5, workQuality: 5, communication: 5, appearance: 5 }, text: 'Профессионал! Обязательно пригласим снова.', anonymous: false, recommendAgain: true, createdAt: addDays(-4) },
  { id: 'r25', type: 'company_about_worker', authorId: 'c5', targetId: 'w3', shiftId: 's23', overallRating: 5, categoryRatings: { punctuality: 5, workQuality: 5, communication: 4, appearance: 4 }, text: 'Сильный, выносливый. Работает за двоих.', anonymous: false, recommendAgain: true, createdAt: addDays(-6) },
  { id: 'r26', type: 'company_about_worker', authorId: 'c5', targetId: 'w5', shiftId: 's23', overallRating: 3, categoryRatings: { punctuality: 3, workQuality: 3, communication: 3, appearance: 3 }, text: 'Справился, но медленно. Нужно больше опыта.', anonymous: false, recommendAgain: false, createdAt: addDays(-6) },
  { id: 'r27', type: 'company_about_worker', authorId: 'c5', targetId: 'w1', shiftId: 's23', overallRating: 5, categoryRatings: { punctuality: 5, workQuality: 5, communication: 5, appearance: 5 }, text: 'Наш постоянный сотрудник. Рекомендуем!', anonymous: false, recommendAgain: true, createdAt: addDays(-6) },
  { id: 'r28', type: 'company_about_worker', authorId: 'c7', targetId: 'w4', shiftId: 's24', overallRating: 5, categoryRatings: { punctuality: 5, workQuality: 5, communication: 5, appearance: 5 }, text: 'Идеальная работа! Чисто и аккуратно.', anonymous: false, recommendAgain: true, createdAt: addDays(-1) },
  { id: 'r29', type: 'company_about_worker', authorId: 'c7', targetId: 'w10', shiftId: 's24', overallRating: 4, categoryRatings: { punctuality: 4, workQuality: 4, communication: 4, appearance: 4 }, text: 'Всё хорошо, спасибо.', anonymous: false, recommendAgain: true, createdAt: addDays(-1) },
  { id: 'r30', type: 'company_about_worker', authorId: 'c3', targetId: 'w3', shiftId: 's22', overallRating: 4, categoryRatings: { punctuality: 5, workQuality: 4, communication: 3, appearance: 4 }, text: 'Старательный, но не хватает навыков общения с гостями.', anonymous: false, recommendAgain: true, createdAt: addDays(-5) },

  // More company about worker
  { id: 'r31', type: 'company_about_worker', authorId: 'c1', targetId: 'w2', shiftId: 's21', overallRating: 5, categoryRatings: { punctuality: 5, workQuality: 5, communication: 5, appearance: 5 }, text: null, anonymous: false, recommendAgain: true, createdAt: addDays(-3) },
  { id: 'r32', type: 'company_about_worker', authorId: 'c2', targetId: 'w1', shiftId: 's21', overallRating: 5, categoryRatings: { punctuality: 5, workQuality: 5, communication: 5, appearance: 5 }, text: 'Лучший оператор ПВЗ!', anonymous: false, recommendAgain: true, createdAt: addDays(-8) },
  { id: 'r33', type: 'company_about_worker', authorId: 'c6', targetId: 'w8', shiftId: 's22', overallRating: 5, categoryRatings: { punctuality: 5, workQuality: 5, communication: 5, appearance: 5 }, text: 'Прекрасный промоутер!', anonymous: false, recommendAgain: true, createdAt: addDays(-4) },
  { id: 'r34', type: 'company_about_worker', authorId: 'c5', targetId: 'w8', shiftId: 's23', overallRating: 4, categoryRatings: { punctuality: 4, workQuality: 4, communication: 5, appearance: 4 }, text: null, anonymous: false, recommendAgain: true, createdAt: addDays(-7) },
  { id: 'r35', type: 'company_about_worker', authorId: 'c4', targetId: 'w6', shiftId: 's22', overallRating: 4, categoryRatings: { punctuality: 4, workQuality: 4, communication: 5, appearance: 5 }, text: 'Улыбчивая и приятная.', anonymous: false, recommendAgain: true, createdAt: addDays(-6) },
  { id: 'r36', type: 'company_about_worker', authorId: 'c1', targetId: 'w9', shiftId: 's21', overallRating: 4, categoryRatings: { punctuality: 4, workQuality: 4, communication: 4, appearance: 4 }, text: 'Для новичка — молодец.', anonymous: false, recommendAgain: true, createdAt: addDays(-3) },
  { id: 'r37', type: 'company_about_worker', authorId: 'c2', targetId: 'w3', shiftId: 's21', overallRating: 5, categoryRatings: { punctuality: 5, workQuality: 5, communication: 4, appearance: 4 }, text: null, anonymous: false, recommendAgain: true, createdAt: addDays(-5) },
  { id: 'r38', type: 'company_about_worker', authorId: 'c7', targetId: 'w2', shiftId: 's24', overallRating: 5, categoryRatings: { punctuality: 5, workQuality: 5, communication: 5, appearance: 5 }, text: 'Идеально!', anonymous: false, recommendAgain: true, createdAt: addDays(-2) },
  { id: 'r39', type: 'company_about_worker', authorId: 'c8', targetId: 'w5', shiftId: 's25', overallRating: 2, categoryRatings: { punctuality: 2, workQuality: 2, communication: 2, appearance: 3 }, text: 'Не справился с задачей.', anonymous: false, recommendAgain: false, createdAt: addDays(-1) },
  { id: 'r40', type: 'company_about_worker', authorId: 'c5', targetId: 'w4', shiftId: 's23', overallRating: 5, categoryRatings: { punctuality: 5, workQuality: 5, communication: 5, appearance: 5 }, text: 'Суперработник! Надёжная и аккуратная.', anonymous: false, recommendAgain: true, createdAt: addDays(-7) },
];

// ============ NOTIFICATIONS (20) ============
export const MOCK_NOTIFICATIONS = [
  // For worker w1
  { id: 'n1', userId: 'w1', type: 'application_approved', title: 'Отклик подтверждён', body: 'Ваш отклик на «Оператор ПВЗ» подтверждён!', relatedShiftId: 's1', read: false, createdAt: addDays(-1) },
  { id: 'n2', userId: 'w1', type: 'shift_reminder', title: 'Напоминание о смене', body: 'Завтра смена «Оператор ПВЗ Wildberries» в 09:00', relatedShiftId: 's4', read: false, createdAt: addDays(0) },
  { id: 'n3', userId: 'w1', type: 'review_received', title: 'Новый отзыв', body: 'Ozon ПВЗ Минск оставил вам отзыв: ★5', relatedShiftId: 's21', read: true, createdAt: addDays(-2) },
  { id: 'n4', userId: 'w1', type: 'payment_sent', title: 'Оплата отправлена', body: 'Оплата 65 BYN за смену 07 апр отправлена', relatedShiftId: 's21', read: true, createdAt: addDays(-2) },
  { id: 'n5', userId: 'w1', type: 'nearby_shift', title: 'Смена рядом!', body: 'Новая смена в 1.2 км от вас! Грузчик — 75 BYN', relatedShiftId: 's2', read: false, createdAt: addDays(0) },

  // For worker w2
  { id: 'n6', userId: 'w2', type: 'application_approved', title: 'Отклик подтверждён', body: 'Ваш отклик на «Официант» в Кафе Васильки подтверждён!', relatedShiftId: 's3', read: true, createdAt: addDays(-3) },
  { id: 'n7', userId: 'w2', type: 'review_received', title: 'Новый отзыв', body: 'Кафе Васильки оставил вам отзыв: ★5', relatedShiftId: 's22', read: false, createdAt: addDays(-4) },

  // For worker w4
  { id: 'n8', userId: 'w4', type: 'application_approved', title: 'Отклик подтверждён', body: 'Ваш отклик на «Уборщик офисов» подтверждён!', relatedShiftId: 's5', read: false, createdAt: addDays(0) },
  { id: 'n9', userId: 'w4', type: 'application_rejected', title: 'Отклик отклонён', body: 'К сожалению, ваш отклик на «Официант» отклонён', relatedShiftId: 's3', read: true, createdAt: addDays(-3) },

  // For worker w5
  { id: 'n10', userId: 'w5', type: 'shift_cancelled', title: 'Смена отменена', body: 'Смена «Разнорабочий» в Минск-Продукт отменена заказчиком', relatedShiftId: 's25', read: false, createdAt: addDays(-1) },

  // For employer c1
  { id: 'n11', userId: 'c1', type: 'new_application', title: 'Новый отклик', body: 'Новый отклик на «Оператор ПВЗ» от Дарья Н.', relatedShiftId: 's1', read: false, createdAt: addDays(0) },
  { id: 'n12', userId: 'c1', type: 'review_received', title: 'Новый отзыв', body: 'Исполнитель оставил отзыв о вашей компании: ★5', relatedShiftId: 's21', read: true, createdAt: addDays(-2) },
  { id: 'n13', userId: 'c1', type: 'shift_starting_soon', title: 'Смена скоро начнётся', body: 'Смена «Оператор ПВЗ» начинается через 2 часа. Подтверждённых: 1', relatedShiftId: 's1', read: false, createdAt: addDays(0) },

  // For employer c3
  { id: 'n14', userId: 'c3', type: 'new_application', title: 'Новый отклик', body: 'Новый отклик на «Помощник повара» от Анна К.', relatedShiftId: 's7', read: false, createdAt: addDays(0) },
  { id: 'n15', userId: 'c3', type: 'shift_filled', title: 'Смена укомплектована', body: 'Смена «Официант» полностью укомплектована', relatedShiftId: 's3', read: true, createdAt: addDays(-3) },

  // For employer c5
  { id: 'n16', userId: 'c5', type: 'new_application', title: 'Новый отклик', body: 'Новый отклик на «Грузчик» от Артём Л.', relatedShiftId: 's2', read: false, createdAt: addDays(0) },
  { id: 'n17', userId: 'c5', type: 'new_application', title: 'Новый отклик', body: 'Новый отклик на «Водитель погрузчика» от Иван Б.', relatedShiftId: 's15', read: false, createdAt: addDays(0) },
  { id: 'n18', userId: 'c5', type: 'review_received', title: 'Новый отзыв', body: 'Исполнитель оставил отзыв: ★4', relatedShiftId: 's23', read: true, createdAt: addDays(-6) },

  // For employer c8
  { id: 'n19', userId: 'c8', type: 'plan_expiring', title: 'Подписка', body: 'У вас бесплатный тариф. Обновите для безлимитных смен!', relatedShiftId: null, read: false, createdAt: addDays(-1) },

  // For worker w3
  { id: 'n20', userId: 'w3', type: 'review_received', title: 'Новый отзыв', body: 'Склад-Логистик оставил вам отзыв: ★5', relatedShiftId: 's23', read: true, createdAt: addDays(-6) },
];

// ============ HELPER CONSTANTS ============
export const CITIES = ['Минск', 'Гомель', 'Гродно', 'Брест', 'Могилёв', 'Витебск'];

export const WORKER_CATEGORIES = [
  'ПВЗ', 'Склад', 'Грузчик', 'Продавец', 'Официант',
  'Повар', 'Курьер', 'Клининг', 'Промоутер', 'Разнорабочий', 'Другое',
];

export const BUSINESS_CATEGORIES = [
  'ПВЗ', 'HoReCa', 'Ритейл', 'Склад/Логистика',
  'Клининг', 'Производство', 'Ивенты', 'Другое',
];

export const BADGE_INFO = {
  verified: { label: 'Верифицирован', icon: 'shield-checkmark', color: '#4F46E5' },
  top10: { label: 'Топ-10%', icon: 'star', color: '#F59E0B' },
  fifty_shifts: { label: '50+ смен', icon: 'flame', color: '#EF4444' },
  no_cancels: { label: 'Без отмен', icon: 'diamond', color: '#8B5CF6' },
  medical_book: { label: 'Медкнижка', icon: 'document-text', color: '#059669' },
  newbie: { label: 'Новичок', icon: 'leaf', color: '#22C55E' },
  verified_company: { label: 'Проверенная', icon: 'checkmark-circle', color: '#4F46E5' },
  top_employer: { label: 'Топ-работодатель', icon: 'star', color: '#F59E0B' },
  fast_payment: { label: 'Быстрая оплата', icon: 'cash', color: '#059669' },
  premium_badge: { label: 'Премиум', icon: 'trophy', color: '#8B5CF6' },
};

export const SHIFT_TEMPLATES = [
  'Оператор ПВЗ', 'Грузчик', 'Продавец-консультант', 'Официант',
  'Уборщик', 'Курьер', 'Сборщик заказов', 'Разнорабочий',
];
