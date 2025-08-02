import { Endpoint } from 'chanfana';
import { HandleArgs } from '../../types';
import { GitHubClient } from '../../github';
import { task } from './base';
import { z } from 'zod';

export class TaskRead extends Endpoint<HandleArgs> {
  _meta = {
    name: 'TaskRead',
    description: 'Get a single task',
    method: 'GET',
    path: '/tasks/:id',
    params: {
      id: z.number().int(),
    },
    responses: {
      '200': {
        description: 'A single task',
        schema: task,
      },
    },
  };

  async handle(
    { env, params }: HandleArgs,
  ): Promise<any> {
    const { id } = params;
    const client = new GitHubClient(env.GITHUB_OWNER, env.GITHUB_REPO, env.GITHUB_TOKEN);
    return await client.getIssue(id);
  }
}
