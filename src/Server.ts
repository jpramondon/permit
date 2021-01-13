import { Config } from "@gearedminds/ext-conf";
import { Middlewares } from "@gearedminds/tsed-api-support";
import { Env, Loggers } from "@gearedminds/ts-commons";
import { GlobalAcceptMimesMiddleware, ServerLoader, ServerSettings, $log } from "@tsed/common";
import "@tsed/swagger";
// const cookieParser = require('cookie-parser');
import * as bodyParser from "body-parser";
import * as compress from "compression";
import * as methodOverride from "method-override";
import * as path from "path";
import { AccessControlMiddleware } from "./middlewares/AccessControlMiddleware";
import { MuteAllRoutesMiddleware } from "./middlewares/MuteAllRoutesMiddleware";

const rootDir = __dirname;
const correlator = require('express-correlation-id');

@ServerSettings({
    rootDir,
    // port: process.env.API_PORT,
    // httpsPort: process.env.API_HTTPS_PORT,
    mount: {
        '/': `${rootDir}/controllers/*.ts`
    },
    swagger: ([{ path: "/spec", outFile: path.resolve(rootDir, "./swagger.json") }]),
    acceptMimes: ["application/json"]
})
export class Server extends ServerLoader {

    private logger = Loggers.getLogger("Server");

    constructor() {
        super();
        // The real place for a setSettings call is the constructor
        if (!Env.isNodeDevEnvironment()) {
            this.setSettings({ logger: { level: "info", logRequest: false } });
            $log.appenders.set("stdout", Loggers.jsonAppenderConf);
        } else {
            this.setSettings({ logger: { level: "debug" } });
        }
    }

    public $beforeRoutesInit(): void | Promise<any> {
        this.setSettings({
            accessControlMW_oauthServiceURL: Config.getConfItem("OAUTH2_URL"),
            accessControlMW_enabled: Config.getConfItem("IS_ACCESS_CONTROL_MIDDLEWARE_ENABLED"),
            accessControlMW_unprotectedPaths: Config.getConfItem("UNPROTECTED_PATHS"),
            isMuteAllRoutesMiddlewareEnabled:
                (Config.getConfItem("IS_MUTE_ALL_ROUTES_MIDDLEWARE_ENABLED") ?
                    Config.getConfItem("IS_MUTE_ALL_ROUTES_MIDDLEWARE_ENABLED") as boolean :
                    true)
        });
        this
            .use(GlobalAcceptMimesMiddleware)
            .use(correlator({ header: "X-B3-TraceId" }))
            //.use(cookieParser())
            .use(compress({}))
            .use(methodOverride())
            .use(bodyParser.json())
            .use(bodyParser.urlencoded({
                extended: true
            }));
        if (Env.isNodeDevEnvironment()) {
            this.use(require("cors")());
        }
        this.use(MuteAllRoutesMiddleware);
        this.use(AccessControlMiddleware);
        return null;
    }

    public $afterRoutesInit() {
        this.use(Middlewares.ErrorTranslationMiddleware);
        this.use(Middlewares.NotFoundMiddleware);
    }

    public $onReady(): void {
        this.logger.info("Express instance started...");
        // $log.level = "info";
    }

    public $onServerInitError(err: any): void {
        this.logger.error(err);
    }

}