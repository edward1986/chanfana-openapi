export async function uploadToGitHub(
    fileContent: string,      // must be base64!
    fileName: string,
    registrationId: string,
    env: GitHubUploadEnv
) {
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_UPLOAD_PATH } = env;
    // use a stable path if you intend to update existing
    const path = `${GITHUB_UPLOAD_PATH}/${registrationId}/${fileName}`;
    const url  = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent':    'Chanfana-App',
        'Accept':        'application/vnd.github.v3+json',
    };

    // 1) Fetch existing file to get its SHA (if any)
    let sha: string|undefined;
    const getRes = await fetch(url, { method: 'GET', headers });
    if (getRes.ok) {
        const { sha: existingSha } = await getRes.json();
        sha = existingSha;
    } else if (getRes.status !== 404) {
        throw new Error(`Error checking file existence: ${getRes.status} ${getRes.statusText}`);
    }

    // 2) Build the upsert payload
    const body: any = {
        message: `Upload ${fileName} for ${registrationId}`,
        content: fileContent,  // remember: this must be base64-encoded!
        ...(sha && { sha }),    // include sha only if the file existed
    };

    // 3) PUT it
    const putRes = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
    });

    if (!putRes.ok) {
        const errText = await putRes.text();
        console.error('GitHub API error', putRes.status, putRes.statusText, errText);
        throw new Error(`Failed to upload ${fileName}: ${putRes.statusText}`);
    }

    const { content } = await putRes.json();
    return {
        html_url:     content.html_url,
        download_url: content.download_url,
    };
}
