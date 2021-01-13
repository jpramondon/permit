
export interface PreferencesRequestBody {
    application: string;
    userName: string;
    preferences: Map<string, Object>;
}

export class AppRoleDescription {
    name: string = ""; 
    targetRoles: AppTargetRole[] = [];
    directRoles: AppRole[] = [];
}

export class AppTargetRole {
    name:string = "";
    roles: AppRole[] = [];
}

export class AppRole {
    name: string = "";
    members: string[] = [];
}

export class SingleRoleDescription extends AppRole {
    app: string;
    target?: string;
}