import { z } from 'zod';
import { task } from './endpoints/tasks/base';

const GITHUB_API_URL = 'https://api.github.com';

const issueSchema = z.object({
  id: z.number().int(),
  number: z.number().int(),
  title: z.string(),
  body: z.string().nullable(),
  state: z.enum(['open', 'closed']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type GitHubIssue = z.infer<typeof issueSchema>;

export class GitHubClient {
  private apiUrl: string;
  private token: string;

  constructor(owner: string, repo: string, token: string) {
    this.apiUrl = `${GITHUB_API_URL}/repos/${owner}/${repo}/issues`;
    this.token = token;
  }

  private async request(path: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      'Authorization': `token ${this.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Cloudflare-Worker',
    };

    return fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
  }

  async listIssues(): Promise<any[]> {
    const response = await this.request('');
    if (!response.ok) {
      throw new Error(`Failed to list issues: ${response.statusText}`);
    }
    const issues = await response.json();
    const parsedIssues = z.array(issueSchema).parse(issues);

    return parsedIssues.map(issue => {
        const taskData = JSON.parse(issue.body || '{}');
        return {
            id: issue.number,
            ...taskData,
            completed: issue.state === 'closed',
        }
    });
  }

  async createIssue(taskData: any): Promise<any> {
    const response = await this.request('', {
      method: 'POST',
      body: JSON.stringify({ title: taskData.name, body: JSON.stringify(taskData) }),
    });
    if (!response.ok) {
      throw new Error(`Failed to create issue: ${response.statusText}`);
    }
    const issue = await response.json();
    const parsedIssue = issueSchema.parse(issue);
    const newTaskData = JSON.parse(parsedIssue.body || '{}');
    return {
        id: parsedIssue.number,
        ...newTaskData,
        completed: parsedIssue.state === 'closed',
    }
  }

  async getIssue(issueNumber: number): Promise<any> {
    const response = await this.request(`/${issueNumber}`);
    if (!response.ok) {
      throw new Error(`Failed to get issue: ${response.statusText}`);
    }
    const issue = await response.json();
    const parsedIssue = issueSchema.parse(issue);
    const taskData = JSON.parse(parsedIssue.body || '{}');
    return {
        id: parsedIssue.number,
        ...taskData,
        completed: parsedIssue.state === 'closed',
    }
  }

  async updateIssue(issueNumber: number, taskData: any): Promise<any> {
    const response = await this.request(`/${issueNumber}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: taskData.name, body: JSON.stringify(taskData), state: taskData.completed ? 'closed' : 'open' }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update issue: ${response.statusText}`);
    }
    const issue = await response.json();
    const parsedIssue = issueSchema.parse(issue);
    const newTaskData = JSON.parse(parsedIssue.body || '{}');
    return {
        id: parsedIssue.number,
        ...newTaskData,
        completed: parsedIssue.state === 'closed',
    }
  }

  async closeIssue(issueNumber: number): Promise<void> {
    const issue = await this.getIssue(issueNumber);
    await this.updateIssue(issueNumber, {...issue, completed: true});
  }
}
