import { Endpoint } from 'chanfana';
import { HandleArgs } from '../../types';
import { GitHubClient } from '../../github';
import { task } from './base';
import { z } from 'zod';

export class TaskUpdate extends Endpoint<HandleArgs> {
  _meta = {
    name: 'TaskUpdate',
    description: 'Update a task',
    method: 'PATCH',
    path: '/tasks/:id',
    params: {
      id: z.number().int(),
    },
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
      '200': {
        description: 'The updated task',
        schema: task,
      },
    },
  };

  async handle(
    { env, params, body }: HandleArgs,
  ): Promise<any> {
    const { id } = params;
    const client = new GitHubClient(env.GITHUB_OWNER, env.GITHUB_REPO, env.GITHUB_TOKEN);
    return await client.updateIssue(id, body);
  }
}
