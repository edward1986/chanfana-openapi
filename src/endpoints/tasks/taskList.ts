import { Context } from "hono";
import { listIssues } from "../../lib/github-issues";
import { HandleArgs } from "../../types";

export const TaskList = async (c: Context<HandleArgs>) => {
  try {
    const tasks = await listIssues(c.env, ["task"]);
    return c.json(tasks);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
