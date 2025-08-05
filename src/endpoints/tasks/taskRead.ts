import { Context } from "hono";
import { getIssue } from "../../lib/github-issues";
import { HandleArgs } from "../../types";

export const TaskRead = async (c: Context<HandleArgs>) => {
  const id = c.req.param("id");

  try {
    const task = await getIssue(c.env, parseInt(id, 10));

    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }

    return c.json(task);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
