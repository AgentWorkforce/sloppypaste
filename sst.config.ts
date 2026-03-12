/// <reference path="./.sst/platform/config.d.ts" />

const POSTHOG_KEY = "phc_HBpkWXf1mDw6sMF4fyw92WfZSSAIZIAAM57UEsic9dV";
const POSTHOG_HOST = "https://i.agentrelay.dev";

export default $config({
  app(input) {
    return {
      name: "sloppypaste",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "cloudflare",
    };
  },
  async run() {
    const site = new sst.cloudflare.Worker("Site", {
      handler: "src/worker.ts",
      assets: {
        directory: "public",
      },
      environment: {
        POSTHOG_KEY: POSTHOG_KEY,
        POSTHOG_HOST: POSTHOG_HOST,
      },
      domain: $app.stage === "production" ? "sloppypaste.com" : undefined,
      url: true,
    });

    return {
      url: site.url,
    };
  },
});
