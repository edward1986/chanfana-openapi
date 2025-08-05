import { Context } from "hono";
import { getIssue } from "../../lib/github-issues";
import { HandleArgs } from "../../types";

export const UserRead = async (c: Context<HandleArgs>) => {
  const id = c.req.param("id");

  try {
    const user = await getIssue(c.env, parseInt(id, 10));

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(user);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};
