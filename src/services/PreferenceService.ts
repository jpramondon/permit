import { Errors, Loggers } from "@gearedminds/ts-commons";
import { Preferences, UserPreferences } from "../models/Models";
import { PreferenceRepository } from "../persistence/PreferenceRepository";
import RepositoriesFactory from "../persistence/RepositoriesFactory";

class PreferenceService {

    private logger = Loggers.getLogger("PreferenceService");

    public getPreferences(user: string, application?: string): Promise<UserPreferences> {
        const prefPromises: Promise<Map<string, Object>>[] = [];
        const prefRepo = RepositoriesFactory.getPreferencesRepository();
        if (application) {
            // Find application specific preferences
            prefPromises.push(prefRepo.applicationExists(application)
                .then(exists => {
                    if (!exists) {
                        throw new Errors.NotFoundError(`Application with name "${application}" could not be resolved in the database (there might be an error)`);
                    }
                    return prefRepo.findPreferenceEntries(user, application);
                }));
        }
        // Find global preferences
        prefPromises.push(prefRepo.findPreferenceEntries(user));
        return Promise.all(prefPromises).then(prefResults => {
            let appPrefs, globalPrefs;
            if (application) {
                appPrefs = prefResults[0];
                if (prefResults[1]) {
                    globalPrefs = prefResults[1];
                }
            } else {
                if (prefResults[0]) {
                    globalPrefs = prefResults[0];
                }
            }
            if (!appPrefs && !globalPrefs) {
                this.logger.error('UNDEFINED DATA')
                return undefined;
            }
            const result = {
                user,
                application,
                preferences: new Preferences()
            } as UserPreferences;
            if (appPrefs) {
                result.preferences.application = appPrefs;
            }
            if (globalPrefs) {
                result.preferences.global = globalPrefs;
            }
            return result;
        });
    }

    public async updatePreferences(user: string, appName: string, prefs: Map<string, Object>): Promise<void> {
        const prefRepo = RepositoriesFactory.getPreferencesRepository() as PreferenceRepository;
        const existingPrefs = await prefRepo.findPreferenceEntries(user, appName);
        this.logger.debug(`existing prefs : ${existingPrefs}`);
        if (existingPrefs) {
            return prefRepo.updatePreferences(user, appName, prefs);
        } else {
            return prefRepo.createPreferences(user, appName, prefs);
        }
    }

}

export default new PreferenceService();