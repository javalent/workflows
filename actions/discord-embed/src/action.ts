import * as core from "@actions/core";
import { HttpClient } from "@actions/http-client";
import { Octokit } from "@octokit/action";
import FormData from "form-data";

enum Inputs {
    WebhookUrls = "webhook-urls"
}

interface InputTypes {
    [Inputs.WebhookUrls]: string;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            GITHUB_REPOSITORY: string;
        }
    }
}

const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

async function execute() {
    const client = new HttpClient();
    const octokit = new Octokit();
    const urls = JSON.parse(
        `[${core.getInput(Inputs.WebhookUrls, { required: true })}]`
    ).flat();

    /** get last release from github api */
    const release = await octokit.request(
        "GET /repos/{owner}/{repo}/releases/latest",
        {
            owner,
            repo
        }
    );

    const body = release.data.body_html;
    if (!body) core.error("No release found");

    for (const webhook of urls) {
        /*  const response = await client.postJson(webhook, payload); */
        const formData = new FormData();
        formData.append("upload-file", body);
        formData.append("payload_json", JSON.stringify({}));
        formData.submit(webhook, function (error, response) {
            if (error != null) {
                core.error(`failed to upload file: ${error.message}`);
            } else {
                core.info(
                    `successfully uploaded file with status code: ${response.statusCode}`
                );
            }
        });
    }
}
