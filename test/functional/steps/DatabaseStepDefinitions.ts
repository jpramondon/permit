import { Config } from "@gearedminds/ext-conf";
import { Loggers, ConnectionOptions } from "@gearedminds/ts-commons";
import { AfterAll } from "cucumber";
import { binding, given, then } from "cucumber-tsflow/dist";
import * as fs from "fs";
import * as _ from "lodash";
import * as path from "path";
import SequelizeManager from "../../../src/persistence/SequelizeManager";

AfterAll(() => {
    if (!_.isUndefined(SequelizeManager.sequelize)) {
        SequelizeManager.disconnect();
    }
});

let sampleDataAlreadyImported = false;

@binding()
class DatabaseStepDefinitions {

    private logger = Loggers.getLogger("BasicStepDefinitions");

    @given(/^the database is available$/)
    public givenDatabaseAvailable(): Promise<void> {
        const options = {
            host: Config.getConfItem("PG_HOST"),
            port: Config.getConfItem("PG_PORT"),
            database: Config.getConfItem("PG_DATABASE"),
            user: Config.getConfItem("PG_USER"),
            password: Config.getConfItem("PG_PWD"),
            sslMode: Config.getConfItem("PG_SSL_MODE"),
            databaseModifierEnvVar: Config.getConfItem("PG_DATABASE_MODIFIER_ENV_VAR")
        } as ConnectionOptions;
        return SequelizeManager.connect(options);
    }

    @given(/^the sample data file is imported in the database$/)
    public importSampleDataFile(): Promise<void> {
        this.logger.info(`Sample data already imported ? ${sampleDataAlreadyImported}`);
        if (!sampleDataAlreadyImported) {
            const sampleDataFilePath = path.normalize(`${__dirname}/../data/sample_data.sql`);
            if (fs.existsSync(sampleDataFilePath)) {
                return SequelizeManager.sequelize.query(fs.readFileSync(sampleDataFilePath, "utf8"))
                    .then(() => {
                        sampleDataAlreadyImported = true;
                        this.logger.info("Sample data imported");
                    });
            }
            this.logger.warn(`Sample data not imported as data file could not be found at ${sampleDataFilePath}`);
        }
        this.logger.info("Sample data already imported once");
    }

    // Then('the database contains role {string} on application {string} for target {string}'x²x²
    //       the database contains role "ROLE_TO_DELETE2" on application "APP3" for target "CTX2"
    @then(/^the database contains role "(.+)" on application "(.+)" for target "(.+)"$/)
    public databaseContainsTargetRole(role: string, app: string, target: string): Promise<void> {
        return this.countTargetRolesinDb(app, target, role).then(count => {
            if (count != 1) {
                return Promise.reject(`Database does not contain 1 role ${role} for app ${app} and target ${target}, but ${count}`);
            }
        });
    }

    @then(/^the database does not contain role "(.+)" on application "(.+)" for target "(.+)"$/)
    public databaseDoesNotContainTargetRole(role: string, app: string, target: string): Promise<void> {
        return this.countTargetRolesinDb(app, target, role).then(count => {
            if (count > 0) {
                return Promise.reject(`Database contains ${count} role(s) ${role} for app ${app} and target ${target}`);
            }
        })
    }

    private countTargetRolesinDb(app: string, target: string, role: string): Promise<number> {
        const q = `select * from roles where path = '${Config.getConfItem("ROLES_ROOT_PATH")}.${app}.${target}' and name='${role}'`;
        return SequelizeManager.sequelize
            .query(q).then(([results, metadata]) => {
                return results.length;
            });
    }

}