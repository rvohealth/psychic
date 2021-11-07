import Boot from 'src/psychic/boot'

export default async function rebootApp() {
  await new Boot('tmp/integrationtestapp', { pkgPath: 'tmp/integrationtestapp/.dist' }).boot()
}
