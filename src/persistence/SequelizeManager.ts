import { AbstractSequelizeManager, ConnectionOptions } from "@gearedminds/ts-commons";
import { initApplicationPreferenceModel, initApplicationRoleModel } from "./Models";

class SequelizeManager extends AbstractSequelizeManager {

    public connect(options: ConnectionOptions): Promise<void> {
        return super.connect(options).then( () => {
            this.initModels();
        });
    }

    protected initModels(): Promise<void> {
        this.logger.info("Sequelize models initialization");
        initApplicationRoleModel(this.sequelize);
        initApplicationPreferenceModel(this.sequelize);
        return;
    }
}

export default new SequelizeManager();