import { Loggers } from "@gearedminds/ts-commons";
import * as _ from "lodash";
import * as XLSX from "xlsx";
import { AbstractPreferenceRepository } from "./AbstractPreferenceRepository";

export class MockedPreferenceRepository extends AbstractPreferenceRepository {

    private logger = Loggers.getLogger("MockedPreferenceRepository");
    private preferences: XslPreferenceTemplateLine[];

    constructor() {
        super();
        this.logger.debug("Now using the mocked permission repository");
        // Read provided preferences file
        this.importPreferencesFile();
    }

    public applicationExists(appName: string): Promise<boolean> {
        return Promise.resolve(this.preferences.some(pref => pref.application === appName));
    }
    public findPreferenceEntries(user: string, appName?: string): Promise<Map<string, Object>> {
        const result = new Map<string, Object>();
        this.preferences
            .filter(pref => {
                if (appName) {
                    return (pref.application === appName && pref.user === user);
                }
                return (pref.user === user && _.isNil(pref.application));
            })
            .forEach(pref => {
                result.set(pref.key, pref.value);
            });
        return (result.size !== 0 ? Promise.resolve(result) : Promise.resolve(undefined));
    }

    private importPreferencesFile(): void {
        const wb = XLSX.readFile("/home/permit/data/preferences.xlsx");
        if (wb.SheetNames.length > 0) {
            const sheet0 = wb.Sheets[wb.SheetNames[0]] as XLSX.WorkSheet;
            this.preferences = XLSX.utils.sheet_to_json<XslPreferenceTemplateLine>(sheet0, { header: ["application", "user", "key", "value"] });
        }
    }

}

interface XslPreferenceTemplateLine {
    application: string;
    user: string;
    key: string;
    value: string;
}