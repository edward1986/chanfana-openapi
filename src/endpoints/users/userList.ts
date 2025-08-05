import { Context } from "hono";
import { listIssues } from "../../lib/github-issues";
import { HandleArgs } from "../../types";

export const UserList = async (c: Context<HandleArgs>) => {
  try {
    const users = await listIssues(c.env, ["user"]);
    return c.json(users);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
