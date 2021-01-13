import { Errors, Loggers } from "@gearedminds/ts-commons";
import { AppRoleDescription, SingleRoleDescription } from "../controllers/Models";
import { AppUserPermissions, UserPermission } from "../models/Models";
import { PermissionRepository } from "../persistence/PermissionRepository";
import RepositoriesFactory from "../persistence/RepositoriesFactory";
import SequelizeManager from "../persistence/SequelizeManager";

class PermissionService {

    private logger = Loggers.getLogger("PermissionService");

    public searchPermissions(appName: string, username: string): Promise<AppUserPermissions> {
        // Search app first to see if it does exist
        const permRepo = RepositoriesFactory.getPermissionsRepository();
        return permRepo.applicationExists(appName)
            .then(exists => {
                if (!exists) {
                    throw new Errors.NotFoundError(`Application with name "${appName}" could not be resolved in the database (there might be an error)`);
                }
                return permRepo.findRoleEntries(appName, username);
            })
            .then((permissions: UserPermission[]) => {
                this.logger.debug(`Found ${permissions.length} perms matching request`);
                const result = {
                    user: username,
                    application: appName,
                    permissions
                } as AppUserPermissions;
                return Promise.resolve(result);
            });
    }

    public getAppRoles(adminRoles: UserPermission[]): Promise<AppRoleDescription[]> {
        if (this.fullAccessGranted(adminRoles)) {
            return (RepositoriesFactory.getPermissionsRepository() as PermissionRepository).getAppRoles();
        } else {
            const appNames = adminRoles
                .filter(perm => perm.role.startsWith("ROLE_ADMIN_"))
                .map(perm => perm.role.replace("ROLE_ADMIN_", ""));
            return (RepositoriesFactory.getPermissionsRepository() as PermissionRepository).getAppRoles(appNames);
        }

    }

    public deleteApp(app: string): Promise<void> {
        return (RepositoriesFactory.getPermissionsRepository() as PermissionRepository).deleteApp(app);
    }

    public deleteTarget(app: string, target: string): Promise<void> {
        return (RepositoriesFactory.getPermissionsRepository() as PermissionRepository).deleteTarget(app, target);
    }

    public deleteRole(role: string, app: string, target?: string): Promise<void> {
        return (RepositoriesFactory.getPermissionsRepository() as PermissionRepository).deleteRole(role, app, target);
    }

    public saveRoles(rolesDesc: SingleRoleDescription[]): Promise<void> {
        return SequelizeManager.sequelize.transaction(t => {
            return Promise.all(rolesDesc.map(roleDesc => {
                const permRepo = (RepositoriesFactory.getPermissionsRepository() as PermissionRepository);
                return permRepo.deleteRole(roleDesc.name, roleDesc.app, roleDesc.target, t)
                    .then(() => {
                        return permRepo.createRole(roleDesc.name, roleDesc.members, roleDesc.app, roleDesc.target, t);
                    })
                    .then(() => {
                        this.logger.debug("Save role transaction went ok");
                    });
            })
            ).then();
        });
    }

    private fullAccessGranted(adminRoles: UserPermission[]): boolean {
        if (adminRoles) {
            return adminRoles.some(perm => perm.role === "ROLE_ADMIN");
        }
        return false;
    }

}

export default new PermissionService();