import { Probes } from "@gearedminds/tsed-api-support";
import * as chai from "chai";
import * as shallowDeepEqual from "chai-shallow-deep-equal";
import * as chaiThings from "chai-things";
import { binding, then, given } from "cucumber-tsflow";
import TestContext from "../TestContext";
import chaiHttp = require("chai-http");

@binding()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ApiCommonStepDefinitions {
    constructor() {
        chai.use(chaiHttp);
        chai.use(shallowDeepEqual);
        chai.use(chaiThings);
    }

    @given(/^the user is properly authenticated$/)
    public userIsProperlyAuthenticated(): Promise<void> {
        TestContext.userAccessToken = "rightToken";
        return Promise.resolve();
    }

    @then(/^the response contains health data$/)
    public thenResponseContainsHealthData(): Promise<void> {
        if (TestContext.lastResponse && TestContext.lastResponse.body) {
            const responseContent = TestContext.lastResponse.body;
            chai.expect(responseContent.status).to.deep.equal("OK");
            chai.expect(responseContent.version).to.deep.equal(require("../../../package.json").version);
            if (responseContent.probes.length === 2) {
                const dbProbes = responseContent.probes.filter((probe: any) => probe.name === Probes.DbPingProbe.NAME);
                const apiStatusProbes = responseContent.probes.filter((probe: any) => probe.name === Probes.ApiStatusProbe.NAME);
                if (dbProbes.length < 1) {
                    return Promise.reject("Health probes result does not contain any db probe");
                }
                if (apiStatusProbes < 1) {
                    return Promise.reject("Health probes result does not contain any api status probe");
                }
                const dbProbe = dbProbes.pop();
                const apiStatusProbe = apiStatusProbes.pop();
                let dbProbeValue = undefined;
                try {
                    dbProbeValue = Number(dbProbe.value.split(" ")[0]);
                } catch (err) {
                    return Promise.reject(`DbProbe value ("${dbProbe.value}") is not well formatted: ${err}`);
                }
                console.log(JSON.stringify(responseContent.probes));
                chai.expect(dbProbe.status).to.deep.equal("OK");
                chai.expect(dbProbeValue).to.be.greaterThan(0).and.lessThan(100);
                chai.expect(apiStatusProbe.value).to.deep.equal(Probes.ApiStatus.RUNNING);
                chai.expect(apiStatusProbe.status).to.deep.equal("OK");
                return Promise.resolve();
            }
            return Promise.reject("Health probes result is not well formatted");
        } else {
            return Promise.reject("No response available in test context");
        }
    }

}
