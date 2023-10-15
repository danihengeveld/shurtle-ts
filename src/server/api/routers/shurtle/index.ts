import { createTRPCRouter } from "../../trpc";
import { createShurtleRouter } from "./create";
import { deleteShurtleRouter } from "./delete";
import { getShurtleRouter } from "./get";

export const shurtleRouter = createTRPCRouter({
  create: createShurtleRouter,
  get: getShurtleRouter,
  delete: deleteShurtleRouter,
});
