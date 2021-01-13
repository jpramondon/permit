export abstract class AbstractPreferenceRepository {
    public abstract applicationExists(appName: string): Promise<boolean>;
    public abstract findPreferenceEntries(user: string, appName?: string): Promise<Map<string, Object>>;
}