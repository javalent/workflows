import * as core from "@actions/core";
import { HttpClient } from "@actions/http-client";
import { Octokit } from "@octokit/action";
//@ts-ignore
import DME from "discord-markdown-embeds";

enum Inputs {
    WebhookUrls = "webhook-urls",
    Repo = "repo",
    Name = "name"
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
    const name = core.getInput(Inputs.Name) ?? repo;
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

    const body = release.data.body;
    const version = release.data.name;
    if (!body) {
        core.error("No release found");
        return;
    }

    /* for (const webhook of urls) { */
    console.log("🚀 ~ file: discord-embed.ts:44 ~ urls:", urls);
    const embeds = DME.render(body);
    for (const embed of embeds) {
        embed.title = `${name} Release - ${version}`;
        embed.timestamp = release.data.published_at;
        embed.auther = "Jeremy Valentine";
    }
    const response = await client.postJson(webhook, {
        embeds
    });

    /* } */
}

execute();
