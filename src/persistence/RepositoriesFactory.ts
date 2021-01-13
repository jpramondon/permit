import { Config } from "@gearedminds/ext-conf";
import { MockedPermissionRepository } from "./MockedPermissionRepository";
import { MockedPreferenceRepository } from "./MockedPreferenceRepository";
import { AbstractPermissionRepository } from "./AbstractPermissionRepository";
import { AbstractPreferenceRepository } from "./AbstractPreferenceRepository";
import { PermissionRepository } from "./PermissionRepository";
import { PreferenceRepository } from "./PreferenceRepository";

class RepositoriesFactory {

    private regularPermissionRepository: AbstractPermissionRepository;
    private mockedPermissionRepository: AbstractPermissionRepository;
    private regularPreferenceRepository: AbstractPreferenceRepository;
    private mockedPreferenceRepository: AbstractPreferenceRepository;

    public getPermissionsRepository(): AbstractPermissionRepository {
        const mockMode = Config.getConfItem("MOCK_MODE") as boolean ?? false;
        if (!mockMode) {
            if (!this.regularPermissionRepository) {
                this.regularPermissionRepository = new PermissionRepository();
            }
            return this.regularPermissionRepository;
        } else {
            if (!this.mockedPermissionRepository) {
                this.mockedPermissionRepository = new MockedPermissionRepository();
            }
            return this.mockedPermissionRepository;
        }
    }

    public getPreferencesRepository(): AbstractPreferenceRepository {
        const mockMode = Config.getConfItem("MOCK_MODE") as boolean ?? false;
        if (!mockMode) {
            if (!this.regularPreferenceRepository) {
                this.regularPreferenceRepository = new PreferenceRepository();
            }
            return this.regularPreferenceRepository;
        } else {
            if (!this.mockedPreferenceRepository) {
                this.mockedPreferenceRepository = new MockedPreferenceRepository();
            }
            return this.mockedPreferenceRepository;
        }
    }

}

export default new RepositoriesFactory();