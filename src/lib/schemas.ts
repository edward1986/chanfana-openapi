import { z } from "zod";

// Base schema for a Task
export const taskSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
});

// Schema for when a task is being updated (all fields are optional)
export const taskUpdateSchema = taskSchema.partial();

// Base schema for a User
export const userSchema = z.object({
  email: z.string().email(),
  username: z.string(),
});

// Schema for when a user is being updated (all fields are optional)
export const userUpdateSchema = userSchema.partial();

// Schema for path parameters that include an ID
export const paramsSchema = z.object({
  id: z.string(),
});

// Schema for path parameters that include a slug
export const slugSchema = z.object({
  slug: z.string(),
});
