import { Context } from "hono";
import { updateIssue } from "../../lib/github-issues";
import { HandleArgs } from "../../types";
import { userSchema } from "./schema";

export const UserUpdate = async (c: Context<HandleArgs>) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const validation = userSchema.partial().safeParse(body);

  if (!validation.success) {
    return c.json({ error: validation.error.message }, 400);
  }

  try {
    await updateIssue(c.env, parseInt(id, 10), body);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
