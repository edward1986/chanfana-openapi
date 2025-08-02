import { z } from "zod";

export const submission = z.object({
  id: z.number().int(),
  registration_id: z.string(),
  full_name: z.string(),
  email: z.string().email(),
  contact_number: z.string(),
  institution: z.string(),
  research_title: z.string(),
  bionote: z.string(),
  co_authors: z.string().optional(),
  keywords: z.string(),
  status: z.string(),
  submitted_at: z.string().datetime(),
  abstract_name: z.string(),
  abstract_html_url: z.string(),
  abstract_download_url: z.string(),
  proof_of_payment_name: z.string(),
  proof_of_payment_html_url: z.string(),
  proof_of_payment_download_url: z.string(),
});

export const SubmissionModel = {
  tableName: "submissions",
  primaryKeys: ["id"],
  schema: submission,
  serializer: (obj: Record<string, string | number | boolean>) => {
    return {
      ...obj,
    };
  },
  serializerObject: submission,
};
