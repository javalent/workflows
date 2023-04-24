import * as core from "@actions/core";
import { HttpClient } from "@actions/http-client";
import { Octokit } from "@octokit/action";
import FormData from "form-data";
import { createReadStream } from "fs";
import { writeFile } from "fs/promises";

enum Inputs {
    WebhookUrls = "webhook-urls",
    Repo = "repo"
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

const [owner, thisRepo] = process.env.GITHUB_REPOSITORY.split("/");
console.log(
    "🚀 ~ file: discord-embed.ts:25 ~ owner, thisRepo:",
    owner,
    thisRepo
);

async function execute() {
    const client = new HttpClient();
    const octokit = new Octokit();
    const webhook = core.getInput(Inputs.WebhookUrls, { required: true });
    console.log("🚀 ~ file: discord-embed.ts:28 ~ webhooks:", webhook);
    const repo = core.getInput(Inputs.Repo) ?? thisRepo;
    console.log("🚀 ~ file: discord-embed.ts:36 ~ repo:", repo);
    const urls = JSON.parse(`[]`).flat() as string[];

    /** get last release from github api */
    const release = await octokit.request(
        "GET /repos/{owner}/{repo}/releases/latest",
        {
            owner,
            repo
        }
    );
    console.log("🚀 ~ file: discord-embed.ts:49 ~ release:", release);

    const body = release.data.body_html;
    console.log("🚀 ~ file: discord-embed.ts:41 ~ body:", body);
    if (!body) {
        core.error("No release found");
        return;
    }
    await writeFile("./body.html", body);

    /* for (const webhook of urls) { */
    console.log("🚀 ~ file: discord-embed.ts:44 ~ urls:", urls);
    /*  const response = await client.postJson(webhook, payload); */
    const formData = new FormData();
    formData.append("upload-file", createReadStream("./body.html"));
    formData.submit(webhook, function (error, response) {
        if (error != null) {
            core.error(`failed to upload file: ${error.message}`);
        } else {
            core.info(
                `successfully uploaded file with status code: ${response.statusCode}`
            );
        }
    });
    /* } */
}

execute();
