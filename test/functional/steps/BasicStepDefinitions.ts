import { Env, Loggers } from "@gearedminds/ts-commons";
import { Probes } from "@gearedminds/tsed-api-support";
import * as chai from "chai";
import { HookScenarioResult, TableDefinition } from "cucumber";
import { after, before, binding, given, then, when } from "cucumber-tsflow";
import * as moment from "moment";
import { Request } from "superagent";
import TestContext from "../TestContext";
import chaiHttp = require("chai-http");

@binding()
class BasicStepDefinitions {
    private logger = Loggers.getLogger("BasicStepDefinitions");

    constructor() {
        chai.use(chaiHttp);
    }

    public getCurrentDate(): string {
        return moment().format("YYYY-MM-DD");
    }

    public extractBooleanValue(value: string, throwException = false, exceptionMessage = ""): any {
        if (value === "true") {
            return true;
        }
        if (value === "false") {
            return false;
        }
        if (value === "") {
            return undefined;
        }
        if (throwException) {
            throw new Error(exceptionMessage + value);
        }
        return value;
    }

    public extractCucumberValue(value: string): string {
        if (value === "") {
            return undefined;
        }
        if (value === "null") {
            return null;
        }
        return this.removeQuotes(value);
    }

    public removeQuotes(value: string): string {
        return value.replace(/"/g, "");
    }

    public setRequestParameter(key: string, value: any): void {
        TestContext.queryParams.set(key, value);
    }

    public performHttpAction(path: string, action: Request): Promise<void> {
        TestContext.requestUri = path;
        if (TestContext.userAccessToken) {
            action.set("Authorization", "Bearer " + TestContext.userAccessToken);
        }
        return new Promise((resolve, reject) => {
            const req = action.query(TestContext.getQueryParams());
            this.logHttpRequest(req);
            req.then(
                (res: ChaiHttp.Response): void => {
                    TestContext.lastResponse = res;
                    this.logHttpResponse(res);
                    resolve();
                },
                (err: any): void => {
                    TestContext.lastResponse = err.response;
                    this.logHttpResponse(err.response);
                    resolve();
                }
            ).catch((reason: any) => {
                this.logger.error("An error occurred while performing http action on path %s : %j", path, reason);
                reject(reason);
            });
        });
    }

    public buildApiUrl(): string {
        return TestContext.basePath ? TestContext.baseUri + ":" + TestContext.basePort + TestContext.basePath : TestContext.baseUri + ":" + TestContext.basePort;
    }

    @before()
    public beforeScenario(scenario: HookScenarioResult): void {
        this.logger.info("Scenario: %j - Tag(s): %j", scenario.pickle.name, scenario.pickle.tags.map(tag => tag.name));
    }

    @after()
    public afterEach(): Promise<void> {
        return;
    }

    @given(/^the test context is initialized$/)
    public givenPlanningContextInitialized(): void {
        TestContext.reset();
    }

    @given(/^the API is up and running$/)
    public givenApiIsUpAndRunning(): Promise<void> {
        return this.givenApiIsUpAndRunningUsingEnvVars("", 5, 1);
    }

    @given(/^the API is up and running with base path ([^ "]*)$/)
    public givenApiIsUpAndRunningUsingDefault(apiBasePath: string): Promise<void> {
        return this.givenApiIsUpAndRunningUsingEnvVars(apiBasePath, 5, 1);
    }

    @given(/^the API is up and running with base path ([^"]*) \(attempting (\d+) times every (\d+) seconds\)$/)
    public async givenApiIsUpAndRunningUsingEnvVars(apiBasePath: string, limit: number, seconds: number): Promise<void> {
        TestContext.basePath = apiBasePath;
        TestContext.baseUri = process.env.API_BASE_URL || TestContext.baseUri;
        TestContext.basePort = Number(process.env.API_PORT) || TestContext.basePort;
        const apiUrl = this.buildApiUrl();
        this.logger.debug(`Built API URL = ${apiUrl}`);
        const delay = (ms: number) => {
            this.logger.debug(`Awaiting ${ms} ms for api availability...`);
            return new Promise(res => setTimeout(res, ms));
        };
        const request = () =>
            chai.request(apiUrl).get("/_health")
                .then((res) => {
                    return {
                        responseCode: res.status,
                        apiStatus: res.body.probes.filter((probe: any) => probe.name === Probes.ApiStatusProbe.NAME).pop().value
                    };
                })
                .catch((err) => err && err.status ? err.status : 500);
        for (let tryCount = 1; tryCount <= limit; tryCount++) {
            this.logger.debug(`Attempting to check API health at ${apiUrl + "/_health"}. Try %s...`, tryCount);
            const res = await request();
            if (res.responseCode === 200 && res.apiStatus === Probes.ApiStatus.RUNNING) {
                this.logger.debug(`Try "${tryCount}" succeed.`);
                TestContext.agent = chai.request(apiUrl);
                return Promise.resolve();
            }
            this.logger.debug(`Try ${tryCount} failed with response code "${res.responseCode}" and api status "${res.apiStatus}" for endpoint ${apiUrl + "/_health"}`);
            await delay(seconds * 1000);
        }
        return Promise.reject("Could not reach API within given tries.");
    }

    @when(/^I perform a GET on url "([^"]*)"$/)
    public performGetOnUrl(url: string): Promise<void> {
        return this.performHttpAction(url, chai.request(url).get(""));
    }

    @when(/^I perform a GET on path "([^"]*)"$/)
    public performGetOnPath(path: string): Promise<void> {
        return this.performHttpAction(path, TestContext.agent.get(path));
    }

    @when(/^I deliberately make this scenario crash$/)
    public crashScenario(): Promise<void> {
        return Promise.reject("Deliberate crash");
    }

    public performPostOnPath(path: string, requestBody: string): Promise<void> {
        return this.performHttpAction(
            path,
            TestContext.agent
                .post(path)
                .set("Accept", Env.DEFAULT_OUT_MEDIA_TYPE)
                .set("Content-Type", Env.DEFAULT_OUT_MEDIA_TYPE)
                .send(requestBody)
        );
    }

    public performPutOnPath(path: string, requestBody: string): Promise<void> {
        return this.performHttpAction(
            path,
            TestContext.agent
                .put(path)
                .set("Accept", Env.DEFAULT_OUT_MEDIA_TYPE)
                .set("Content-Type", Env.DEFAULT_OUT_MEDIA_TYPE)
                .send(requestBody)
        );
    }

    public performPatchOnPath(path: string, requestBody: string): Promise<void> {
        return this.performHttpAction(
            path,
            TestContext.agent
                .patch(path)
                .set("Accept", Env.DEFAULT_OUT_MEDIA_TYPE)
                .set("Content-Type", Env.DEFAULT_OUT_MEDIA_TYPE)
                .send(requestBody)
        );
    }

    public performDeleteOnPath(path: string): Promise<void> {
        return this.performHttpAction(path, TestContext.agent.del(path).set("Accept", Env.DEFAULT_OUT_MEDIA_TYPE));
    }

    @then(/^the returned status code is (\d+)$/)
    public thenTheStatusCodeIs(statusCode: number): void {
        chai.expect(TestContext.lastResponse).to.have.status(statusCode);
    }

    private logHttpRequest(req: Request): void {
        this.logger.debug("HTTP request: %s", JSON.stringify(req, null, 2));
    }

    private logHttpResponse(res: ChaiHttp.Response): void {
        this.logger.debug("HTTP response status: %s", res.status);
        if (TestContext.lastResponse.text) {
            this.logger.debug("HTTP response body: %s", JSON.stringify(JSON.parse(res.text), null, 2));
        }
    }

    @then(/^the error messages are:$/)
    public thenTheErrorMessagesAre(table: TableDefinition): Promise<void> {
        return new Promise((resolve, reject) => {
            if (TestContext.lastResponse) {
                const expectedErrors = table.hashes().map((expectedError: any) => ({
                    name: expectedError.title || undefined,
                    message: expectedError.detail || undefined
                }));
                const response = TestContext.lastResponse.body;

                if (Array.isArray(response)) {
                    const result = response.map((resultError: any) => ({
                        name: resultError.name,
                        message: resultError.message
                    }));
                    chai.expect(result.sort(this.compareError)).to.deep.equal(expectedErrors.sort(this.compareError));
                    resolve();
                } else {
                    chai.expect({
                        name: response.name,
                        message: response.message
                    }).to.deep.equal(expectedErrors[0]);
                    resolve();
                }
            } else {
                reject("No response available in test context");
            }
        });
    }

    private compareError(error1: any, error2: any): number {
        return error1.name.localeCompare(error2.name) || error1.message.localeCompare(error2.message);
    }
}

export default new BasicStepDefinitions();
