// src/lib/firestore-rest.ts
import type { Env } from "../types";
import { SignJWT } from "jose";

// Mint a short-lived OAuth2 token using your SA JSON
async function getAccessToken(env: Env["Bindings"]) {
    const sa = JSON.parse(env.FIRESTORE_SA_JSON);
    const iat = Math.floor(Date.now() / 1000);

    const jwt = await new SignJWT({
        scope: "https://www.googleapis.com/auth/datastore",
    })
        .setProtectedHeader({ alg: "RS256", typ: "JWT" })
        .setIssuedAt(iat)
        .setExpirationTime(iat + 3600)
        .setIssuer(sa.client_email)
        .setAudience("https://oauth2.googleapis.com/token")
        .sign(
            await crypto.subtle.importKey(
                "pkcs8",
                decodeBase64(sa.private_key.replace(/-----.*?-----/g, "")),
                { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
                false,
                ["sign"]
            )
        );

    const resp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion:  jwt,
        }),
    });
    const { access_token } = await resp.json();
    return access_token as string;
}

// Convert plain JS → Firestore REST “fields” format
function toFirestoreFields(obj: Record<string, any>) {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string")       fields[k] = { stringValue: v };
        else if (typeof v === "number")  fields[k] = { doubleValue: v };
        else if (typeof v === "boolean") fields[k] = { booleanValue: v };
        else if (v instanceof Date)      fields[k] = { timestampValue: v.toISOString() };
        else if (v === null)             fields[k] = { nullValue: null };
        // extend for arrays/maps as needed…
    }
    return { fields };
}

// The function you’ll call instead of `db.collection().add()`
export async function addDocument(
    collection: string,
    data: Record<string, any>,
    env: Env["Bindings"]
) {
    const token = await getAccessToken(env);
    const body  = toFirestoreFields(data);
    const url   = `https://firestore.googleapis.com/v1/projects/${
        env.FIRESTORE_PROJECT_ID
    }/databases/(default)/documents/${collection}`;

    const res = await fetch(url, {
        method:  "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":  "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Firestore REST error ${res.status}: ${err}`);
    }
    return res.json();
}

// helper to decode base64 PEM body
function decodeBase64(str: string) {
    return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}
