import { Config, ConfigOptions } from "@gearedminds/ext-conf";
import { ConnectionOptions, DatabaseManager, Loggers } from "@gearedminds/ts-commons";
import { program } from "commander";

const dboLogger = Loggers.getLogger("dbdLogger");
const dbManager = new DatabaseManager();

function connectToDatabase(): Promise<void> {
    const options = {
        host: Config.getConfItem("PG_HOST"),
        port: Config.getConfItem("PG_PORT"),
        database: Config.getConfItem("PG_DEFAULT_DATABASE"),
        user: Config.getConfItem("PG_USER"),
        password: Config.getConfItem("PG_PWD"),
        sslMode: Config.getConfItem("PG_SSL_MODE") as boolean ?? false,
    } as ConnectionOptions;
    return dbManager.connect(options);
}

function kickEveryoneFromDatabase(dbName: string): Promise<void> {
    const kickQuery = `SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${dbName}' AND pid <> pg_backend_pid();`;
    return dbManager.sequelize.query(kickQuery)
        .then(() => {
            dboLogger.info(`Everybody's been kicked out from database ${dbName}`);
        });
}

function createDatabase(dbName: string): Promise<void> {
    return dbManager.sequelize.query(`create database ${dbName}`)
        .then(() => {
            dboLogger.info(`Database ${dbName} created`);
        });
}

function dropDatabase(dbName: string): Promise<void> {
    return dbManager.sequelize.query(`drop database ${dbName}`)
        .then(() => {
            dboLogger.info(`Database ${dbName} dropped`);
        });
}

function databaseExists(dbName: string): Promise<boolean> {
    return dbManager.sequelize.query(`select exists(SELECT 1 from pg_database WHERE datname='${dbName}')`)
        .then(([results, metadata]) => {
            const result = (results[0] as any).exists as boolean;
            return result;
        });
}

program.option("-f, --configFile <folder>", "path to folder containing configuration file")

program
    .command("create")
    .action(() => {
        let dbName: string;
        const confOptions = {
            appConfigPath: program.configFile
        } as ConfigOptions;
        Config.init(confOptions)
            .then(() => {
                // const useHash = Config.getConfItem("PG_DBNAME_WITH_HASH") ?? false;
                // let hash = "";
                // if (useHash) {
                //     hash = Env.getCommitHash();
                // }
                // dbName = DatabaseManager.getDbNameWithHash(Config.getConfItem("PG_TARGET_DATABASE"), hash);
                dbName = Config.getConfItem("PG_TARGET_DATABASE");
                return connectToDatabase();
            })
            .then(() => {
                return databaseExists(dbName);
            })
            .then((exists) => {
                if (!exists) {
                    return createDatabase(dbName)
                        .then(() => {
                            process.exit(0);
                        })
                        .catch(err => {
                            dboLogger.error(`Error creating database ${dbName}: ${err}`);
                            process.exit(1);
                        });
                }
                dboLogger.info(`Database ${dbName} already existed`);
            })
            .catch(err => {
                dboLogger.info(`There was a problem in the database create command: ${err}`);
                process.exit(1);
            });
    });

program
    .command("drop")
    .action(() => {
        let dbName: string;
        const confOptions = {
            appConfigPath: program.configFile
        } as ConfigOptions;
        Config.init(confOptions)
            .then(() => {
                // const useHash = Config.getConfItem("PG_DBNAME_WITH_HASH") ?? false;
                // let hash = "";
                // if (useHash) {
                //     hash = Env.getCommitHash();
                // }
                // dbName = DatabaseManager.getDbNameWithHash(Config.getConfItem("PG_TARGET_DATABASE"), hash);
                dbName = Config.getConfItem("PG_TARGET_DATABASE");
                return connectToDatabase();
            })
            .then(() => {
                return kickEveryoneFromDatabase(dbName);
            })
            .then(() => {
                return dropDatabase(dbName)
                    .then(() => {
                        process.exit(0);
                    })
                    .catch(err => {
                        dboLogger.error(`Error dropping database ${dbName}: ${err}`);
                        process.exit(1);
                    });
            })
            .catch(err => {
                dboLogger.info(`There was a problem in the database drop command: ${err}`);
                process.exit(1);
            });
    });

program.parse(process.argv);