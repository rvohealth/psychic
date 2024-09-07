import { NewAppCLIOptions } from '../helpers/gatherUserInput';
export default class AppConfigBuilder {
    static build(opts: {
        appName: string;
        userOptions: NewAppCLIOptions;
    }): Promise<string>;
}
