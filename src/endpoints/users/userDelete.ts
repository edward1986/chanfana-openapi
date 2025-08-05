import { Context } from "hono";
import { closeIssue } from "../../lib/github-issues";
import { HandleArgs } from "../../types";

export const UserDelete = async (c: Context<HandleArgs>) => {
  const id = c.req.param("id");

  try {
    await closeIssue(c.env, parseInt(id, 10));
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
