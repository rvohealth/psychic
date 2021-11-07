import '.dist/psychic/boot/globals/repl'
import '.dist/psychic/boot/all'
import '.dist/app/pkg/repl.pkg'
import config from 'src/config'
import Boot from 'src/psychic/boot'
import File from 'src/helpers/file'

async function loadRepl() {
  const ascii = await File.text(`${config.psychicPath}src/psychic/boot/ascii/small.txt`)
  new Boot('.dist', { pkgPath: '.dist' }).boot()

  console.log(ascii)
  console.log(`-------------------`)
  console.log('psychic version 0.0')
  console.log(`-------------------`)
}

loadRepl()
