import { Context } from "hono";
import { getDb } from "../../lib/firestore";
import { HandleArgs } from "../../types";

export const TaskUpdate = async (c: Context<HandleArgs>) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  try {
    const db = getDb(c.env);
    await db.update("tasks", id, body);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
