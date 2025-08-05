import { OpenAPIRoute, contentJson } from "chanfana";
import { Context } from "hono";
import { updateIssue } from "../../lib/github-issues";
import { paramsSchema, userUpdateSchema } from "../../lib/schemas";
import { HandleArgs } from "../../types";

export class UserUpdate extends OpenAPIRoute {
  schema = {
    params: paramsSchema,
    request: {
      body: contentJson(userUpdateSchema),
    },
  };

  async handle(c: Context<HandleArgs>) {
    const { params, body } = await this.getValidatedData<typeof this.schema>();

    try {
      await updateIssue(c.env, parseInt(params.id, 10), body);
      return c.json({ success: true });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }
}
