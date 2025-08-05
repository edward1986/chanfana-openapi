import { OpenAPIRoute } from "chanfana";
import { Context } from "hono";
import { closeIssue } from "../../lib/github-issues";
import { paramsSchema } from "../../lib/schemas";
import { HandleArgs } from "../../types";

export class TaskDelete extends OpenAPIRoute {
  schema = {
    params: paramsSchema,
  };

  async handle(c: Context<HandleArgs>) {
    const { params } = await this.getValidatedData<typeof this.schema>();

    try {
      await closeIssue(c.env, parseInt(params.id, 10));
      return c.json({ success: true });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }
}
