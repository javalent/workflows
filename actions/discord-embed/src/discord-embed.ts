import * as core from "@actions/core";
import { HttpClient } from "@actions/http-client";
import { Octokit } from "@octokit/action";
//@ts-ignore
import DME from "discord-markdown-embeds";
import { EmbedBuilder } from "discord.js";

enum Inputs {
    WebhookUrls = "webhook-urls",
    Repo = "repo",
    Name = "name",
    Beta = "beta"
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
    let repo = core.getInput(Inputs.Repo);
    if (!repo || repo?.length) {
        repo = thisRepo;
    }
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
    const exampleEmbed = new EmbedBuilder()
        .setTitle(`${name} Release - ${version}`)
        .setTimestamp(new Date(release.data.published_at ?? ""))
        .setURL(release.data.html_url);

    for (const embed of embeds) {
        if (embed.fields?.length) {
            exampleEmbed.addFields(...embed.fields);
        } else if (embed.title?.length && embed.description?.length) {
            try {
                let desc: string[] = [];
                const split = embed.description.split("\n");
                let added = false;
                while (split.length) {
                    const next = split.shift();
                    if (!next) break;
                    if (desc.join("\n").length + next.length > 1024) {
                        exampleEmbed.addFields({
                            name: `${embed.title}${added ? " (cont.)" : ""}`,
                            value: desc.join("\n")
                        });
                        desc = [];
                    }
                    desc.push(next);
                }
            } catch (e) {
                console.error(e);
                return;
            }
        }
    }
    exampleEmbed.addFields({
        name: "Documentation",
        value: "See more at [plugins.javalent.com](https://plugins.javalent.com)"
    });
    if (core.getInput(Inputs.Beta)) {
        exampleEmbed.addFields({
            name: "Beta release",
            value: "This is a beta release and can be installed using the [BRAT plugin](https://obsidian.md/plugins?id=BRAT)."
        });
    }
    await client.postJson(webhook, {
        embeds: [exampleEmbed.toJSON()],
        avatar_url:
            "https://avatars.githubusercontent.com/u/131289534?s=400&u=e2a0a05141177af90d007953d116934d3b434385&v=4"
    });
}

execute();
