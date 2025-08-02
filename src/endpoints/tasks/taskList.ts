import { Endpoint } from 'chanfana';
import { HandleArgs } from '../../types';
import { GitHubClient } from '../../github';
import { task } from './base';

export class TaskList extends Endpoint<HandleArgs> {
  _meta = {
    name: 'TaskList',
    description: 'Returns a list of tasks',
    method: 'GET',
    path: '/tasks',
    responses: {
      '200': {
        description: 'A list of tasks',
        schema: {
          type: 'array',
          items: task,
        },
      },
    },
  };

  async handle(
    { env }: HandleArgs,
  ): Promise<any[]> {
    const client = new GitHubClient(env.GITHUB_OWNER, env.GITHUB_REPO, env.GITHUB_TOKEN);
    return await client.listIssues();
  }
}
