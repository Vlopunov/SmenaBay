/**
 * Seed Firestore with mock data
 * Run: node scripts/seed.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAFO_K_HCf2EQMTYUmWGBEB2NkgBKajGFg',
  authDomain: 'smenabay.firebaseapp.com',
  projectId: 'smenabay',
  storageBucket: 'smenabay.firebasestorage.app',
  messagingSenderId: '1087544794452',
  appId: '1:1087544794452:android:d42c9ca0b944df436dbcc1',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === Helper ===
const today = new Date();
const fmt = (d) => d.toISOString().split('T')[0];
const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();

// === WORKERS ===
const WORKERS = [
  { id: 'w1', role: 'worker', firstName: 'Алексей', lastName: 'Ковалёв', phone: '+375291234567', city: 'Минск', avatar: '', categories: ['ПВЗ', 'Склад', 'Грузчик'], rating: 4.9, shiftsCompleted: 87, badges: ['verified', 'top10', 'fifty_shifts', 'no_cancels'], documents: { passport: true, medicalBook: false }, verified: true, phoneVisible: true, phoneVerified: true, lastSeen: minutesAgo(1), registeredAt: '2025-06-15' },
  { id: 'w2', role: 'worker', firstName: 'Дарья', lastName: 'Новикова', phone: '+375337654321', city: 'Минск', avatar: '', categories: ['Продавец', 'Промоутер', 'Официант'], rating: 4.7, shiftsCompleted: 42, badges: ['verified', 'no_cancels'], documents: { passport: true, medicalBook: true }, verified: true, phoneVisible: true, phoneVerified: true, lastSeen: minutesAgo(10), registeredAt: '2025-08-20' },
  { id: 'w3', role: 'worker', firstName: 'Иван', lastName: 'Белый', phone: '+375441112233', city: 'Минск', avatar: '', categories: ['Грузчик', 'Разнорабочий', 'Склад'], rating: 4.5, shiftsCompleted: 120, badges: ['verified', 'top10', 'fifty_shifts'], documents: { passport: true, medicalBook: false }, verified: true, phoneVisible: true, phoneVerified: true, lastSeen: minutesAgo(45), registeredAt: '2025-03-10' },
];

// === COMPANIES ===
const COMPANIES = [
  { id: 'c1', role: 'employer', companyName: 'Ozon ПВЗ Минск', unp: '193456789', contactPerson: 'Светлана Иванова', phone: '+375291001010', city: 'Минск', logo: '', businessCategory: 'ПВЗ', rating: 4.6, reviewsCount: 45, totalShiftsPublished: 180, plan: 'premium', phoneVisible: true, phoneVerified: true, lastSeen: minutesAgo(0), planExpiresAt: '2026-12-31', locations: [ { id: 'loc1', companyId: 'c1', address: 'пр. Независимости, 58', city: 'Минск', lat: 53.9006, lng: 27.5590, name: 'ПВЗ Немига' }, { id: 'loc2', companyId: 'c1', address: 'ул. Сурганова, 27', city: 'Минск', lat: 53.9235, lng: 27.5882, name: 'ПВЗ Академия наук' } ], registeredAt: '2025-01-15' },
  { id: 'c3', role: 'employer', companyName: 'Кафе «Васильки»', unp: '391654987', contactPerson: 'Анна Петрова', phone: '+375293003030', city: 'Минск', logo: '', businessCategory: 'HoReCa', rating: 4.3, reviewsCount: 67, totalShiftsPublished: 220, plan: 'business', phoneVisible: true, phoneVerified: true, planExpiresAt: '2026-06-30', locations: [ { id: 'loc4', companyId: 'c3', address: 'ул. Якуба Коласа, 37', city: 'Минск', lat: 53.9178, lng: 27.5800, name: 'Васильки Площадь Якуба Коласа' } ], registeredAt: '2025-02-20' },
  { id: 'c5', role: 'employer', companyName: 'Склад-Логистик', unp: '590123456', contactPerson: 'Дмитрий Козлов', phone: '+375295005050', city: 'Минск', logo: '', businessCategory: 'Склад/Логистика', rating: 4.4, reviewsCount: 32, totalShiftsPublished: 95, plan: 'premium', phoneVisible: true, phoneVerified: true, lastSeen: minutesAgo(5), planExpiresAt: '2026-12-31', locations: [ { id: 'loc7', companyId: 'c5', address: 'ул. Притыцкого, 62', city: 'Минск', lat: 53.8910, lng: 27.4850, name: 'Склад Каменная Горка' } ], registeredAt: '2025-04-01' },
];

// === SHIFTS ===
const SHIFTS = [
  { id: 's1', companyId: 'c1', locationId: 'loc1', title: 'Оператор ПВЗ', description: 'Приём и выдача заказов Ozon. Сканирование посылок, помощь клиентам.', date: addDays(0), timeStart: '10:00', timeEnd: '18:00', durationHours: 8, pay: 65, payPerHour: 8.13, spotsTotal: 2, spotsTaken: 1, urgent: true, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: true, minAge: 18, ownClothes: false, other: null }, status: 'active', createdAt: addDays(-1) },
  { id: 's2', companyId: 'c5', locationId: 'loc7', title: 'Грузчик', description: 'Разгрузка фур, распределение товаров по зонам хранения.', date: addDays(0), timeStart: '08:00', timeEnd: '16:00', durationHours: 8, pay: 75, payPerHour: 9.38, spotsTotal: 4, spotsTaken: 2, urgent: true, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: false, minAge: 18, ownClothes: true, other: 'Удобная обувь' }, status: 'active', createdAt: addDays(-2) },
  { id: 's3', companyId: 'c3', locationId: 'loc4', title: 'Официант', description: 'Обслуживание гостей в зале. Приём заказов, подача блюд.', date: addDays(0), timeStart: '12:00', timeEnd: '22:00', durationHours: 10, pay: 90, payPerHour: 9.0, spotsTotal: 3, spotsTaken: 3, urgent: false, requirements: { noExperienceOk: false, medicalBookRequired: true, smartphoneRequired: false, minAge: 18, ownClothes: false, other: 'Аккуратный вид' }, status: 'filled', createdAt: addDays(-3) },
  { id: 's4', companyId: 'c1', locationId: 'loc2', title: 'Оператор ПВЗ', description: 'Приём и выдача заказов, работа со сканером.', date: addDays(1), timeStart: '09:00', timeEnd: '21:00', durationHours: 12, pay: 95, payPerHour: 7.92, spotsTotal: 1, spotsTaken: 0, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: true, minAge: 18, ownClothes: false, other: null }, status: 'active', createdAt: addDays(-1) },
  { id: 's5', companyId: 'c5', locationId: 'loc7', title: 'Сборщик заказов', description: 'Комплектация заказов на складе по накладным.', date: addDays(1), timeStart: '07:00', timeEnd: '15:00', durationHours: 8, pay: 70, payPerHour: 8.75, spotsTotal: 3, spotsTaken: 0, urgent: false, requirements: { noExperienceOk: true, medicalBookRequired: false, smartphoneRequired: false, minAge: 18, ownClothes: true, other: null }, status: 'active', createdAt: addDays(0) },
];

// === APPLICATIONS ===
const APPLICATIONS = [
  { id: 'a1', shiftId: 's1', workerId: 'w1', status: 'approved', appliedAt: addDays(-1), respondedAt: addDays(-1) },
  { id: 'a2', shiftId: 's1', workerId: 'w2', status: 'pending', appliedAt: addDays(0), respondedAt: null },
  { id: 'a3', shiftId: 's2', workerId: 'w3', status: 'approved', appliedAt: addDays(-2), respondedAt: addDays(-2) },
];

// === REVIEWS ===
const REVIEWS = [
  { id: 'r1', shiftId: 's1', authorId: 'w1', targetId: 'c1', type: 'worker_about_company', overallRating: 5, categoryRatings: { professionalism: 5, communication: 5, quality: 4, timeliness: 5 }, text: 'Отличное место! Всё чётко организовано.', createdAt: addDays(-2) },
  { id: 'r2', shiftId: 's1', authorId: 'c1', targetId: 'w1', type: 'company_about_worker', overallRating: 5, categoryRatings: { professionalism: 5, communication: 5, quality: 5, timeliness: 5 }, text: 'Алексей — отличный работник, рекомендуем!', createdAt: addDays(-2) },
];

// === NOTIFICATIONS ===
const NOTIFICATIONS = [
  { id: 'n1', userId: 'w1', type: 'application_approved', title: 'Отклик подтверждён', body: 'Ваш отклик на «Оператор ПВЗ» подтверждён!', relatedShiftId: 's1', read: false, createdAt: addDays(-1) },
  { id: 'n2', userId: 'c1', type: 'new_application', title: 'Новый отклик', body: 'Дарья Н. откликнулась на «Оператор ПВЗ»', relatedShiftId: 's1', read: false, createdAt: addDays(0) },
];

// === SEED ===
async function seed() {
  console.log('🌱 Seeding Firestore...\n');

  // Check if already seeded
  const snap = await getDocs(collection(db, 'users'));
  if (snap.size > 0) {
    console.log(`⚠️  Database already has ${snap.size} users. Skipping seed.`);
    console.log('   To re-seed, delete all data in Firebase Console first.');
    process.exit(0);
  }

  // Batch 1: Users
  const batch1 = writeBatch(db);
  [...WORKERS, ...COMPANIES].forEach(user => {
    batch1.set(doc(db, 'users', user.id), user);
  });
  await batch1.commit();
  console.log(`✅ Users: ${WORKERS.length} workers + ${COMPANIES.length} companies`);

  // Batch 2: Shifts + Applications
  const batch2 = writeBatch(db);
  SHIFTS.forEach(s => batch2.set(doc(db, 'shifts', s.id), s));
  APPLICATIONS.forEach(a => batch2.set(doc(db, 'applications', a.id), a));
  await batch2.commit();
  console.log(`✅ Shifts: ${SHIFTS.length}, Applications: ${APPLICATIONS.length}`);

  // Batch 3: Reviews + Notifications
  const batch3 = writeBatch(db);
  REVIEWS.forEach(r => batch3.set(doc(db, 'reviews', r.id), r));
  NOTIFICATIONS.forEach(n => batch3.set(doc(db, 'notifications', n.id), n));
  await batch3.commit();
  console.log(`✅ Reviews: ${REVIEWS.length}, Notifications: ${NOTIFICATIONS.length}`);

  console.log('\n🎉 Firestore seeded successfully!');
  console.log('\nNext steps:');
  console.log('  1. Set USE_FIRESTORE = true in src/services/firestore.js');
  console.log('  2. Restart the app');
  process.exit(0);
}

seed().catch(e => { console.error('❌ Seed failed:', e); process.exit(1); });
