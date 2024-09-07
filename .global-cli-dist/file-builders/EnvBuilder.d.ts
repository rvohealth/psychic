export default class EnvBuilder {
    static build({ env, appName }: {
        env: 'test' | 'development' | 'production';
        appName: string;
    }): string;
}
