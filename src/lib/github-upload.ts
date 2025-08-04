export async function uploadToGitHub(
    fileContent: string,    // base64-encoded
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

    // Fetch latest SHA (undefined if new)
    async function fetchSha(): Promise<string|undefined> {
        const res = await fetch(url, { method: 'GET', headers });
        if (res.status === 404) return undefined;
        if (!res.ok) throw new Error(`GET error: ${res.status} ${res.statusText}`);
        return (await res.json()).sha;
    }

    const maxRetries = 2;
    let attempt = 0;

    while (attempt < maxRetries) {
        attempt++;
        const sha = await fetchSha();

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

        if (putRes.ok) {
            const content = (await putRes.json()).content;
            return {
                html_url:     content.html_url,
                download_url: content.download_url,
            };
        }

        const errJson = await putRes.json().catch(() => ({}));
        const msg    = errJson.message || '';

        // Retry on stale-SHA (409) or missing-sha (422)
        if (
            (putRes.status === 409) ||
            (putRes.status === 422 && msg.includes(`"sha" wasn't supplied`))
        ) {
            // small back-off
            await new Promise(r => setTimeout(r, 200 * attempt));
            continue;
        }

        // any other error: bail
        throw new Error(
            `GitHub API error ${putRes.status} ${putRes.statusText}\n${msg}`
        );
    }

    throw new Error(
        `Failed to upload ${fileName} after ${maxRetries} attempts due to SHA issues.`
    );
}
