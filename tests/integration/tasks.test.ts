import { SELF } from 'cloudflare:test';
import { describe, expect, it, vi } from 'vitest';
import { GitHubClient } from '../../src/github';

// Mock the GitHubClient
vi.mock('../../src/github', () => {
  const GitHubClient = vi.fn();
  GitHubClient.prototype.listIssues = vi.fn();
  GitHubClient.prototype.createIssue = vi.fn();
  GitHubClient.prototype.getIssue = vi.fn();
  GitHubClient.prototype.updateIssue = vi.fn();
  GitHubClient.prototype.closeIssue = vi.fn();
  return { GitHubClient };
});

const mockTask = {
  id: 1,
  name: 'Test Task',
  slug: 'test-task',
  description: 'A task for testing',
  completed: false,
  due_date: '2025-01-01T00:00:00.000Z',
};

describe('Task API Integration Tests', () => {
  // Tests for GET /tasks
  describe('GET /tasks', () => {
    it('should get an empty list of tasks', async () => {
      const gitHubClientMock = new GitHubClient('', '', '');
      gitHubClientMock.listIssues.mockResolvedValue([]);

      const response = await SELF.fetch(`http://local.test/tasks`);
      const body = await response.json<any[]>();

      expect(response.status).toBe(200);
      expect(body).toEqual([]);
    });

    it('should get a list with one task', async () => {
      const gitHubClientMock = new GitHubClient('', '', '');
      gitHubClientMock.listIssues.mockResolvedValue([mockTask]);

      const response = await SELF.fetch(`http://local.test/tasks`);
      const body = await response.json<any[]>();

      expect(response.status).toBe(200);
      expect(body.length).toBe(1);
      expect(body[0]).toEqual(mockTask);
    });
  });

  // Tests for POST /tasks
  describe('POST /tasks', () => {
    it('should create a new task successfully', async () => {
      const gitHubClientMock = new GitHubClient('', '', '');
      gitHubClientMock.createIssue.mockResolvedValue(mockTask);

      const response = await SELF.fetch(`http://local.test/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockTask),
      });

      const body = await response.json<any>();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockTask);
    });
  });

  // Tests for GET /tasks/{id}
  describe('GET /tasks/{id}', () => {
    it('should get a single task by its ID', async () => {
      const gitHubClientMock = new GitHubClient('', '', '');
      gitHubClientMock.getIssue.mockResolvedValue(mockTask);

      const response = await SELF.fetch(`http://local.test/tasks/1`);
      const body = await response.json<any>();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockTask);
    });
  });

  // Tests for PATCH /tasks/{id}
  describe('PATCH /tasks/{id}', () => {
    it('should update a task successfully', async () => {
        const updatedTask = {...mockTask, name: "updated name"};
      const gitHubClientMock = new GitHubClient('', '', '');
      gitHubClientMock.updateIssue.mockResolvedValue(updatedTask);

      const response = await SELF.fetch(`http://local.test/tasks/1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      });
      const body = await response.json<any>();

      expect(response.status).toBe(200);
      expect(body).toEqual(updatedTask);
    });
  });

  // Tests for DELETE /tasks/{id}
  describe('DELETE /tasks/{id}', () => {
    it('should delete a task successfully', async () => {
      const gitHubClientMock = new GitHubClient('', '', '');
      gitHubClientMock.closeIssue.mockResolvedValue(undefined);

      const response = await SELF.fetch(`http://local.test/tasks/1`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(204);
    });
  });
});
