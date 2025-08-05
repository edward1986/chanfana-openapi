import { OpenAPIRoute, contentJson } from "chanfana";
import { Context } from "hono";
import { z } from "zod";
import { slugSchema } from "../lib/schemas";
import { HandleArgs } from "../types";

// The dummy endpoint can receive any JSON data, so we use z.any()
const anySchema = z.any();

export class DummyEndpoint extends OpenAPIRoute {
  schema = {
    params: slugSchema,
    request: {
      body: contentJson(anySchema),
    },
  };

  async handle(c: Context<HandleArgs>) {
    const { params, body } = await this.getValidatedData<typeof this.schema>();

    return c.json({
      "slug": params.slug,
      "body": body,
    });
  }
}
