import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import { AppContext } from '../../types';
import { uploadToGitHub } from '../../lib/github-upload';
import { SubmissionModel } from './base';

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

    // Save to D1
    const db = c.env.DB;
    const stmt = db.prepare(
      `INSERT INTO ${SubmissionModel.tableName} (registration_id, full_name, email, contact_number, institution, research_title, bionote, co_authors, keywords, status, abstract_name, abstract_html_url, abstract_download_url, proof_of_payment_name, proof_of_payment_html_url, proof_of_payment_download_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      registrationId,
      body.fullName,
      body.email,
      body.contactNumber,
      body.institution,
      body.researchTitle,
      body.bionote,
      body.coAuthors || 'N/A',
      body.keywords,
      'Pending Review',
      body.abstractFileName,
      abstractUpload.html_url,
      abstractUpload.download_url,
      body.proofOfPaymentFileName,
      paymentUpload.html_url,
      paymentUpload.download_url
    );

    await stmt.run();

    return {
      registrationId,
      message: 'Registration successful. Please check your email for confirmation.',
    };
  }
}
