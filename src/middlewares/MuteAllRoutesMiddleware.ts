import { Loggers } from "@gearedminds/ts-commons";
import { Constant, Middleware, Req, Res } from "@tsed/common";

@Middleware()
export class MuteAllRoutesMiddleware {

    private logger = Loggers.getLogger("MuteAllRoutesMiddleware");

    @Constant("isMuteAllRoutesMiddlewareEnabled")
    isMuteAllRoutesMiddlewareEnabled: boolean;
    private static active = true;

    use(@Req() request: Req, @Res() response: Res) {
        const path = request.path;
        this.logger.debug(`Should path ${path} be muted (if not (_health)) ? ${MuteAllRoutesMiddleware.active && this.isMuteAllRoutesMiddlewareEnabled}`);
        if (this.isMuteAllRoutesMiddlewareEnabled && MuteAllRoutesMiddleware.active) {
            if (path !== "/_health") {
                response.status(503);
                response.send();
            }
        }
        return;
    }

    public static unMute() {
        this.active = false;
    }

}