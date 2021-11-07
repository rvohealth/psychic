import File from 'src/helpers/file'

const template =
`
async () => {
  await File.write('tmp/coolidge.js', 'console.log("coolidge")')
}
`

export default async function psyEval(func) {
  // const fn = new Function('return ' + func.toString())()
  // await fn()
  await File.write('tmp/integrationtestapp/hi.js', template)
  // await File.write('tmp/integrationtestapp/tmp/__integration-psy-eval-tmp-script.js', func.toString())
  // await File.text('tmp/integrationtestapp/tmp/__integration-psy-eval-tmp-script.js')
  await runPsyCommand(`psy run hi.js`)
  // console.log(`export default ` + func.toString())
}
