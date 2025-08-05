import { Context } from "hono";
import { createIssue } from "../../lib/github-issues";
import { HandleArgs } from "../../types";

export const UserCreate = async (c: Context<HandleArgs>) => {
  const body = await c.req.json();

  // Basic validation
  if (!body.username || !body.email) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  try {
    const newUser = await createIssue(c.env, body.username, body, ["user"]);
    return c.json(newUser, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
