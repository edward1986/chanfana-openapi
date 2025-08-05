import { OpenAPIRoute, contentJson } from "chanfana";
import { Context } from "hono";
import { createIssue } from "../../lib/github-issues";
import { taskSchema } from "../../lib/schemas";
import { HandleArgs } from "../../types";

export class TaskCreate extends OpenAPIRoute {
  schema = {
    request: {
      body: contentJson(taskSchema),
    },
  };

  async handle(c: Context<HandleArgs>) {
    const { body } = await this.getValidatedData<typeof this.schema>();

    try {
      const newTask = await createIssue(c.env, body.name, body, ["task"]);
      return c.json(newTask, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }
}
