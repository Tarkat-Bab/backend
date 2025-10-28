import * as admin from 'firebase-admin';
import * as path from 'path';

const serviceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
});

export { admin };
