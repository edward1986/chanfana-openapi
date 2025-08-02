import { Endpoint } from 'chanfana';
import { HandleArgs } from '../../types';
import { GitHubClient } from '../../github';
import { task } from './base';

export class TaskCreate extends Endpoint<HandleArgs> {
  _meta = {
    name: 'TaskCreate',
    description: 'Create a new task',
    method: 'POST',
    path: '/tasks',
    request: {
      body: {
        content: {
          'application/json': {
            schema: task,
          },
        },
      },
    },
    responses: {
      '201': {
        description: 'The created task',
        schema: task,
      },
    },
  };

  async handle(
    { env, body }: HandleArgs,
  ): Promise<any> {
    const client = new GitHubClient(env.GITHUB_OWNER, env.GITHUB_REPO, env.GITHUB_TOKEN);
    return await client.createIssue(body);
  }
}
