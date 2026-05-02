/**
 * Seed Firestore with mock data (dev utility, RN Firebase).
 */

import { db } from './firebase';
import {
  MOCK_WORKERS, MOCK_COMPANIES, MOCK_SHIFTS,
  MOCK_APPLICATIONS, MOCK_REVIEWS, MOCK_NOTIFICATIONS,
} from '../data/mockData';

export async function seedDatabase() {
  console.log('🌱 Starting Firestore seed...');

  const batch1 = db.batch();
  const batch2 = db.batch();
  const batch3 = db.batch();

  MOCK_WORKERS.forEach(worker => {
    batch1.set(db.collection('users').doc(worker.id), { ...worker, createdAt: new Date().toISOString() });
  });
  MOCK_COMPANIES.forEach(company => {
    batch1.set(db.collection('users').doc(company.id), { ...company, createdAt: new Date().toISOString() });
  });
  await batch1.commit();
  console.log('  ✅ Users committed');

  MOCK_SHIFTS.forEach(shift => {
    batch2.set(db.collection('shifts').doc(shift.id), { ...shift, createdAt: new Date().toISOString() });
  });
  MOCK_APPLICATIONS.forEach(app => {
    batch2.set(db.collection('applications').doc(app.id), { ...app });
  });
  await batch2.commit();
  console.log('  ✅ Shifts & applications committed');

  MOCK_REVIEWS.forEach(review => {
    batch3.set(db.collection('reviews').doc(review.id), { ...review, createdAt: new Date().toISOString() });
  });
  MOCK_NOTIFICATIONS.forEach(notif => {
    batch3.set(db.collection('notifications').doc(notif.id), { ...notif, createdAt: new Date().toISOString() });
  });
  await batch3.commit();
  console.log('  ✅ Reviews & notifications committed');

  console.log('🎉 Firestore seed complete!');
  return true;
}

export async function checkIfSeeded() {
  const snap = await db.collection('users').limit(1).get();
  return snap.size > 0;
}

export async function clearDatabase() {
  console.log('🗑 Clearing Firestore...');
  const collections = ['users', 'shifts', 'applications', 'reviews', 'notifications', 'conversations'];
  for (const col of collections) {
    const snap = await db.collection(col).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log(`  🗑 ${col}: ${snap.size} docs deleted`);
  }
  console.log('✅ Database cleared');
}
