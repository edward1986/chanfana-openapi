import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { Env } from "../../types";

let db: ReturnType<typeof getFirestore>;

export function getDb(env: Env["Bindings"]) {
    if (!db) {
        const serviceAccount = {
            projectId: env.FIRESTORE_PROJECT_ID,
            clientEmail: env.FIRESTORE_CLIENT_EMAIL,
            privateKey: env.FIRESTORE_PRIVATE_KEY.replace(/\\n/g, "\n")
        };
        if (getApps().length === 0) {
            initializeApp({
                credential: cert(serviceAccount),
                projectId: serviceAccount.projectId,
            });
        }
        db = getFirestore();
    }
    return db;
}
