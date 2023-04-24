"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const http_client_1 = require("@actions/http-client");
const action_1 = require("@octokit/action");
const form_data_1 = __importDefault(require("form-data"));
var Inputs;
(function (Inputs) {
    Inputs["WebhookUrls"] = "webhook-urls";
})(Inputs || (Inputs = {}));
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
async function execute() {
    const client = new http_client_1.HttpClient();
    const octokit = new action_1.Octokit();
    const urls = JSON.parse(`[${core.getInput(Inputs.WebhookUrls, { required: true })}]`).flat();
    /** get last release from github api */
    const release = await octokit.request("GET /repos/{owner}/{repo}/releases/latest", {
        owner,
        repo
    });
    const body = release.data.body_html;
    if (!body)
        core.error("No release found");
    for (const webhook of urls) {
        /*  const response = await client.postJson(webhook, payload); */
        const formData = new form_data_1.default();
        formData.append("upload-file", body);
        formData.append("payload_json", JSON.stringify({}));
        formData.submit(webhook, function (error, response) {
            if (error != null) {
                core.error(`failed to upload file: ${error.message}`);
            }
            else {
                core.info(`successfully uploaded file with status code: ${response.statusCode}`);
            }
        });
    }
}
