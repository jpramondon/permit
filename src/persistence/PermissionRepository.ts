import { Config } from "@gearedminds/ext-conf";
import { Loggers } from "@gearedminds/ts-commons";
import { isEmpty } from "@tsed/core";
import { QueryTypes, Transaction } from "sequelize";
import { AppRoleDescription } from "../controllers/Models";
import { UserPermission } from "../models/Models";
import { AbstractPermissionRepository } from "./AbstractPermissionRepository";
import SequelizeManager from "./SequelizeManager";

export class PermissionRepository extends AbstractPermissionRepository {

    private logger = Loggers.getLogger("PermissionRepository");
    private roleTargetDepth: number;
    private roleAppDepth: number;

    constructor() {
        super();
        this.roleTargetDepth = Config.getConfItem("ROLE_TARGET_DEPTH") as number;
        this.roleAppDepth = Config.getConfItem("ROLE_APP_DEPTH") as number;
    }

    public applicationExists(appName: string): Promise<boolean> {
        const q = `select count(name) from roles where path <@ '${Config.getConfItem("ROLES_ROOT_PATH")}.${appName}'`
        return SequelizeManager.sequelize
            .query(q).then(([results, metadata]) => {
                return Number((results[0] as any).count) >= 1;
            });
    }

    public findRoleEntries(appName: string, username: string): Promise<UserPermission[]> {
        const q = `select * from roles where path <@ '${Config.getConfItem("ROLES_ROOT_PATH")}.${appName}' and '${username}' = ANY(members)`;
        return SequelizeManager.sequelize
            .query(q).then(([results, metadata]) => {
                return this.toUserPermissions(results);
            });
    }

    public getAppRoles(appNames?: string[]): Promise<AppRoleDescription[]> {
        let q = `select * from roles`;
        if (appNames) {
            const appNameConditions = appNames.map(name => `path <@ '${Config.getConfItem("ROLES_ROOT_PATH")}.${name}'`);
            q += " where ";
            q += appNameConditions.join(" or ");
        }
        return SequelizeManager.sequelize
            .query(q).then(([results, metadata]) => {
                const roleMap = new Map<string, AppRoleDescription>();
                results.forEach((row: any) => {
                    const pathBits = row.path.split(".");
                    const appName = pathBits[this.roleAppDepth - 1];
                    if (!roleMap.has(appName)) {
                        const newAppRole = new AppRoleDescription();
                        newAppRole.name = appName;
                        roleMap.set(appName, newAppRole);
                    }
                    const appRole = roleMap.get(appName);
                    if (pathBits.length >= this.roleTargetDepth) {
                        // Target role
                        const trName = pathBits[this.roleTargetDepth - 1];
                        const existingTR = appRole.targetRoles.find(tr => tr.name === trName);
                        if (existingTR) {
                            existingTR.roles.push({ name: row.name, members: row.members });
                        } else {
                            appRole.targetRoles.push({ name: pathBits[this.roleTargetDepth - 1], roles: [{ name: row.name, members: row.members }] });
                        }
                    } else {
                        // Direct role
                        appRole.directRoles.push({ name: row.name, members: row.members });
                    }
                });
                return [...roleMap.values()];
            });
    }

    public deleteApp(app: string, transaction?: Transaction): Promise<void> {
        const q = `delete from roles where path <@ '${Config.getConfItem("ROLES_ROOT_PATH")}.${app}'`;
        return SequelizeManager.sequelize.query(q, { type: QueryTypes.DELETE, transaction });
    }

    public deleteTarget(app: string, target: string, transaction?: Transaction): Promise<void> {
        const q = `delete from roles where path <@ '${Config.getConfItem("ROLES_ROOT_PATH")}.${app}.${target}'`;
        return SequelizeManager.sequelize.query(q, { type: QueryTypes.DELETE, transaction });
    }

    public deleteRole(role: string, app: string, target?: string, transaction?: Transaction): Promise<void> {
        const roleTarget = `${Config.getConfItem("ROLES_ROOT_PATH")}.${app}${(target ? "." + target : "")}`;
        const q = `delete from roles where path = '${roleTarget}' and name = '${role}'`;
        return SequelizeManager.sequelize.query(q, { type: QueryTypes.DELETE, transaction });
    }

    public createRole(name: string, members: string[], app: string, target?: string, transaction?: Transaction): Promise<[number, number]> {
        let rolePath = `${Config.getConfItem("ROLES_ROOT_PATH")}.${app}${(target ? "." + target : "")}`;
        let roleMembers = "";
        members.forEach(m => {
            roleMembers += `"${m}",`;
        });
        roleMembers = roleMembers.slice(0, -1);
        const q = `insert into roles("name","path","members") values('${name}','${rolePath}', '{${roleMembers}}');`;
        return SequelizeManager.sequelize.query(q, { type: QueryTypes.INSERT, transaction });
    }

    private toUserPermissions(roleEntries: any[]): UserPermission[] {
        const permsByRole: Map<string, UserPermission> = new Map();
        roleEntries.forEach(roleEntry => {
            const role = roleEntry.name;
            const roleTarget = this.getRoleTarget(roleEntry.path);
            let perm: UserPermission;
            if (!permsByRole.has(role)) {
                perm = { role };
                if (!isEmpty(roleTarget)) {
                    perm.targets = [roleTarget];
                }
            } else {
                perm = permsByRole.get(role);
                if (!isEmpty(roleTarget)) {
                    perm.targets = perm.targets.concat([roleTarget]);
                }
            }
            permsByRole.set(role, perm);
        });
        return [...permsByRole.values()];
    }

    private getRoleTarget(path: string): string {
        const pathBits = path.split(".");
        const pathDepth = pathBits.length;
        this.logger.debug(`path = ${path} / pathDepth = ${pathDepth} / roleTargetDepth = ${this.roleTargetDepth}`);
        if (pathDepth >= this.roleTargetDepth) {
            return pathBits[this.roleTargetDepth - 1];
        }
        return null;
    }


}