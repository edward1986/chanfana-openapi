import { OpenAPIRoute } from "chanfana";
import { Context } from "hono";
import { getIssue } from "../../lib/github-issues";
import { paramsSchema } from "../../lib/schemas";
import { HandleArgs } from "../../types";

export class TaskRead extends OpenAPIRoute {
  schema = {
    params: paramsSchema,
  };

  async handle(c: Context<HandleArgs>) {
    const { params } = await this.getValidatedData<typeof this.schema>();

    try {
      const task = await getIssue(c.env, parseInt(params.id, 10));
      return c.json(task);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }
}
