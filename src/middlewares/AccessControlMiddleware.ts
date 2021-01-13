import { Loggers } from "@gearedminds/ts-commons";
import { Constant, Middleware, Req, Res } from "@tsed/common";
import { get } from "request-promise-native";
import PermissionService from "../services/PermissionService";

@Middleware()
export class AccessControlMiddleware {

    private logger = Loggers.getLogger("AccessControlMiddleware");

    @Constant("accessControlMW_enabled")
    enabled: boolean;
    @Constant("accessControlMW_oauthServiceURL")
    oAuth2URL: string;
    @Constant("accessControlMW_unprotectedPaths")
    unprotectedPaths: string[];

    use(@Req() request: Req, @Res() response: Res) {
        const path = request.path;
        const method = request.method;
        this.logger.debug(`Authentication check on path ${path}`);
        const authToken = request.header("Authorization");
        if (method === "OPTIONS") {
            this.logger.debug("OPTIONS methods do not require any authentication check");
            this.traceAuthToken(authToken);
            return;
        } else if (this.unprotectedPaths && this.unprotectedPaths.indexOf(path) >= 0) {
            this.logger.debug("Requests to unprotected paths and do not require any authentication check");
            this.traceAuthToken(authToken);
            return;
        } else if (!this.enabled) {
            this.logger.debug("Access middleware disabled. No access control check required.");
            this.traceAuthToken(authToken);
            response.locals.permissions = [{
                role: "ROLE_ADMIN"
            }];
            return;
        } else {
            if (authToken) {
                const decodedAuthToken = this.decodeUserToken(authToken);
                if (decodedAuthToken) {
                    return this.introspectUserToken(this.oAuth2URL, decodedAuthToken.payload)
                        .then((parsedToken: any) => {
                            if (parsedToken) {
                                this.logger.debug("User token introspection validated !");
                                if (parsedToken.email) {
                                    return PermissionService.searchPermissions("Permit", parsedToken.email)
                                        .then(perms => {
                                            response.locals.permissions = perms.permissions;
                                            return perms.permissions.some(perm => perm.role.startsWith("ROLE_ADMIN"));
                                        })
                                        .then(hasRole => {
                                            if (hasRole) {
                                                this.logger.info("User was granted access to this endpoint / route / path.");
                                                return;
                                            } else {
                                                this.logger.info("User is not allowed to access to this endpoint / route / path.");
                                                response.status(403);
                                                response.send();
                                            }
                                        })
                                        .catch( error => {
                                            this.logger.error(`The user's permissions could not be resolved due to an error: ${error}`);
                                            response.status(403);
                                            response.send();
                                        });
                                } else {
                                    this.logger.error("Bad token returned by introspection. Token does not have an email field ...");
                                    response.status(400);
                                    response.send();
                                }
                                return;
                            } else {
                                this.logger.info("User token not active.");
                                response.status(401);
                                response.send();
                            }
                        })
                        .catch((reason) => {
                            // Error while trying to introspect the shit
                            this.logger.error(reason);
                            response.status(401);
                            response.send();
                        });
                } else {
                    this.logger.error("Bad authentication user token provided. Rejecting call ...");
                    response.status(400);
                    response.send();
                }
            } else {
                this.logger.error("No authentication user token provided. Rejecting call ...");
                response.status(401);
                response.send();
            }
        }
    }

    private traceAuthToken(token: string): void {
        if (token) {
            const decodedToken = this.decodeUserToken(token);
            this.logger.debug(`Authorization header was provided anyway ${JSON.stringify(decodedToken)}`);
        }
    }

    private decodeUserToken(token: string): IJsonWebToken {
        const tokenBits = token.split(" ");
        switch (tokenBits.length) {
            case 1:
                return { payload: tokenBits[0].trim() };
            case 2:
                return { payload: tokenBits[1].trim(), header: tokenBits[0].trim() };
            default:
                return null;
        }
    }

    private introspectUserToken(oAuth2URL: string, token: string): Promise<any> {
        this.logger.debug("Authentication user token needs to be introspected");
        return get(`${oAuth2URL}/tokeninfo?access_token=${token}`, {})
            .then((data: any) => {
                const parsedResponse = JSON.parse(data);
                if (parsedResponse.expires_in !== undefined && parsedResponse.expires_in > 0) {
                    return parsedResponse;
                }
                return undefined;
            });
    }
}
interface IJsonWebToken {
    payload: string;
    header?: string;
}