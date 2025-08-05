import { SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory store for our mock database
let tasks: any[] = [];
let idCounter = 1;

// Mock the github-issues library
vi.mock("../../src/lib/github-issues", () => {
  return {
    createIssue: vi.fn((env, title, data, labels) => {
      const newId = idCounter++;
      const newTask = { id: newId, ...data, labels };
      tasks.push(newTask);
      return Promise.resolve(newTask);
    }),
    getIssue: vi.fn((env, id) => {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        return Promise.resolve(task);
      }
      return Promise.resolve(null);
    }),
    updateIssue: vi.fn((env, id, data) => {
      const taskIndex = tasks.findIndex((t) => t.id === id);
      if (taskIndex > -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...data };
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({ success: false }); // Or throw an error
    }),
    closeIssue: vi.fn((env, id) => {
      const taskIndex = tasks.findIndex((t) => t.id === id);
      if (taskIndex > -1) {
        tasks.splice(taskIndex, 1);
      }
      return Promise.resolve({ success: true });
    }),
    listIssues: vi.fn((env, labels) => {
      // In a real scenario, you'd filter by labels.
      // For this test, we'll just return all tasks.
      return Promise.resolve(tasks);
    }),
  };
});

// Helper function to create a task and return its ID
async function createTask(taskData: any) {
  const response = await SELF.fetch(`http://local.test/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData),
  });
  const body = await response.json<any>();
  return body.id;
}

describe("Task API Integration Tests", () => {
  beforeEach(() => {
    // Clear the in-memory database and reset mocks before each test
    tasks = [];
    idCounter = 1;
    vi.clearAllMocks();
  });

  // Tests for GET /tasks
  describe("GET /tasks", () => {
    it("should get an empty list of tasks", async () => {
      const response = await SELF.fetch(`http://local.test/tasks`);
      const body = await response.json<any[]>();

      expect(response.status).toBe(200);
      expect(body).toEqual([]);
    });

    it("should get a list with one task", async () => {
      await createTask({
        name: "Test Task",
        slug: "test-task",
      });

      const response = await SELF.fetch(`http://local.test/tasks`);
      const body = await response.json<any[]>();

      expect(response.status).toBe(200);
      expect(body.length).toBe(1);
      expect(body[0]).toEqual(
        expect.objectContaining({
          name: "Test Task",
          slug: "test-task",
        }),
      );
    });
  });

  // Tests for POST /tasks
  describe("POST /tasks", () => {
    it("should create a new task successfully", async () => {
      const taskData = {
        name: "New Task",
        slug: "new-task",
      };
      const response = await SELF.fetch(`http://local.test/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      const body = await response.json<any>();

      expect(response.status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          ...taskData,
        }),
      );
    });

    it("should return a 400 error for invalid input", async () => {
      const invalidTaskData = { slug: "invalid" }; // Missing name
      const response = await SELF.fetch(`http://local.test/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidTaskData),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({ error: "Missing required fields" });
    });
  });

  // Tests for GET /tasks/{id}
  describe("GET /tasks/{id}", () => {
    it("should get a single task by its ID", async () => {
      const taskData = { name: "Specific Task", slug: "specific-task" };
      const taskId = await createTask(taskData);

      const response = await SELF.fetch(`http://local.test/tasks/${taskId}`);
      const body = await response.json<any>();

      expect(response.status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          id: taskId,
          ...taskData,
        }),
      );
    });

    it("should return a 404 error if task is not found", async () => {
      const nonExistentId = 9999;
      const response = await SELF.fetch(
        `http://local.test/tasks/${nonExistentId}`,
      );
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toEqual({ error: "Task not found" });
    });
  });

  // Tests for PUT /tasks/{id}
  describe("PUT /tasks/{id}", () => {
    it("should update a task successfully", async () => {
      const taskId = await createTask({ name: "Task to Update", slug: "task-to-update" });
      const updatedData = { name: "Updated Task", completed: true };

      const response = await SELF.fetch(`http://local.test/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const body = await response.json<any>();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });

      // Verify the task was updated
      const getResponse = await SELF.fetch(`http://local.test/tasks/${taskId}`);
      const updatedTask = await getResponse.json<any>();
      expect(updatedTask.name).toBe("Updated Task");
      expect(updatedTask.completed).toBe(true);
    });
  });

  // Tests for DELETE /tasks/{id}
  describe("DELETE /tasks/{id}", () => {
    it("should delete a task successfully", async () => {
      const taskId = await createTask({ name: "Task to Delete", slug: "task-to-delete" });

      const deleteResponse = await SELF.fetch(
        `http://local.test/tasks/${taskId}`,
        {
          method: "DELETE",
        },
      );
      const deleteBody = await deleteResponse.json<any>();

      expect(deleteResponse.status).toBe(200);
      expect(deleteBody).toEqual({ success: true });

      // Verify the task is actually deleted
      const getResponse = await SELF.fetch(`http://local.test/tasks/${taskId}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
