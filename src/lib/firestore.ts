// src/lib/firestore.ts
import type { Env } from '../types';
import jwt from '@tsndr/cloudflare-worker-jwt';

// Convert plain JS → Firestore REST “fields” format
function toFirestoreFields(obj: Record<string, any>) {
    if (!obj) {
        return { fields: {} };
    }
	const fields: Record<string, any> = {};
	for (const [k, v] of Object.entries(obj)) {
		if (typeof v === 'string') fields[k] = { stringValue: v };
		else if (typeof v === 'number') fields[k] = { doubleValue: v };
		else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
		else if (v instanceof Date) fields[k] = { timestampValue: v.toISOString() };
		else if (v === null) fields[k] = { nullValue: null };
		// extend for arrays/maps as needed…
	}
	return { fields };
}

// Convert Firestore REST “fields” format → plain JS
function fromFirestoreFields(firestoreDoc: any) {
    if (!firestoreDoc || !firestoreDoc.fields) {
        return {};
    }
	const obj: Record<string, any> = {};
    const id = firestoreDoc.name.split('/').pop();
    obj['id'] = id;

	for (const [k, v] of Object.entries(firestoreDoc.fields)) {
        const valueType = Object.keys(v)[0];
        obj[k] = v[valueType];
	}
	return obj;
}

export class Firestore {
	private env: Env['Bindings'];
	private accessToken: string | null = null;
	private tokenExpiry: number = 0;

	constructor(env: Env['Bindings']) {
		this.env = env;
	}

	private async getAccessToken() {
		if (this.accessToken && Date.now() < this.tokenExpiry) {
			return this.accessToken;
		}

		const iat = Math.floor(Date.now() / 1000);
		this.tokenExpiry = iat + 3500;

        const privateKey = this.env.FIRESTORE_PRIVATE_KEY.replace(/\\n/g, '\n');
        const clientEmail = this.env.FIRESTORE_CLIENT_EMAIL;

		const token = await jwt.sign({
            exp: iat + 3600,
            iat: iat,
            iss: clientEmail,
            scope: 'https://www.googleapis.com/auth/datastore',
            aud: 'https://oauth2.googleapis.com/token',
        }, privateKey, { algorithm: 'RS256' });

		const resp = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
				assertion: token,
			}),
		});

        const tokenResponse = await resp.json();
        if (!resp.ok) {
            throw new Error(`Failed to get access token: ${JSON.stringify(tokenResponse)}`);
        }

		const { access_token } = tokenResponse as { access_token: string };
        if (!access_token) {
            throw new Error(`access_token not found in response: ${JSON.stringify(tokenResponse)}`);
        }
		this.accessToken = access_token;
		return this.accessToken;
	}

	private getUrl(path: string) {
		return `https://firestore.googleapis.com/v1/projects/${this.env.FIRESTORE_PROJECT_ID}/databases/(default)/documents/${path}`;
	}

    private async request(url: string, method: string, body?: any) {
        const token = await this.getAccessToken();
        const res = await fetch(url, {
			method,
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: body ? JSON.stringify(body) : undefined,
		});

        if (!res.ok) {
			const err = await res.text();
			throw new Error(`Firestore REST error ${res.status}: ${err}`);
		}
		return res.json();
    }

	async addDocument(collection: string, data: Record<string, any>) {
		const body = toFirestoreFields(data);
		const url = this.getUrl(collection);
		const response = await this.request(url, 'POST', body);
        return fromFirestoreFields(response);
	}

    async listDocuments(collection: string) {
        const url = this.getUrl(collection);
        const response = await this.request(url, 'GET');
        if (!response.documents) {
            return [];
        }
        return response.documents.map(fromFirestoreFields);
    }

    async getDocument(collection: string, id: string) {
        const url = this.getUrl(`${collection}/${id}`);
        const response = await this.request(url, 'GET');
        return fromFirestoreFields(response);
    }

    async updateDocument(collection: string, id: string, data: Record<string, any>) {
        const body = toFirestoreFields(data);
        const url = this.getUrl(`${collection}/${id}`);
        const response = await this.request(url, 'PATCH', body);
        return fromFirestoreFields(response);
    }

    async deleteDocument(collection: string, id: string) {
        const url = this.getUrl(`${collection}/${id}`);
        await this.request(url, 'DELETE');
        return { id };
    }
}
