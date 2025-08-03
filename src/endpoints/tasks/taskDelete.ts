import { Context } from "hono";
import { getDb } from "../../lib/firestore";
import { HandleArgs } from "../../types";

export const TaskDelete = async (c: Context<HandleArgs>) => {
  const id = c.req.param("id");

  try {
    const db = getDb(c.env);
    await db.delete("tasks", id);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
