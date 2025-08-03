import type { Context } from "hono";

export type AppContext = Context<{ Bindings: Env }>;
export type HandleArgs = [AppContext];

declare global {
    interface Env {
        Bindings: {
            FIRESTORE_PROJECT_ID: string;
            FIRESTORE_CLIENT_EMAIL: string;
            FIRESTORE_PRIVATE_KEY: string;
        };
    }
}
