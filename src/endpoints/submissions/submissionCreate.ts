import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import { AppContext } from '../../types';
import { uploadToGitHub } from '../../lib/github-upload';
import { addDocument } from '../../lib/firestore-rest';

const RegisterParticipantInputSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  contactNumber: z.string(),
  institution: z.string(),
  researchTitle: z.string(),
  bionote: z.string(),
  coAuthors: z.string().optional(),
  keywords: z.string(),
  abstractFileDataUri: z.string().describe("The abstract file as a data URI."),
  abstractFileName: z.string(),
  proofOfPaymentDataUri: z.string().describe("The proof of payment file as a data URI."),
  proofOfPaymentFileName: z.string(),
});

const RegisterParticipantOutputSchema = z.object({
  registrationId: z.string(),
  message: z.string(),
});

export class SubmissionCreate extends OpenAPIRoute {
  schema = {
    request: {
      body: contentJson(RegisterParticipantInputSchema),
    },
    responses: {
      '201': {
        description: 'Submission created successfully',
        ...contentJson(RegisterParticipantOutputSchema),
      },
    },
  };

  async handle(c: AppContext) {
    const { body } = await this.getValidatedData<typeof this.schema>();

    const registrationId = `PACUIT2025-${Date.now()}`;

    // Upload files
    const abstractUpload = await uploadToGitHub(body.abstractFileDataUri.split("base64,")[1], body.abstractFileName, registrationId, c.env);
    const paymentUpload = await uploadToGitHub(body.proofOfPaymentDataUri.split("base64,")[1], body.proofOfPaymentFileName, registrationId, c.env);

    // Save to Firestore
    await addDocument("submissions", {
      registrationId,
      fullName: body.fullName,
      email: body.email,
      contactNumber: body.contactNumber,
      institution: body.institution,
      researchTitle: body.researchTitle,
      bionote: body.bionote,
      coAuthors: body.coAuthors || 'N/A',
      keywords: body.keywords,
      status: 'Pending Review',
      submittedAt:  new Date().toISOString(),
      abstract: { name: body.abstractFileName, ...abstractUpload },
      proofOfPayment: { name: body.proofOfPaymentFileName, ...paymentUpload },
    }, c.env);

    return {
      registrationId,
      message: 'Registration successful. Please check your email for confirmation.',
    };
  }
}
