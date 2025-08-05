import type { Context } from "hono";

export type AppContext = Context<{ Bindings: Env }>;
export type HandleArgs = [AppContext];

declare global {
    interface Env {
        Bindings: {
            GITHUB_TOKEN: string;
            GITHUB_OWNER: string;
            GITHUB_REPO: string;
        };
    }
}
