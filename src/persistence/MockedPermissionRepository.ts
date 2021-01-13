import { Loggers } from "@gearedminds/ts-commons";
import * as _ from "lodash";
import * as XLSX from "xlsx";
import { UserPermission } from "../models/Models";
import { AbstractPermissionRepository } from "./AbstractPermissionRepository";

export class MockedPermissionRepository extends AbstractPermissionRepository {

    private logger = Loggers.getLogger("MockedPermissionRepository");
    private permissions: XslRoleTemplateLine[];

    constructor() {
        super();
        this.logger.debug("Now using the mocked permission repository");
        // Read provided role file
        this.importRolesFile();
    }

    public applicationExists(appName: string): Promise<boolean> {
        return Promise.resolve(this.permissions.some(permDef => permDef.application === appName));
    }

    public findRoleEntries(appName: string, username: string): Promise<UserPermission[]> {
        const rolesMap: Map<String, UserPermission> = new Map();
        this.permissions
            .filter(permDef => {
                return (permDef.application === appName && permDef.member === username);
            })
            .forEach(permDef => {
                let currentRole;
                if (rolesMap.has(permDef.role)) {
                    currentRole = rolesMap.get(permDef.role);
                    if (!_.isNil(permDef.target)) {
                        currentRole.targets.push(permDef.target);
                    }
                } else {
                    currentRole = {
                        role: permDef.role,
                    } as UserPermission;
                    if (!_.isNil(permDef.target)) {
                        currentRole.targets = [permDef.target]
                    }
                }
                rolesMap.set(permDef.role, currentRole);
            });
        return Promise.resolve([...rolesMap.values()]);
    }

    private importRolesFile(): void {
        const wb = XLSX.readFile("/home/permit/data/roles.xlsx");
        if (wb.SheetNames.length > 0) {
            const sheet0 = wb.Sheets[wb.SheetNames[0]] as XLSX.WorkSheet;
            this.permissions = XLSX.utils.sheet_to_json<XslRoleTemplateLine>(sheet0, { header: ["application", "target", "role", "member"] });
        }
    }
}

interface XslRoleTemplateLine {
    application: string;
    target: string;
    role: string;
    member: string;
}