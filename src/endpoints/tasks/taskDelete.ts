import { Endpoint } from 'chanfana';
import { HandleArgs } from '../../types';
import { GitHubClient } from '../../github';
import { z } from 'zod';

export class TaskDelete extends Endpoint<HandleArgs> {
  _meta = {
    name: 'TaskDelete',
    description: 'Delete a task',
    method: 'DELETE',
    path: '/tasks/:id',
    params: {
      id: z.number().int(),
    },
    responses: {
      '204': {
        description: 'Task deleted successfully',
      },
    },
  };

  async handle(
    { env, params }: HandleArgs,
  ): Promise<void> {
    const { id } = params;
    const client = new GitHubClient(env.GITHUB_OWNER, env.GITHUB_REPO, env.GITHUB_TOKEN);
    await client.closeIssue(id);
  }
}
