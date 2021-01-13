import { use } from 'chai';
import { binding, when } from 'cucumber-tsflow/dist';
import BasicStepDefinitions from './BasicStepDefinitions';
import chaiHttp = require('chai-http');

@binding()
class AdminStepDefinitions {
  constructor() {
    use(chaiHttp)
  }

  @when(/^I try to delete the role "(.+)" on application "(.+)" for target "(.+)"$/)
  public tryDeleteRoleWithContext(role: string, app: string, target: string): Promise<void> {
    return BasicStepDefinitions.performDeleteOnPath(`/_admin/role?role=${role}&app=${app}&target=${target}`);
  }

}

export default new AdminStepDefinitions();
