import * as core from "@actions/core";
import { HttpClient } from "@actions/http-client";
import { Octokit } from "@octokit/action";
//@ts-ignore
import DME from "discord-markdown-embeds";
import { EmbedBuilder } from "discord.js";

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
    const exampleEmbed = new EmbedBuilder()
        .setTitle(`${name} Release - ${version}`)
        .setTimestamp(new Date(release.data.published_at ?? ""))
        .setURL(release.data.html_url);

    for (const embed of embeds) {
        if (embed.fields?.length) {
            exampleEmbed.addFields(...embed.fields);
        } else if (embed.title?.length && embed.description?.length) {
            console.log(embed.description.split("\n").join(" "));
            try {
                exampleEmbed.addFields({
                    name: embed.title,
                    value: "• can disable encounter builder ribbon icon ([d6d2bee](https://github.com/javalent/initiative-tracker/commit/d6d2bee38d423ac1512ec81b5704f3a540839b17)) • can now open combatant view for creatures in encounter builder ([d6d2bee](https://github.com/javalent/initiative-tracker/commit/d6d2bee38d423ac1512ec81b5704f3a540839b17)) • creatures in table display difficulty ([921034a](https://github.com/javalent/initiative-tracker/commit/921034a695a04312ffa09768329e9fdc791b8e04)) • encounter builder name is editable ([d6d2bee](https://github.com/javalent/initiative-tracker/commit/d6d2bee38d423ac1512ec81b5704f3a540839b17)) • launching encounter from builder works again ([d6d2bee](https://github.com/javalent/initiative-tracker/commit/d6d2bee38d423ac1512ec81b5704f3a540839b17)) • new encounter builder ribbon icon ([d6d2bee](https://github.com/javalent/initiative-tracker/commit/d6d2bee38d423ac1512ec81b5704f3a540839b17)) • player & xp sections of builder are collapsible ([8505873](https://github.com/javalent/initiative-tracker/commit/85058739e04b9947fe08dc93e732bf3095dbf5b1))"
                });
            } catch (e) {
                console.error(e);
                return;
            }
        }
        console.log(
            "🚀 ~ file: discord-embed.ts:78 ~ finalEmbed:",
            embed,
            exampleEmbed.data.fields
        );
    }
    await client.postJson(webhook, {
        embeds: [exampleEmbed.toJSON()]
    });
}

execute();
