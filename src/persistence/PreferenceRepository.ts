import { Config } from "@gearedminds/ext-conf";
import { Loggers } from "@gearedminds/ts-commons";
import { AbstractPreferenceRepository } from "./AbstractPreferenceRepository";
import SequelizeManager from "./SequelizeManager";

export class PreferenceRepository extends AbstractPreferenceRepository {

    private logger = Loggers.getLogger("PreferenceRepository");

    public applicationExists(appName: string): Promise<boolean> {
        const q = `select count(owner) from preferences where path ~ '${Config.getConfItem("PREFERENCES_ROOT_PATH")}.${appName}'`;
        return SequelizeManager.sequelize
            .query(q).then(([results, metadata]) => {
                return Number((results[0] as any).count) >= 1;
            });
    }

    public findPreferenceEntries(user: string, appName?: string): Promise<Map<string, Object>> {
        let prefPath = `${Config.getConfItem("PREFERENCES_ROOT_PATH")}`;
        if (appName) {
            prefPath += `.${appName}`;
        }
        let q = `select * from preferences where owner = '${user}' and path ~ '${prefPath}'`;
        return SequelizeManager.sequelize
            .query(q).then(([result, metadata]) => {
                this.logger.debug(`pref search result: ${JSON.stringify(result)}`);
                if (result.length >= 1) {
                    return this.toUserPreferences(result[0]);
                } else {
                    // no result found
                    return undefined;
                }
            });
    }

    public createPreferences(user: string, appName: string, prefs: Map<string, Object>): Promise<void> {
        const prefPath = `${Config.getConfItem("PREFERENCES_ROOT_PATH")}.${appName}`;
        const q = `insert into preferences("owner","prefData","path") values('${user}', '${JSON.stringify(prefs)}', '${prefPath}')`;
        return SequelizeManager.sequelize.query(q).then(() => {});
    }

    public updatePreferences(user: string, appName: string, prefs: Map<string, Object>): Promise<void> {
        const prefPath = `${Config.getConfItem("PREFERENCES_ROOT_PATH")}.${appName}`;
        const q = `update preferences set "prefData" = '${JSON.stringify(prefs)}' where owner = '${user}' and path ~ '${prefPath}'`;
        return SequelizeManager.sequelize.query(q).then(() => {});
    }

    private toUserPreferences(prefEntry: any): Map<string, Object> {
        const rawPrefs = prefEntry.prefData;
        this.logger.debug(`Got raw preferences as ${JSON.stringify(rawPrefs)}`);
        if (rawPrefs) {
            return rawPrefs;
        }
        // Empty prefs in database
        return undefined;
    }

}