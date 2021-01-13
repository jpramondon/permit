import { Loggers } from "@gearedminds/ts-commons";
import { Middlewares } from "@gearedminds/tsed-api-support";
import { GlobalAcceptMimesMiddleware, ServerLoader, ServerSettings } from "@tsed/common";
import "@tsed/swagger";
// const cookieParser = require('cookie-parser');
import * as bodyParser from "body-parser";
import * as compress from "compression";
import * as methodOverride from "method-override";
import * as path from "path";

const rootDir = path.normalize(__dirname + "/../../../src");

@ServerSettings({
    logger: { level: "debug" },
    rootDir,
    mount: {
        '/': `${rootDir}/controllers/*.ts`
    },
    swagger: ([{ path: "/spec", outFile: path.resolve(rootDir, "./swagger.json") }]),
    acceptMimes: ["application/json"]
})
export class Server extends ServerLoader {

    private logger = Loggers.getLogger("Server");

    public $beforeRoutesInit(): void | Promise<any> {
        this
            .use(GlobalAcceptMimesMiddleware)
            //.use(cookieParser())
            .use(compress({}))
            .use(methodOverride())
            .use(bodyParser.json())
            .use(bodyParser.urlencoded({
                extended: true
            }));
        this.use(require("cors")());
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