import { binding, then, when } from 'cucumber-tsflow/dist';
import { use, expect } from 'chai';
import chaiHttp = require('chai-http');
import { TableDefinition } from 'cucumber';
import TestContext from '../TestContext';
import BasicStepDefinitions from './BasicStepDefinitions';

@binding()
class PermissionStepDefinitions {
  constructor() {
    use(chaiHttp)
  }

  @when(/^I ask for the permissions on application "(.+)" for user "(.+)"$/)
  public iAskForThePermissionsOnApplicationForUser(app: string, user: string): Promise<void> {
    return BasicStepDefinitions.performGetOnPath(`/permissions?app=${app}&user=${user}`);
  }

  @when(/^I ask for the preferences on application "(.+)" for user "(.+)"$/)
  public iAskForThePreferencesOnApplicationForUser(app: string, user: string): Promise<void> {
    return BasicStepDefinitions.performGetOnPath(`/preferences?app=${app}&user=${user}`);
  }

  @when(/^I modify the preferences on application "(.+)" for user "(.+)" with the following preferences$/)
  public iModifyThePreferencesOnApplicationForUserWithTheFollowingPreferences(app: string, user: string, table: TableDefinition): Promise<void> {
    const preferences: any[] = table.hashes().map(preference => ({
      [preference.key]: isNaN(Number(preference.value)) ? preference.value : Number(preference.value)
    }));
    const body = {
      application: app,
      userName: user,
      preferences,
    };
    return BasicStepDefinitions.performPutOnPath("/preferences", JSON.stringify(body));
  }

  @when(/^I ask for the profile on application "(.+)" for user "(.+)"$/)
  public iAskForTheProfileOnApplicationForUser(app: string, user: string): Promise<void> {
    return BasicStepDefinitions.performGetOnPath(`/profile?app=${app}&user=${user}`);
  }

  @then(/^the response contains the following permissions$/)
  public theResponseContainsTheFollowingPermissions(table: TableDefinition): Promise<void> {
    const expectedPermissions: any[] = [];

    table.hashes().forEach(expectedPermission => {
      let permissionIndex = expectedPermissions.findIndex(perm => perm.role === expectedPermission.role);
      let targetTable: string[] = [];
      if (expectedPermission.target && expectedPermission.target.trim() !== "") {
        targetTable = expectedPermission.target.split(",");
      }
      if (permissionIndex !== -1 && targetTable.length > 0) {
        expectedPermissions[permissionIndex].target.concat(targetTable);
      } else {
        const perm: any = {
          role: expectedPermission.role
        }
        if (targetTable.length > 0) {
          perm.targets = targetTable;
        }
        expectedPermissions.push(perm);
      }
    });

    const response = TestContext.lastResponse.body;

    expectedPermissions.forEach(expectedPermission => {
      expect(response.permissions).to.deep.include(expectedPermission)
    });

    return Promise.resolve();
  }

  @then(/^the response contains the following preferences$/)
  public theResponseContainsTheFollowingPreferences(table: TableDefinition): Promise<void> {
    const expectedPreferences = table.hashes().map(expectedPreference => ({
      [expectedPreference.key]: isNaN(Number(expectedPreference.value)) ? expectedPreference.value : Number(expectedPreference.value)
    }));

    const response = TestContext.lastResponse.body;

    expectedPreferences.forEach(expectedPreference => {
      expect(response.preferences).to.deep.include(expectedPreference);
    });

    return Promise.resolve();
  }

  @then(/^the response contains the following application preferences$/)
  public theResponseContainsTheFollowingApplicationPreferences(table: TableDefinition): Promise<void> {
    const expectedPreferences = table.hashes().map(expectedPreference => ({
      [expectedPreference.key]: isNaN(Number(expectedPreference.value)) ? expectedPreference.value : Number(expectedPreference.value)
    }));

    const response = TestContext.lastResponse.body;

    expectedPreferences.forEach(expectedPreference => {
      expect(response.preferences.application).to.deep.include(expectedPreference);
    });

    return Promise.resolve();
  }

  @then(/^the response contains the following global preferences$/)
  public theResponseContainsTheFollowingGlobalPreferences(table: TableDefinition): Promise<void> {
    const expectedPreferences = table.hashes().map(expectedPreference => ({
      [expectedPreference.key]: isNaN(Number(expectedPreference.value)) ? expectedPreference.value : Number(expectedPreference.value)
    }));

    const response = TestContext.lastResponse.body;

    expectedPreferences.forEach(expectedPreference => {
      expect(response.preferences.global).to.deep.include(expectedPreference);
    });

    return Promise.resolve();
  }
}

export default new PermissionStepDefinitions();
