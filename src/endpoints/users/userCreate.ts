import { Context } from "hono";
import { createIssue } from "../../lib/github-issues";
import { HandleArgs } from "../../types";
import { userSchema } from "./schema";

export const UserCreate = async (c: Context<HandleArgs>) => {
  const body = await c.req.json();
  const validation = userSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: validation.error.message }, 400);
  }

  try {
    const newUser = await createIssue(c.env, body.username, body, ["user"]);
    return c.json(newUser, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
