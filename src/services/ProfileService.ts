import { Errors, Loggers } from "@gearedminds/ts-commons";
import { AppUserPermissions, UserPreferences, UserProfile, Preferences } from "../models/Models";
import PermissionService from "./PermissionService";
import PreferenceService from "./PreferenceService";

class ProfileService {

    private logger = Loggers.getLogger("ProfileService");

    public async getProfile(user: string, application: string): Promise<UserProfile> {
        const result = {
            user,
            application,
            preferences: new Preferences(),
        } as UserProfile;
        return PreferenceService.getPreferences(user, application)
            .then((userPreferences: UserPreferences) => {
                if (userPreferences) {
                    if (userPreferences.preferences.global && userPreferences.preferences.global.size !== 0) {
                        result.preferences.global = userPreferences.preferences.global;
                    }
                    if (userPreferences.preferences.application && userPreferences.preferences.application.size !== 0) {
                        result.preferences.application = userPreferences.preferences.application;
                    }
                }
            })
            .catch(error => {
                if (!(error instanceof Errors.NotFoundError)) {
                    throw error;
                }
                this.logger.warn(`Got Permit error ${error}`);
            })
            .then(() => {
                return PermissionService.searchPermissions(application, user);
            })
            .then((permObject: AppUserPermissions) => {
                if (permObject) {
                    if (permObject.permissions && permObject.permissions.length !== 0) {
                        result.permissions = permObject.permissions;
                    }
                }
            })
            .catch(error => {
                if (!(error instanceof Errors.NotFoundError)) {
                    throw error;
                }
                this.logger.warn(`Got Permit error ${error}`);
            })
            .then(() => {
                if (!result.permissions && !result.preferences.application && !result.preferences.global) {
                    return undefined;
                }
                return result;
            });
    }

}

export default new ProfileService();