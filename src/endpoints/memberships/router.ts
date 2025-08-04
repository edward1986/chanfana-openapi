import { Hono } from "hono";
import { fromHono } from "chanfana";
import { IndividualMembershipCreate } from "./individualMembershipCreate";
import { InstitutionalMembershipCreate } from "./institutionalMembershipCreate";

export const membershipsRouter = fromHono(new Hono());

membershipsRouter.post("/individual", IndividualMembershipCreate);
membershipsRouter.post("/institutional", InstitutionalMembershipCreate);
