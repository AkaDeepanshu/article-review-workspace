// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "articledesk",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: { region: "us-east-1", profile: "default" },
      },
    };
  },
  async run() {

    const authSecret = new sst.Secret("AuthSecret");
    const databaseUrl = new sst.Secret("DatabaseUrl");
    const directUrl = new sst.Secret("DirectUrl");
    const nodeEnv = new sst.Secret("NodeEnv");

    const web = new sst.aws.Nextjs("ArticleDesk", {
      environment: {
        AUTH_SECRET: authSecret.value,
        DATABASE_URL: databaseUrl.value,
        DIRECT_URL: directUrl.value,
        NODE_ENV: nodeEnv.value,
      },
      server: {
        timeout: "30 seconds",
        memory: "512 MB",
      },
    });

    return {
      url: web.url,
    };
  },
});
