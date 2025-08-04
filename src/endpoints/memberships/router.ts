import { Hono } from "hono";
import { fromHono } from "chanfana";
import { IndividualMembershipCreate } from "./individualMembershipCreate";

export const membershipsRouter = fromHono(new Hono());

membershipsRouter.post("/individual", IndividualMembershipCreate);
