import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables from .development.env
dotenv.config({ path: '.development.env' });

const ensureEnvVariable = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Environment variable ${name} is not set`);
    }
    return value;
};

try {
    const serviceAccountString = ensureEnvVariable('FIREBASE_SERVICE_ACCOUNT');
    const serviceAccount = JSON.parse(serviceAccountString);
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized successfully');
} catch (error) {
    if (error instanceof SyntaxError) {
        console.error('Invalid JSON format in FIREBASE_SERVICE_ACCOUNT');
    }
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
}

export { admin };
