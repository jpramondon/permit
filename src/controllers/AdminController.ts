import { Loggers } from "@gearedminds/ts-commons";
import { BodyParams, Controller, Delete, Get, Put, QueryParams, Res, Response, Status } from "@tsed/common";
import { Description, Name, Operation, ReturnsArray } from "@tsed/swagger";
import { UserPermission } from "../models/Models";
import PermissionService from "../services/PermissionService";
import { AppRoleDescription, SingleRoleDescription } from "./Models";

@Controller("/_admin")
@Name("Admin")
export class AdminController {

    private logger = Loggers.getLogger("AdminController");

    @Get("/apps")
    @Operation({ operationId: "Get Applications" })
    @ReturnsArray(200, { type: AppRoleDescription })
    @ReturnsArray(204, { description: "When no application could be found" })
    async getApps(@Res() res: Response): Promise<AppRoleDescription[]> {
        const adminRoles = res.locals.permissions as UserPermission[];
        return PermissionService.getAppRoles(adminRoles);
    }

    @Delete("/app")
    @Status(204)
    async deleteApp(
        @Description("The name of the application the role applies on") @QueryParams("app") app: string,
    ): Promise<void> {
        return PermissionService.deleteApp(app);
    }

    @Delete("/role")
    @Operation({ operationId: "Delete role" })
    @Status(204)
    async deleteRole(
        @Description("The role name") @QueryParams("role") role: string,
        @Description("The name of the application the role applies on") @QueryParams("app") app: string,
        @Description("The target the role role applies on") @QueryParams("target") target?: string,
    ): Promise<void> {
        return PermissionService.deleteRole(role, app, target);
    }

    @Delete("/target")
    @Operation({ operationId: "Delete target" })
    @Status(204)
    async deleteTarget(
        @Description("The name of the application the role applies on") @QueryParams("app") app: string,
        @Description("The target the role role applies on") @QueryParams("target") target: string
    ): Promise<void> {
        return PermissionService.deleteTarget(app, target);
    }

    @Put("/role")
    @Status(201)
    async saveRoles(@BodyParams() rolesDesc: SingleRoleDescription[]): Promise<void> {
        return PermissionService.saveRoles(rolesDesc);
    }

}