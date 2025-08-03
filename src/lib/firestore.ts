import { createFirestoreClient } from "firebase-rest-firestore";
import { Env } from "../../types";

let db: ReturnType<typeof createFirestoreClient>;

export function getDb(env: Env["Bindings"]) {
    if (!db) {
        db = createFirestoreClient({
            projectId: env.FIRESTORE_PROJECT_ID,
            clientEmail: env.FIRESTORE_CLIENT_EMAIL,
            privateKey: env.FIRESTORE_PRIVATE_KEY.replace(/\\n/g, "\n")
        });
    }
    return db;
}
