import { ARRAY, JSONB, Model, Sequelize, STRING } from "sequelize";

export class ApplicationRole extends Model { }

export function initApplicationRoleModel(sequelize: Sequelize) {
    ApplicationRole.init({
        name: { type: STRING, primaryKey:true },
        path: { type: "LTREE", primaryKey:true },
        members: { type: ARRAY(STRING) }
    }, {
        sequelize,
        modelName: "roles",
        timestamps: false
    });
}

export class ApplicationPreference extends Model { }

export function initApplicationPreferenceModel(sequelize: Sequelize) {
    ApplicationPreference.init({
        owner: { type: STRING, primaryKey:true },
        path: { type: "LTREE", primaryKey:true },
        prefData: { type: JSONB }
    }, {
        sequelize,
        modelName: "preferences",
        timestamps: false
    });
}
