export interface GitHubUploadEnv {
    GITHUB_TOKEN: string;
    GITHUB_OWNER: string;
    GITHUB_REPO: string;
    GITHUB_UPLOAD_PATH: string;
}

export async function uploadToGitHub(
    fileContent: string,
    fileName: string,
    registrationId: string,
    env: GitHubUploadEnv
) {
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_UPLOAD_PATH } = env;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !GITHUB_UPLOAD_PATH) {
        throw new Error("Missing GitHub configuration in environment variables.");
    }
    const timestamp = Date.now();
    const path = `${GITHUB_UPLOAD_PATH}/${registrationId}/${timestamp}-${fileName}`;
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'User-Agent': 'Chanfana-App',
            'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
            message: `Upload ${fileName} for ${registrationId}`,
            content: fileContent,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`GitHub API error: ${response.status} ${response.statusText}`, errorBody, GITHUB_TOKEN);
        throw new Error(`Failed to upload file to GitHub: ${fileName}`);
    }

    const data = await response.json();
    return {
        html_url: data.content.html_url,
        download_url: data.content.download_url,
    };
}
