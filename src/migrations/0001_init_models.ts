import * as fs from "fs";
import SequelizeManager from "../persistence/SequelizeManager";

export = {
    async down(): Promise<void> {
        //
    },
    async up(): Promise<void> {
        await SequelizeManager.sequelize.query(fs.readFileSync(`${__dirname}/0001_init_models.sql`, "utf8"));
    }
}