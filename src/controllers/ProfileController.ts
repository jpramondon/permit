import { Errors, Loggers } from "@gearedminds/ts-commons";
import { Controller, Get, QueryParams, Res, Response } from "@tsed/common";
import { isEmpty } from "@tsed/core";
import { Description, Name, Operation, Returns } from "@tsed/swagger";
import { BadRequest } from "ts-httpexceptions";
import { UserProfile } from "../models/Models";
import ProfileService from "../services/ProfileService";

@Controller("/profile")
@Name("Profile")
export class ProfileController {

    private logger = Loggers.getLogger("ProfileController");

    @Get("/")
    @Operation({ operationId: "Get profile" })
    @Description("Get a user's complete profile for a given application")
    @Returns(200, { type:  UserProfile})
    @Returns(404, { description: "When no information could be found for the given app and user" })
    async getProfile(
        @Description("The application for which a profile has to be found") @QueryParams("app") appName: string,
        @Description("The id of the user whose profile should be built") @QueryParams("user") userName: string,
        @Res() res: Response): Promise<UserProfile> {
            if (isEmpty(appName)) {
                throw new BadRequest("Application name cannot be empty");
            }
            if (isEmpty(userName)) {
                throw new BadRequest("User name name cannot be empty");
            }
            return ProfileService.getProfile(userName, appName).then( profile => {
                if (profile === undefined) {
                    throw new Errors.NotFoundError();
                } else {
                    return profile;
                }
            });
    }

}