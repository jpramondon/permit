import { Config } from "@gearedminds/ext-conf";
import { Env, Loggers, removeDbUpdateLatch, updateDb, ConnectionOptions } from "@gearedminds/ts-commons";
import { ServerLoader } from "@tsed/common";
import * as cluster from "cluster";
import * as os from "os";
import * as path from "path";
import { MuteAllRoutesMiddleware } from "./middlewares/MuteAllRoutesMiddleware";
import SequelizeManager from "./persistence/SequelizeManager";
import { Server } from "./Server";

const ixLogger = Loggers.getLogger("index");
const workers: cluster.Worker[] = [];
let unleashServersInterval: NodeJS.Timeout;
const pNickName = Math.random().toString(36).substr(2, 5);
let gracefulStopWaitTime = 5000;

async function initNode(): Promise<void> {
    ixLogger.info(`Starting Express instance ${process.pid}`);
    process.on("SIGINT", () => {
        gracefulProcessStop(gracefulStopWaitTime);
    });
    const server = await ServerLoader.bootstrap(Server) as Server;
    return server.listen();
}

function unleashServers(): void {
    MuteAllRoutesMiddleware.unMute();
}

function connectToDatabase(): Promise<void> {
    const options = {
        host: Config.getConfItem("PG_HOST"),
        port: Config.getConfItem("PG_PORT"),
        database: Config.getConfItem("PG_DATABASE"),
        user: Config.getConfItem("PG_USER"),
        password: Config.getConfItem("PG_PWD"),
        sslMode: Config.getConfItem("PG_SSL_MODE") as boolean ?? false,
        databaseModifierEnvVar: Config.getConfItem("PG_DATABASE_MODIFIER_ENV_VAR")
    } as ConnectionOptions;
    return SequelizeManager.connect(options);
}

function disconnectFromDatabase(): Promise<void> {
    return SequelizeManager.disconnect();
}

function updateDatabase(): Promise<void> {
    return updateDb(SequelizeManager, path.resolve(__dirname, "./migrations"), pNickName)
        .then(() => {
            ixLogger.info("Database update succeeded (or skipped if performed by another process)");
        })
        .catch((reason: any) => {
            ixLogger.error("error", `Database update failed ${JSON.stringify(reason)}`);
            process.exit(3);
        });
}

function gracefulProcessStop(waitTime: number): Promise<void> {
    setTimeout(() => {
        ixLogger.info(`Process ${pNickName} (${process.pid}) gracefully stopped ... hopefully, after ${waitTime} ms of extra time.`);
        process.exit(0);
    }, waitTime);
    clearInterval(unleashServersInterval);
    return removeDbUpdateLatch(SequelizeManager, pNickName)
        .then(() => disconnectFromDatabase())
        .then(() => { ixLogger.info("Graceful stop finished"); })
        .catch(err => { ixLogger.error(`Something wrong happened in the the graceful stop. It's usually due to the process not being able to remove the latch. Here's the error ${err}`); });
}

function getCpuCount(): number {
    return os.cpus().length;
}

Config.init().then(() => {
    gracefulStopWaitTime = Config.getConfItem("graceful_stop_wait_duration") as number ?? 5000;
    if (Env.isNodeDevEnvironment()) {
        initNode()
            .then(() => {
                return connectToDatabase();
            })
            .catch(reason => {
                ixLogger.error(`Server initialization error: ${reason}`);
                process.exit(1);
            })
            .then(() => {
                ixLogger.info("Database connection successful");
                return;
            })
            .catch(reason => {
                ixLogger.error(`Database connection error: ${reason}`);
                process.exit(1);
            })
            .then(() => {
                ixLogger.info("Starting database update");
                return updateDatabase();
            })
            .then(() => {
                ixLogger.info("Database successfully updated");
            })
            .catch(reason => {
                ixLogger.error(`Database could not be updated: ${reason}`);
                process.exit(3);
            })
            .then(() => {
                return unleashServers();
            })
            .catch((reason: any) => {
                ixLogger.error(`Could not initialize single node. Got the following error ${reason}`);
                process.exit(7);
            });
    } else {
        // Production mode
        if (cluster.isMaster) {
            const configuredMaxForks = Config.getConfItem("max_forks") as number;
            const maxForks = (configuredMaxForks != undefined ? Math.min(getCpuCount(), configuredMaxForks) : getCpuCount());
            ixLogger.info(`Master ${pNickName} (${process.pid}) is running`);
            ixLogger.info(`Now creating ${maxForks} workers`);
            for (let i = 0; i < maxForks; i++) {
                const worker = cluster.fork();
                workers.push(worker);
            }
            cluster.on("exit", (worker, code, signal) => {
                ixLogger.warn(`Worker ${worker.process.pid} died`);
            });
            // These "on" functions only expect synchronous tasks to be performed and will NOT wait for any promise to finish to resolve.
            // One solution is to pile a timeout function in the nodejs' loop to force him to wait a little while a graceful stop is attempted.
            // The latter should finish within the wait time window offered by the timeout function.
            // Also please note that the way you would stop a container (uncomposed) from the console is not the same way Docker or Kubernetes would do it.
            // Breaking from the console sends a SIGINT, whereas Docker or Kubernetes will send a SIGTERM first then an uncatchable SIGKILL.
            // For these signals to be propagated and received properly by the container, the latter's Dockerfile has to use the exec entrypoint as follows:
            // ENTRYPOINT ["/app/bin/your-app", "arg1", "arg2"] (rather than ENTRYPOINT "/app/bin/your-app arg1 arg2")
            process.on("SIGHUP", () => {
                console.log("!!SIGHUP!!");
                gracefulProcessStop(gracefulStopWaitTime);
            });
            // IMPOSSIBLE !
            // process.on("SIGKILL", () => {
            //     console.log("!!SIGKILL!!");
            //     gracefulMasterStop();
            // });
            process.on("SIGTERM", () => {
                console.log("!!SIGTERM!!");
                gracefulProcessStop(gracefulStopWaitTime);
            });
            process.on("SIGINT", () => {
                console.log("!!SIGINT!!");
                gracefulProcessStop(gracefulStopWaitTime);
            });
            process.on("exit", () => {
                ixLogger.info(`Master ${pNickName} (${process.pid}) exited`);
            });
            connectToDatabase()
                .then(updateDatabase)
                .then(disconnectFromDatabase)
                .then(() => {
                    unleashServersInterval = setInterval(() => workers.forEach(w => {
                        w.send({ action: "unleashServers" });
                    }), 10000);
                })
                .then(() => {
                    ixLogger.info("Cluster successfully started with unleashed remaining slaves");
                })
                .catch((reason: any) => {
                    ixLogger.error(`Could not initialize cluster's master. Got the following error ${reason}`);
                    process.exit(11);
                })
        } else {
            process.on('message', (message) => {
                if (message.action === "unleashServers") {
                    unleashServers();
                }
            });
            initNode()
                .then(() => {
                    return connectToDatabase()
                })
                .catch(err => {
                    ixLogger.error(`Could not start tsed server : ${err}`);
                    process.exit(1);
                })
                .then(() => {
                    ixLogger.info("Database connection successful");
                    return;
                })
                .catch(reason => {
                    ixLogger.error(`Database connection error: ${reason}`);
                    process.exit(1);
                })
                .then(() => {
                    ixLogger.info(`Slave process ${process.pid} successfully start`);
                })
        }
    }

});