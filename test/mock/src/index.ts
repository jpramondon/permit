import { Config } from "@gearedminds/ext-conf";
import { Loggers } from "@gearedminds/ts-commons";
import { ServerLoader } from "@tsed/common";
import { Server } from "./Server";

const ixLogger = Loggers.getLogger("index");

async function initNode(): Promise<void> {
    ixLogger.info(`Starting Express instance ${process.pid}`);
    process.on("SIGINT", () => {
        process.exit(0);
    });
    const server = await ServerLoader.bootstrap(Server) as Server;
    return server.listen();
}

Config.init()
    .then(() => {
        return initNode();
    })
    .catch(err => {
        ixLogger.error(`Could not start API due to following error: ${err}`);
        process.exit(1);
    });