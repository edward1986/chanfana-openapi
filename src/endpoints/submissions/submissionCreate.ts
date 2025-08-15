import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import { AppContext } from '../../types';
import { uploadToGitHub } from '../../lib/github-upload';
import {getDb} from "../../lib/firestore";
import {sendEmail} from "../memberships/institutionalMembershipCreate";

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
    });


    const adminEmailSubject = `New PACUIT 2025 Registration: ${body.fullName}`;
    const adminEmailBody = `
A new registration has been submitted for PACUIT 2025.

Registration ID: ${registrationId}
Full Name: ${body.fullName}
Email: ${body.email}
Contact Number: ${body.contactNumber}
Institution: ${body.institution}
Research Title: ${body.researchTitle}
Bionote: ${body.bionote}
Co-authors: ${body.coAuthors || 'N/A'}
Keywords: ${body.keywords}

Abstract and proof of payment are attached.
    `;

    // User Confirmation Email
    const userEmailSubject = `PACUIT 2025 Registration Confirmation - ID: ${registrationId}`;
    const userEmailBody = `
Dear ${body.fullName},

Thank you for registering for the 21st National & 6th International PACUIT Conference!

Your registration has been received, and your unique registration ID is ${registrationId}. Please keep this for your records.

Our secretariat will validate your payment and abstract submission within 3-5 working days. You will receive another email once the validation is complete.

Conference Details:
Theme: "Driving Sustainable and Resilient Industrial Transformation: A Global Industry 5.0 Approach Through Smart Technologies"
Dates: November 12-14, 2025
Venue: USTP, Cagayan de Oro City

We look forward to seeing you at the conference!

Sincerely,
The PACUIT 2025 Organizing Committee
    `;

    // Send emails (in a real app, you'd use a service like SendGrid, Resend, etc.)
    await Promise.all([
      sendEmail(
          c.env,
          'pacuit.info@gmail.com',
          adminEmailSubject,
          adminEmailBody,
          [
            { filename: 'abstract.docx', content: body.abstractFileDataUri },
            { filename: 'payment.pdf', content: body.proofOfPaymentDataUri },
          ]
      ),
      sendEmail(
          c.env,
          body.email,
          userEmailSubject,
          userEmailBody
      )
    ]);

    return {
      registrationId,
      message: 'Registration successful. Please check your email for confirmation.',
    };
  }
}
