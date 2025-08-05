import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { tasksRouter } from "./endpoints/tasks/router";
import { usersRouter } from "./endpoints/users/router";
import { TaskList } from "./endpoints/tasks/taskList";
import { TaskCreate } from "./endpoints/tasks/taskCreate";
import { TaskRead } from "./endpoints/tasks/taskRead";
import { TaskUpdate } from "./endpoints/tasks/taskUpdate";
import { TaskDelete } from "./endpoints/tasks/taskDelete";
import { UserList } from "./endpoints/users/userList";
import { UserCreate } from "./endpoints/users/userCreate";
import { UserRead } from "./endpoints/users/userRead";
import { UserUpdate } from "./endpoints/users/userUpdate";
import { UserDelete } from "./endpoints/users/userDelete";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { DummyEndpoint } from "./endpoints/dummyEndpoint";
import { cors } from "hono/cors";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup CORS middleware
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["*"],
    allowMethods: ["*"],
  }),
);

app.onError((err, c) => {
  if (err instanceof ApiException) {
    // If it's a Chanfana ApiException, let Chanfana handle the response
    return c.json(
      { success: false, errors: err.buildResponse() },
      err.status as ContentfulStatusCode,
    );
  }

  console.error("Global error handler caught:", err); // Log the error if it's not known

  // For other errors, return a generic 500 response
  return c.json(
    {
      success: false,
      errors: [{ code: 7000, message: "Internal Server Error" }],
    },
    500,
  );
});

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
  schema: {
    info: {
      title: "My Awesome API",
      version: "2.0.0",
      description: "This is the documentation for my awesome API.",
    },
  },
});

// Register Tasks Sub router
openapi.get("/tasks", TaskList);
openapi.post("/tasks", TaskCreate);
openapi.get("/tasks/:id", TaskRead);
openapi.put("/tasks/:id", TaskUpdate);
openapi.delete("/tasks/:id", TaskDelete);

// Register Users Sub router
openapi.get("/users", UserList);
openapi.post("/users", UserCreate);
openapi.get("/users/:id", UserRead);
openapi.put("/users/:id", UserUpdate);
openapi.delete("/users/:id", UserDelete);

// Register other endpoints
openapi.post("/dummy/:slug", DummyEndpoint);

// Export the Hono app
export default app;
