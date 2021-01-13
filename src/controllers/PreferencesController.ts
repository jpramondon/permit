import { Errors, Loggers } from "@gearedminds/ts-commons";
import { BodyParams, Controller, Get, Put, QueryParams, Res, Response, Status } from "@tsed/common";
import { isEmpty } from "@tsed/core";
import { Description, Name, Operation, ReturnsArray } from "@tsed/swagger";
import { BadRequest } from "ts-httpexceptions";
import { UserPreferences } from "../models/Models";
import PreferenceService from "../services/PreferenceService";
import { PreferencesRequestBody } from "./Models";

@Controller("/preferences")
@Name("Preferences")
export class PreferencesController {

    private logger = Loggers.getLogger("PreferencesController");

    @Get("/")
    @Operation({ operationId: "Get preferences" })
    @Description("Get a user's preferences for a given application")
    @ReturnsArray(200, { type: UserPreferences })
    @ReturnsArray(404, { description: "When no preference items could be found for the given app and user" })
    async getPreferences(
        @Description("The application on which preferences apply") @QueryParams("app") appName: string,
        @Description("The id of the user whose permissions have to be found") @QueryParams("user") userName: string,
        @Res() res: Response): Promise<UserPreferences> {
        if (isEmpty(userName)) {
            throw new BadRequest("Username parameter cannot be empty");
        }
        return PreferenceService.getPreferences(userName, appName)
            .then(prefs => {
                if (isEmpty(prefs)) {
                    throw new Errors.NotFoundError();
                } else {
                    return prefs;
                }
            });
    }

    @Put("/")
    @Operation({ operationId: "Update preferences" })
    @Description("Update a user's preferences for an application. Replaces all previous known values.")
    @Status(201)
    async updatePreferences(
        @Description("The object that contains new preferences values") @BodyParams("") preferences: PreferencesRequestBody): Promise<void> {
        this.logger.debug(`Received following preferences object: ${JSON.stringify(preferences)}`);
        if (isEmpty(preferences)) {
            throw new BadRequest("Preferences object cannot be empty");
        }
        return PreferenceService.updatePreferences(preferences.userName, preferences.application, preferences.preferences);
    }

}