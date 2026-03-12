/// <reference path="./.sst/platform/config.d.ts" />

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
      domain: $app.stage === "production" ? "sloppypaste.com" : undefined,
      url: true,
    });

    return {
      url: site.url,
    };
  },
});
