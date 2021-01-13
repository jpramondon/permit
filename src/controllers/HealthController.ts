import { Config } from "@gearedminds/ext-conf";
import { Env, Errors } from "@gearedminds/ts-commons";
import { ProbeFactory, Probes } from "@gearedminds/tsed-api-support";
import { Controller, Get } from "@tsed/common";
import { Name, Operation } from "@tsed/swagger";
import SequelizeManager from "../persistence/SequelizeManager";

@Controller("/_health")
@Name("Health")
export class HealthController {

    @Get("/")
    @Operation({ operationId: "Check Health" })
    async checkHealth(): Promise<Probes.HealthProbeResponse> {
        let version;
        try {
            version = Env.getVersion();
        } catch (error) {
            throw new Errors.TechnicalError(`Unable to access API version: ${error}`);
        }
        const result: Probes.HealthProbeResponse = {
            version,
            probes: [],
            status: "OK"
        };
        const mockMode = Config.getConfItem("MOCK_MODE") as boolean ?? false;
        if (!mockMode) {
            return Promise.all([
                ProbeFactory.getApiStatusProbe(),
                ProbeFactory.getDbPingProbe(() => SequelizeManager.ping())
            ])
                .then(arrayOfProbes => {
                    result.probes.push(...arrayOfProbes);
                    return result;
                });
        } else {
            return result;
        }
    }

}