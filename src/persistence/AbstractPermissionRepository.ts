import { UserPermission } from "../models/Models";

export abstract class AbstractPermissionRepository {
    public abstract applicationExists(appName: string): Promise<boolean>;
    public abstract findRoleEntries(appName: string, username: string): Promise<UserPermission[]>;
}