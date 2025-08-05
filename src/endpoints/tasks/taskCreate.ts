import { Context } from "hono";
import { createIssue } from "../../lib/github-issues";
import { HandleArgs } from "../../types";

export const TaskCreate = async (c: Context<HandleArgs>) => {
  const body = await c.req.json();

  // Basic validation, can be improved with zod
  if (!body.name || !body.slug) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  try {
    const newTask = await createIssue(c.env, body.name, body, ["task"]);
    return c.json(newTask, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
