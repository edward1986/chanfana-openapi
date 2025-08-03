import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import { AppContext } from '../../types';
import { uploadToGitHub } from '../../lib/github-upload';
import { SubmissionModel } from './base';
import {getDb} from "../../lib/firestore";

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
    const db = getDb(c.env);
    await db.collection("submissions").add({
      registration_id: registrationId,
      full_name: body.fullName,
      email: body.email,
      contact_number: body.contactNumber,
      institution: body.institution,
      research_title: body.researchTitle,
      bionote: body.bionote,
      co_authors: body.coAuthors || "N/A",
      keywords: body.keywords,
      status: "Pending Review",
      submitted_at: new Date().toISOString(),
      abstract_name: body.abstractFileName,
      abstract_html_url: abstractUpload.html_url,
      abstract_download_url: abstractUpload.download_url,
      proof_of_payment_name: body.proofOfPaymentFileName,
      proof_of_payment_html_url: paymentUpload.html_url,
      proof_of_payment_download_url: paymentUpload.download_url,
    });

    return {
      registrationId,
      message: 'Registration successful. Please check your email for confirmation.',
    };
  }
}
