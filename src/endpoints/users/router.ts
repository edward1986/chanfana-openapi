import { Hono } from "hono";
import { UserList } from "./userList";
import { UserCreate } from "./userCreate";
import { UserRead } from "./userRead";
import { UserUpdate } from "./userUpdate";
import { UserDelete } from "./userDelete";

export const usersRouter = new Hono();

usersRouter.get("/", UserList);
usersRouter.post("/", UserCreate);
usersRouter.get("/:id", UserRead);
usersRouter.put("/:id", UserUpdate);
usersRouter.delete("/:id", UserDelete);
