import { Context } from "hono";
import { getDb } from "../../lib/firestore";
import { HandleArgs } from "../../types";

export const TaskCreate = async (c: Context<HandleArgs>) => {
  const body = await c.req.json();

  // Basic validation, can be improved with zod
  if (!body.name || !body.slug) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  try {
    const db = getDb(c.env);
    const newTask = await db.add("tasks", body);
    return c.json(newTask, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
