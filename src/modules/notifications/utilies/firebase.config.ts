import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.development.env' });

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

console.log('Firebase Admin initialized successfully');
export { admin };


// import * as admin from 'firebase-admin';
// import * as fs from 'fs';

// const serviceAccount = JSON.parse(
//   fs.readFileSync('tarqat-bab-firebase-adminsdk-fbsvc-61863bbc91.json', 'utf8')
// );

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// console.log('Firebase Admin initialized successfully');

// export { admin };

