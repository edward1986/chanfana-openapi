import { Context } from "hono";
import { updateIssue } from "../../lib/github-issues";
import { HandleArgs } from "../../types";

export const TaskUpdate = async (c: Context<HandleArgs>) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  try {
    await updateIssue(c.env, parseInt(id, 10), body);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
