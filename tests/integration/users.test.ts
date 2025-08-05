import { SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory store for our mock database
let users: any[] = [];
let idCounter = 1;

// Mock the github-issues library
vi.mock("../../src/lib/github-issues", () => {
  return {
    createIssue: vi.fn((env, title, data, labels) => {
      const newId = idCounter++;
      const newUser = { id: newId, ...data, labels };
      users.push(newUser);
      return Promise.resolve(newUser);
    }),
    getIssue: vi.fn((env, id) => {
      const user = users.find((u) => u.id === id);
      if (user) {
        return Promise.resolve(user);
      }
      return Promise.resolve(null);
    }),
    updateIssue: vi.fn((env, id, data) => {
      const userIndex = users.findIndex((u) => u.id === id);
      if (userIndex > -1) {
        users[userIndex] = { ...users[userIndex], ...data };
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({ success: false }); // Or throw an error
    }),
    closeIssue: vi.fn((env, id) => {
      const userIndex = users.findIndex((u) => u.id === id);
      if (userIndex > -1) {
        users.splice(userIndex, 1);
      }
      return Promise.resolve({ success: true });
    }),
    listIssues: vi.fn((env, labels) => {
      return Promise.resolve(users);
    }),
  };
});

// Helper function to create a user and return its ID
async function createUser(userData: any) {
  const response = await SELF.fetch(`http://local.test/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  const body = await response.json<any>();
  return body.id;
}

describe("User API Integration Tests", () => {
  beforeEach(() => {
    // Clear the in-memory database and reset mocks before each test
    users = [];
    idCounter = 1;
    vi.clearAllMocks();
  });

  // Tests for GET /users
  describe("GET /users", () => {
    it("should get an empty list of users", async () => {
      const response = await SELF.fetch(`http://local.test/users`);
      const body = await response.json<any[]>();

      expect(response.status).toBe(200);
      expect(body).toEqual([]);
    });

    it("should get a list with one user", async () => {
      await createUser({
        username: "testuser",
        email: "test@example.com",
      });

      const response = await SELF.fetch(`http://local.test/users`);
      const body = await response.json<any[]>();

      expect(response.status).toBe(200);
      expect(body.length).toBe(1);
      expect(body[0]).toEqual(
        expect.objectContaining({
          username: "testuser",
          email: "test@example.com",
        }),
      );
    });
  });

  // Tests for POST /users
  describe("POST /users", () => {
    it("should create a new user successfully", async () => {
      const userData = {
        username: "newuser",
        email: "new@example.com",
      };
      const response = await SELF.fetch(`http://local.test/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const body = await response.json<any>();

      expect(response.status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          ...userData,
        }),
      );
    });

    it("should return a 400 error for missing email", async () => {
      const invalidUserData = { username: "invalid" }; // Missing email
      const response = await SELF.fetch(`http://local.test/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidUserData),
      });
      const body = await response.json<any>();

      expect(response.status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it("should return a 400 error for invalid email", async () => {
      const invalidUserData = { username: "invalid", email: "invalid-email" };
      const response = await SELF.fetch(`http://local.test/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidUserData),
      });
      const body = await response.json<any>();

      expect(response.status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  // Tests for GET /users/{id}
  describe("GET /users/{id}", () => {
    it("should get a single user by its ID", async () => {
      const userData = { username: "specificuser", email: "specific@example.com" };
      const userId = await createUser(userData);

      const response = await SELF.fetch(`http://local.test/users/${userId}`);
      const body = await response.json<any>();

      expect(response.status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          id: userId,
          ...userData,
        }),
      );
    });

    it("should return a 404 error if user is not found", async () => {
      const nonExistentId = 9999;
      const response = await SELF.fetch(
        `http://local.test/users/${nonExistentId}`,
      );
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toEqual({ error: "User not found" });
    });
  });

  // Tests for PUT /users/{id}
  describe("PUT /users/{id}", () => {
    it("should update a user successfully", async () => {
      const userId = await createUser({ username: "user-to-update", email: "update@example.com" });
      const updatedData = { username: "updated-user" };

      const response = await SELF.fetch(`http://local.test/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const body = await response.json<any>();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });

      // Verify the user was updated
      const getResponse = await SELF.fetch(`http://local.test/users/${userId}`);
      const updatedUser = await getResponse.json<any>();
      expect(updatedUser.username).toBe("updated-user");
    });
  });

  // Tests for DELETE /users/{id}
  describe("DELETE /users/{id}", () => {
    it("should delete a user successfully", async () => {
      const userId = await createUser({ username: "user-to-delete", email: "delete@example.com" });

      const deleteResponse = await SELF.fetch(
        `http://local.test/users/${userId}`,
        {
          method: "DELETE",
        },
      );
      const deleteBody = await deleteResponse.json<any>();

      expect(deleteResponse.status).toBe(200);
      expect(deleteBody).toEqual({ success: true });

      // Verify the user is actually deleted
      const getResponse = await SELF.fetch(`http://local.test/users/${userId}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
