import { Errors, Loggers } from "@gearedminds/ts-commons";
import { Controller, Get, QueryParams, Res, Response } from "@tsed/common";
import { isEmpty } from "@tsed/core";
import { Description, Name, Operation, Returns } from "@tsed/swagger";
import { BadRequest } from "ts-httpexceptions";
import { AppUserPermissions } from "../models/Models";
import PermissionService from "../services/PermissionService";

@Controller("/permissions")
@Name("Permissions")
export class PermissionsController {

    private logger = Loggers.getLogger("PermissionController");

    @Get("/")
    @Operation({ operationId: "Get Permissions" })
    @Description("Get a user's permissions for a given application")
    @Returns(200, { type: AppUserPermissions })
    @Returns(404, { description: "When no specific permission could be found for the given app and user" })
    async getPermissions(
        @Description("The application on which permissions apply") @QueryParams("app") appName: string,
        @Description("The id of the user whose permissions have to be found") @QueryParams("user") userName: string,
        @Res() res: Response): Promise<AppUserPermissions> {
        if (isEmpty(appName)) {
            throw new BadRequest("Application parameter cannot be empty");
        }
        if (isEmpty(userName)) {
            throw new BadRequest("User parameter cannot be empty");
        }
        return PermissionService.searchPermissions(appName, userName)
            .then(appPermissions => {
                if (appPermissions.permissions.length === 0) {
                    throw new Errors.NotFoundError("No permission found for user on application");
                }
                return appPermissions;
            });
    }

}