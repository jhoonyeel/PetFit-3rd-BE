import { createApp } from "./app";
import { PORT } from "./config/env";

const app = createApp();

app.listen(PORT, () => {
  console.log(
    `[petfit-server] listening on :${PORT} (NODE_ENV=${
      process.env.NODE_ENV ?? "undefined"
    })`
  );
});
