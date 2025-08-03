import { z } from "zod";

export const task = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  completed: z.boolean(),
  due_date: z.string().datetime(),
});

export const TaskModel = {
  collectionName: "tasks",
  schema: task,
};
