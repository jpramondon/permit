import { Property, PropertyType } from "@tsed/common";

export class UserPermission {
    @Property()
    role: string;
    @PropertyType(String)
    targets?: string[];
}

export class AppUserPermissions {
    @Property()
    user: string;
    @Property()
    application: string;
    @PropertyType(UserPermission)
    permissions: UserPermission[];
}

export class AppUserPreferences {
    @Property()
    application?: string;
    @Property()
    preferences: Map<string, Object>;
}

export class Preferences {
    @Property()
    application: Map<string, Object>;
    @Property()
    global: Map<string, Object>;
}

export class UserPreferences {
    @Property()
    user: string;
    @Property()
    application: string;
    @Property()
    preferences: Preferences;
}

export class UserProfile {
    @Property()
    user: string;
    @Property()
    application: string;
    @PropertyType(UserPermission)
    permissions?: UserPermission[];
    @Property()
    preferences?: Preferences;
}