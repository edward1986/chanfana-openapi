import { Env } from "../../types";

const getGitHubApiUrl = (env: Env["Bindings"], path: string = "") => {
  return `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/issues${path}`;
};

const getGitHubApiHeaders = (env: Env["Bindings"]) => {
  return {
    "Authorization": `token ${env.GITHUB_TOKEN}`,
    "User-Agent": "task-manager-app",
    "Accept": "application/vnd.github.v3+json",
  };
};

export const createIssue = async (env: Env["Bindings"], title: string, body: object, labels: string[] = ["task"]) => {
  const url = getGitHubApiUrl(env);
  const headers = getGitHubApiHeaders(env);
  const issueBody = {
    title,
    body: JSON.stringify(body, null, 2),
    labels,
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(issueBody),
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const getIssue = async (env: Env["Bindings"], issueNumber: number) => {
  const url = getGitHubApiUrl(env, `/${issueNumber}`);
  const headers = getGitHubApiHeaders(env);

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const issue = await response.json();
  return {
    id: issue.number,
    ...JSON.parse(issue.body),
  };
};

export const updateIssue = async (env: Env["Bindings"], issueNumber: number, body: object) => {
  const url = getGitHubApiUrl(env, `/${issueNumber}`);
  const headers = getGitHubApiHeaders(env);
  const issueBody = {
    body: JSON.stringify(body, null, 2),
  };

  const response = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(issueBody),
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const closeIssue = async (env: Env["Bindings"], issueNumber: number) => {
  const url = getGitHubApiUrl(env, `/${issueNumber}`);
  const headers = getGitHubApiHeaders(env);
  const issueBody = {
    state: "closed",
  };

  const response = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(issueBody),
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const listIssues = async (env: Env["Bindings"], labels: string[] = ["task"]) => {
  const labelQuery = labels.join(",");
  const url = getGitHubApiUrl(env, `?labels=${labelQuery}&state=open`);
  const headers = getGitHubApiHeaders(env);

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const issues = await response.json();
  return issues.map((issue: any) => ({
    id: issue.number,
    ...JSON.parse(issue.body),
  }));
};
