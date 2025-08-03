// src/lib/firestore-endpoints.ts
import { OpenAPIRoute, Path, contentJson } from 'chanfana';
import { AppContext, HandleArgs } from '../types';
import { Firestore } from './firestore';
import { z } from 'zod';

class FirestoreEndpoint<T extends HandleArgs> extends OpenAPIRoute<T> {
	_meta!: {
		model: {
			collectionName: string;
			schema: z.AnyZodObject;
			outputSchema?: z.AnyZodObject;
		};
	};

	protected getFirestore(c: AppContext) {
		return new Firestore(c.env);
	}

	getResponse(data: any) {
		const schema = this._meta.model.outputSchema || this._meta.model.schema;
		const parsedData = schema.parse(data);
        return {
            success: true,
            result: parsedData,
        }
	}

    getError(message: string, status: number) {
        return new Response(JSON.stringify({ success: false, errors: [{ message, status }] }), { status });
    }
}

export class FirestoreListEndpoint<
	T extends HandleArgs,
> extends FirestoreEndpoint<T> {
	async handle(c: AppContext) {
		const firestore = this.getFirestore(c);
		const collectionName = this._meta.model.collectionName;
		const documents = await firestore.listDocuments(collectionName);
		return {
            success: true,
            result: documents.map((doc) => this.getResponse(doc).result),
        }
	}
}

export class FirestoreCreateEndpoint<
	T extends HandleArgs,
> extends FirestoreEndpoint<T> {
	async handle(c: AppContext) {
		const firestore = this.getFirestore(c);
		const collectionName = this._meta.model.collectionName;
		const { body } = await this.getValidatedData<typeof this.schema>();
		const document = await firestore.addDocument(collectionName, body);
		return this.getResponse(document);
	}
}

export class FirestoreReadEndpoint<
	T extends HandleArgs,
> extends FirestoreEndpoint<T> {
	async handle(c: AppContext) {
		const firestore = this.getFirestore(c);
		const collectionName = this._meta.model.collectionName;
		const { params } = await this.getValidatedData<typeof this.schema>();
        try {
		    const document = await firestore.getDocument(collectionName, params.id);
		    return this.getResponse(document);
        } catch (e) {
            return this.getError("Not Found", 404);
        }
	}

	get schema() {
		return {
			params: z.object({ id: z.string() }),
		};
	}
}

export class FirestoreUpdateEndpoint<
	T extends HandleArgs,
> extends FirestoreEndpoint<T> {
	async handle(c: AppContext) {
		const firestore = this.getFirestore(c);
		const collectionName = this._meta.model.collectionName;
		const { params, body } = await this.getValidatedData<typeof this.schema>();
        try {
		    const document = await firestore.updateDocument(
			collectionName,
			params.id,
			body
		    );
		    return this.getResponse(document);
        } catch (e) {
            return this.getError("Not Found", 404);
        }
	}

	get schema() {
		return {
			params: z.object({ id: z.string() }),
			body: contentJson(this._meta.model.schema.partial()),
		};
	}
}

export class FirestoreDeleteEndpoint<
	T extends HandleArgs,
> extends FirestoreEndpoint<T> {
	async handle(c: AppContext) {
		const firestore = this.getFirestore(c);
		const collectionName = this._meta.model.collectionName;
		const { params } = await this.getValidatedData<typeof this.schema>();
        try {
		    await firestore.deleteDocument(collectionName, params.id);
		    return {
                success: true,
                result: { id: params.id },
            }
        } catch (e) {
            return this.getError("Not Found", 404);
        }
	}

	get schema() {
		return {
			params: z.object({ id: z.string() }),
		};
	}
}
