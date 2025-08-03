import { SignJWT, importPKCS8 } from 'jose';

async function getAccessToken(env: Env["Bindings"]) {
    const sa = JSON.parse(env.FIRESTORE_SA_JSON);
    const key = await importPKCS8(sa.private_key, 'RS256');
    const now = Math.floor(Date.now() / 1000);
    console.log('PEM ok?:', sa.private_key.startsWith('-----BEGIN PRIVATE KEY-----'));
    console.log('Lines:', sa.private_key.split('\n').length);
    console.log('Token URI:', sa.token_uri);
    const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/datastore' })
        .setProtectedHeader({ alg: 'RS256', kid: sa.private_key_id })
        .setIssuedAt(now)
        .setExpirationTime(now + 3600)
        .setIssuer(sa.client_email)
        .setSubject(sa.client_email)
        .setAudience(sa.token_uri)      // use the exact token_uri from your JSON
        .sign(key);

    const res = await fetch(sa.token_uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()).access_token as string;
}

export async function addDocument(coll: string, data: any, env: Env["Bindings"]) {
    const token = await getAccessToken(env);
    const body  = (data);
    const url = `https://firestore.googleapis.com/v1/projects/${env.FIRESTORE_PROJECT_ID}/databases/(default)/documents/${coll}`;
    const r = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}
