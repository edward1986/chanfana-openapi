import { OpenAPIRoute, contentJson } from "chanfana";
import { Context } from "hono";
import { z } from "zod";
import { createIssue } from "../../lib/github-issues";
import { HandleArgs } from "../../types";

const InputSchema = z.object({
  email: z.string().email(),
  username: z.string(),
});

export class UserCreate extends OpenAPIRoute {
  schema = {
    request: {
      body: contentJson(InputSchema),
    },
  };

  async handle(c: Context<HandleArgs>) {
    const { body } = await this.getValidatedData<typeof this.schema>();

    try {
      const newUser = await createIssue(c.env, body.username, body, ["user"]);
      return c.json(newUser, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }
}
