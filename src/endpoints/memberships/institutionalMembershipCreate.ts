import { OpenAPIRoute, contentJson } from 'chanfana';
import { z } from 'zod';
import { AppContext } from '../../types';
import { uploadToGitHub } from '../../lib/github-upload';
import { getDb } from "../../lib/firestore";
import nodemailer from 'nodemailer';

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

export async function sendEmail(env: any, to: string, subject: string, body: string, attachments?: {filename: string, content: string}[]) {
    if (!env.EMAIL_USER || !env.EMAIL_PASS) {
        console.log('------- EMAIL_USER or EMAIL_PASS not set in .env file. Simulating email. -------');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${body}`);
        if (attachments) {
          console.log(`${attachments.length} attachment(s) logged.`);
        }
        console.log('---------------------------------------------------------------------------------');
        return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: `PACUIT Membership <${env.EMAIL_USER}>`,
      to,
      subject,
      html: body.replace(/\n/g, '<br>'),
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content.split("base64,")[1],
        encoding: 'base64',
        contentType: att.content.split(';')[0].split(':')[1]
      }))
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      throw new Error('Failed to send confirmation email.');
    }
}

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

        // Admin Notification Email
        const adminEmailSubject = `New Institutional Membership Application: ${institutionName}`;
        const adminEmailBody = `
A new application for institutional membership has been submitted.

Application ID: ${applicationId}
Institution Name: ${institutionName}
Contact Person: ${contactPerson}
Email: ${email}
Contact Number: ${contactNumber}

All required documents are attached.
        `;

        // User Confirmation Email
        const userEmailSubject = `PACUIT Institutional Membership Application Received - ID: ${applicationId}`;
        const userEmailBody = `
Dear ${contactPerson},

Thank you for your interest in joining the Philippine Association of Colleges and Universities of Industrial Technology (PACUIT), Inc.

Your application for institutional membership for ${institutionName} has been received. Your unique application ID is ${applicationId}.

Our secretariat will review your submission and get back to you within 5-7 working days regarding the status of your application.

We appreciate your interest in becoming part of our network.

Sincerely,
The PACUIT Secretariat
        `;

        const adminAttachments = [
          { filename: letterOfIntentName, content: letterOfIntentUri },
          { filename: registrationName, content: registrationUri },
          { filename: facultyListName, content: facultyListUri },
          { filename: applicationFormName, content: applicationFormUri },
        ];

        // Send emails
        await Promise.all([
            sendEmail(
                c.env,
                'pacuit.info@gmail.com', // Admin email
                adminEmailSubject,
                adminEmailBody,
                adminAttachments
            ),
            sendEmail(
                c.env,
                email,
                userEmailSubject,
                userEmailBody
            )
        ]);

        return c.json({
            applicationId,
            message: 'Application submitted successfully. A confirmation email has been sent.',
        }, 201);
    }
}
