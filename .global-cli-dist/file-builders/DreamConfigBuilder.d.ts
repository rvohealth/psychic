import { NewAppCLIOptions } from '../helpers/gatherUserInput';
export default class DreamConfigBuilder {
    static build(opts: {
        appName: string;
        userOptions: NewAppCLIOptions;
    }): Promise<string>;
}
