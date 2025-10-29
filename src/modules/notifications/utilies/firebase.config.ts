import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Get absolute path from project root
const serviceAccountPath = path.resolve(process.cwd(), 'src/config/tarqat-bab-firebase-adminsdk-fbsvc-7895d73e89.json');

// Verify file exists
if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Firebase service account file not found at: ${serviceAccountPath}`);
}

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
    });
} catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
}

export { admin };
