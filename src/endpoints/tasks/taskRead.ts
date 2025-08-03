import { Context } from "hono";
import { getDb } from "../../lib/firestore";
import { HandleArgs } from "../../types";

export const TaskRead = async (c: Context<HandleArgs>) => {
  const id = c.req.param("id");

  try {
    const db = getDb(c.env);
    const task = await db.get("tasks", id);

    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }

    return c.json({ id: task.id, ...task.data() });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
