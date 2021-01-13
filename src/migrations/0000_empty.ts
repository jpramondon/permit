import { Loggers } from "@gearedminds/ts-commons";

const emptyMigrationLogger = Loggers.getLogger("EmptyMigration");

export = {
    async down(): Promise<void> {
        emptyMigrationLogger.info("Migration downward");
    },
    async up(): Promise<void> {
        emptyMigrationLogger.info("Migration upward");
    }
}