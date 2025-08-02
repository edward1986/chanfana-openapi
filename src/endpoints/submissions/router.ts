import { Hono } from "hono";
import { fromHono } from "chanfana";
import { SubmissionCreate } from "./submissionCreate";

export const submissionsRouter = fromHono(new Hono());

submissionsRouter.post("/", SubmissionCreate);
