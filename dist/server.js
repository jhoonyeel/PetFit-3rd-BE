"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const app = (0, app_1.createApp)();
app.listen(env_1.PORT, () => {
    console.log(`[petfit-server] listening on :${env_1.PORT} (NODE_ENV=${process.env.NODE_ENV ?? "undefined"})`);
});
