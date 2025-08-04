import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import { AppContext } from '../../types';
import { uploadToGitHub } from '../../lib/github-upload';
import { getDb } from "../../lib/firestore";

const IndividualMembershipInputSchema = z.object({
    fullName: z.string().min(2, { message: "Full name is required." }),
    email: z.string().email(),
    institution: z.string().min(2, { message: "Institution is required." }),
    phone: z.string().min(10, { message: "Phone number is required." }),
    applicationFormUri: z.string(),
    applicationFormName: z.string(),
});

const IndividualMembershipOutputSchema = z.object({
    applicationId: z.string(),
    message: z.string(),
});

export class IndividualMembershipCreate extends OpenAPIRoute {
    schema = {
        request: {
            body: contentJson(IndividualMembershipInputSchema),
        },
        responses: {
            '201': {
                description: 'Individual membership application created successfully',
                ...contentJson(IndividualMembershipOutputSchema),
            },
        },
    };

    async handle(c: AppContext) {
        const { body } = await this.getValidatedData<typeof this.schema>();

        const applicationId = `PACUIT-INDIV-${Date.now()}`;

        const applicationFormUpload = await uploadToGitHub(
            body.applicationFormUri.split("base64,")[1],
            body.applicationFormName,
            applicationId,
            c.env
        );

        const db = getDb(c.env);
        await db.collection("individualMemberships").add({
            applicationId,
            fullName: body.fullName,
            email: body.email,
            institution: body.institution,
            phone: body.phone,
            status: 'Pending',
            submittedAt: new Date().toISOString(),
            document: {
                name: 'Application Form',
                html_url: applicationFormUpload.html_url,
                download_url: applicationFormUpload.download_url,
            }
        });

        return c.json({
            applicationId,
            message: 'Application submitted successfully. A confirmation email has been sent.',
        }, 201);
    }
}
