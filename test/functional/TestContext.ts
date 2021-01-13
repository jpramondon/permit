import { Config, ConfigOptions } from "@gearedminds/ext-conf";

const options = new ConfigOptions();
options.stripScope = true;
Config.init(options);

class TestContext {
    public baseUri: string;
    public basePort: number;
    public basePath: string;
    public lastResponse: ChaiHttp.Response;
    public agent: ChaiHttp.Agent;
    public pathParams: Map<string, string>;
    public queryParams: Map<string, any>;
    public queryRawParams: string[];
    public requestUri: string;
    public requestBody: string;
    public userAccessToken: string;

    constructor() {
        this.init();
    }

    public reset(): void {
        this.init();
    }

    public hashToObject<T>(type: { new(): T }, hash: any): T {
        const n: T = new type();
        Object.assign(n, hash);
        return n;
    }

    private init(): void {
        this.baseUri = "http://localhost";
        this.basePort = 8080;
        this.lastResponse = undefined;
        this.pathParams = new Map();
        this.queryParams = new Map();
        this.queryRawParams = [];
        this.requestUri = "";
        this.requestBody = "";
        this.userAccessToken = "";
    }

    public getQueryParams(): any {
        const params: QueryParams = {};
        this.queryParams.forEach((value: string, key: string): void => {
            params[key] = value;
        });
        return params;
    }
}

interface QueryParams {
    [key: string]: string;
}

export default new TestContext();
