import * as admin from 'firebase-admin';
import * as fs from 'fs';

// const serviceAccount = JSON.parse(
//   fs.readFileSync('tarqat-bab-firebase-adminsdk-fbsvc-61863bbc91.json', 'utf8')
// );

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

console.log('Firebase Admin initialized successfully');

export { admin };
