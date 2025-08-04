export async function uploadToGitHub(
    fileContent: string,      // must be base64!
    fileName: string,
    registrationId: string,
    env: GitHubUploadEnv
) {
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_UPLOAD_PATH } = env;
    const path = `${GITHUB_UPLOAD_PATH}/${registrationId}/${fileName}`;
    const url  = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent':    'Chanfana-App',
        'Accept':        'application/vnd.github.v3+json',
    };

    // Helper to fetch latest SHA (or undefined if new)
    async function fetchSha(): Promise<string|undefined> {
        const res = await fetch(url, { method: 'GET', headers });
        if (res.status === 404) return undefined;
        if (!res.ok) throw new Error(`GET error: ${res.status} ${res.statusText}`);
        const { sha } = await res.json();
        return sha;
    }

    // Build body with optional sha
    async function buildBody(sha?: string) {
        const payload: any = {
            message: `Upload ${fileName} for ${registrationId}`,
            content: fileContent,
        };
        if (sha) payload.sha = sha;
        return JSON.stringify(payload);
    }

    // Try upsert, retry once on 409
    let attempt = 0;
    while (true) {
        const sha = await fetchSha();
        const body = await buildBody(sha);

        const putRes = await fetch(url, {
            method: 'PUT',
            headers,
            body,
        });

        if (putRes.ok) {
            const { content } = await putRes.json();
            return {
                html_url:     content.html_url,
                download_url: content.download_url,
            };
        }

        // If we get a fresh-stale conflict, retry once
        if (putRes.status === 409 && attempt === 0) {
            attempt++;
            continue;     // loop around, fetchSha() again
        }

        // otherwise blow up
        const errText = await putRes.text();
        console.error('GitHub API error', putRes.status, putRes.statusText, errText);
        throw new Error(`Failed to upload ${fileName}: ${putRes.statusText}`);
    }
}
