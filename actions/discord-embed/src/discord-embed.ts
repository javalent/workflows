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

async function execute() {
    const client = new HttpClient();
    const octokit = new Octokit();
    const webhook = core.getInput(Inputs.WebhookUrls, { required: true });
    const repo = core.getInput(Inputs.Repo) ?? thisRepo;
    core.info(`Running action in ${repo} repository.`);
    const name = core.getInput(Inputs.Name) ?? repo;

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

    const embeds: WebhookEmbed[] = DME.render(body);
    console.log("🚀 ~ file: discord-embed.ts:48 ~ embeds:", embeds);
    interface WebhookEmbed {
        title: string;
        timestamp: string;
        description?: string;
        fields: Embed[];
        url: string;
    }
    interface Embed {
        name: string;
        value: string;
    }
    const finalEmbed: WebhookEmbed = {
        title: `${name} Release - ${version}`,
        timestamp: release.data.published_at ?? "",
        fields: [],
        url: release.data.html_url
    };
    for (const embed of embeds) {
        if (embed.fields?.length) {
            finalEmbed.fields.push(...embed.fields);
        } else if (embed.title?.length && embed.description?.length) {
            console.log(
                "🚀 ~ file: discord-embed.ts:73 ~ embed.description:",
                embed.description.split("\n").join("\n")
            );
            finalEmbed.fields.push({
                name: embed.title,
                value: embed.description
            });
        }
    }
    console.log("🚀 ~ file: discord-embed.ts:78 ~ finalEmbed:", finalEmbed);
    await client.postJson(webhook, {
        embeds: [finalEmbed]
    });
}

execute();
