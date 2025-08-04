import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import { AppContext } from '../../types';
import { uploadToGitHub } from '../../lib/github-upload';
import { getDb } from "../../lib/firestore";

const InputSchema = z.object({
    institutionName: z.string().min(2),
    contactPerson:  z.string().min(2),
    email:          z.string().email(),
    contactNumber:  z.string().min(10),

    // data URIs and filenames
    letterOfIntentUri:    z.string().startsWith('data:'),
    letterOfIntentName:   z.string().min(1),
    registrationUri:      z.string().startsWith('data:'),
    registrationName:     z.string().min(1),
    facultyListUri:       z.string().startsWith('data:'),
    facultyListName:      z.string().min(1),
    applicationFormUri:   z.string().startsWith('data:'),
    applicationFormName:  z.string().min(1),
});

const OutputSchema = z.object({
    applicationId: z.string(),
    message: z.string(),
});

export class InstitutionalMembershipCreate extends OpenAPIRoute {
    schema = {
        request: {
            body: contentJson(InputSchema),
        },
        responses: {
            '201': {
                description: 'Institutional membership application created successfully',
                ...contentJson(OutputSchema),
            },
        },
    };

    async handle(c: AppContext) {
        const { body } = await this.getValidatedData<typeof this.schema>();

        const {
            institutionName,
            contactPerson,
            email,
            contactNumber,
            letterOfIntentUri,
            letterOfIntentName,
            registrationUri,
            registrationName,
            facultyListUri,
            facultyListName,
            applicationFormUri,
            applicationFormName,
        } = body;

        const applicationId = `PACUIT-INST-${Date.now()}`;

        const uploadFromDataUri = async (uri: string, filename: string) => {
            const [, base64] = uri.split(',');
            return uploadToGitHub(base64, filename, applicationId, c.env);
        }

        const [
            letterUpload,
            regUpload,
            facultyUpload,
            appFormUpload,
        ] = await Promise.all([
            uploadFromDataUri(letterOfIntentUri, letterOfIntentName),
            uploadFromDataUri(registrationUri, registrationName),
            uploadFromDataUri(facultyListUri, facultyListName),
            uploadFromDataUri(applicationFormUri, applicationFormName),
        ]);

        const db = getDb(c.env);
        await db.collection('institutionalMemberships').add({
            applicationId,
            institutionName,
            contactPerson,
            email,
            contactNumber,
            status: 'Pending',
            submittedAt: new Date().toISOString(),
            documents: [
                { name: 'Letter of Intent', ...letterUpload },
                { name: 'SEC/CDA Registration', ...regUpload },
                { name: 'Faculty List', ...facultyUpload },
                { name: 'Application Form', ...appFormUpload },
            ],
        });

        return c.json({
            applicationId,
            message: 'Application submitted successfully.',
        }, 201);
    }
}
