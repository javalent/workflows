import esbuild from "esbuild";
import process from "process";

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;

const prod = process.argv[2] === "production";

const dir = prod ? "./" : process.env.OUTDIR;

esbuild
    .build({
        banner: {
            js: banner
        },
        entryPoints: ["./discord-embed/src/discord-embed.ts"],
        bundle: true,
        format: "cjs",
        platform: "node",
        target: "es2020",
        logLevel: "info",
        sourcemap: prod ? false : "inline",
        minify: prod,
        treeShaking: true,
        outdir: "dist"
    })
    .catch(() => {
        process.exit(1);
    });