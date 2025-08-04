export async function uploadToGitHub(
    fileContent: string,    // must be base64-encoded
    fileName: string,
    registrationId: string,
    env: GitHubUploadEnv
) {
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_UPLOAD_PATH } = env;
    const path        = `${GITHUB_UPLOAD_PATH}/${registrationId}/${fileName}`;
    const encodedPath = encodeURIComponent(path);
    const url         = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}`;
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent':    'Chanfana-App',
        'Accept':        'application/vnd.github.v3+json',
    };

    async function fetchSha(): Promise<string|undefined> {
        const res = await fetch(url, { method: 'GET', headers });
        if (res.status === 404) return undefined;
        if (!res.ok) throw new Error(`GET error: ${res.status} ${res.statusText}`);
        const json = await res.json();
        return json.sha;
    }

    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const sha = await fetchSha();
        console.debug(`uploadToGitHub: attempt ${attempt}, fetched sha = ${sha}`);

        const payload: any = {
            message: `Upload ${fileName} for ${registrationId}`,
            content: fileContent,
            ...(sha && { sha }),
        };

        const putRes = await fetch(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload),
        });

            return {
                download_url: `https://github.com/pacuitinfo/pacuit/blob/main/${path}` ,
            };
        const errJson = await putRes.json().catch(() => ({}));
        console.error(`uploadToGitHub: attempt ${attempt} failed`, errJson);

        // on stale-SHA (409) or missing-SHA (422), retry
        if ((putRes.status === 409) ||
            (putRes.status === 422 && errJson.message?.includes(`"sha" wasn't supplied`))) {
            // small back-off
            await new Promise(r => setTimeout(r, 200 * attempt));
            continue;
        }

        // any other error, bail immediately
        throw new Error(`GitHub API error ${putRes.status}: ${errJson.message || putRes.statusText}`);
    }

    throw new Error(
        `uploadToGitHub: failed after ${maxRetries} attempts due to SHA conflicts.`
    );
}
