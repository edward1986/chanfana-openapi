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

    // helper: get the latest SHA, or undefined if the file doesn't exist
    async function fetchSha(): Promise<string|undefined> {
        const res = await fetch(url, { method: 'GET', headers });
        if (res.status === 404) return undefined;
        if (!res.ok) throw new Error(`GET error: ${res.status} ${res.statusText}`);
        const json = await res.json();
        return json.sha;
    }

    const maxRetries = 3;
    let attempt = 0;
    let lastErrText = '';

    while (attempt < maxRetries) {
        attempt++;
        // 1) grab fresh SHA
        const sha = await fetchSha();

        // 2) build your payload
        const payload: any = {
            message: `Upload ${fileName} for ${registrationId}`,
            content: fileContent,
            ...(sha && { sha }),    // only include sha if updating
        };

        // 3) attempt the PUT
        const putRes = await fetch(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload),
        });

        if (putRes.ok) {
            const { content } = await putRes.json();
            return {
                html_url:     content.html_url,
                download_url: content.download_url,
            };
        }

        lastErrText = await putRes.text();

        // on a 409, retry after a short back-off
        if (putRes.status === 409) {
            await new Promise(r => setTimeout(r, 300 * attempt));
            continue;
        }

        // any other error: bail out
        throw new Error(
            `Failed to upload ${fileName}: ${putRes.status} ${putRes.statusText}\n${lastErrText}`
        );
    }

    // if we exhausted retries
    console.error(`uploadToGitHub: max retries hit`, lastErrText);
    throw new Error(
        `Failed to upload ${fileName} after ${maxRetries} attempts due to SHA conflicts.`
    );
}
