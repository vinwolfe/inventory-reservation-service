import { buildApp } from "./app.js";

const { app } = buildApp();

app
  .listen({ port: Number(process.env.PORT ?? 3000), host: "0.0.0.0" })
  .then((address) => app.log.info(`listening on ${address}`))
  .catch((error: unknown) => {
    app.log.error(error);
    process.exit(1);
  });
