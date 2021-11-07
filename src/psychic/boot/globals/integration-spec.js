import spawn from 'src/helpers/spawn'
import Dir from 'src/helpers/dir'
import File from 'src/helpers/file'

async function goto(url) {
  await page.goto(url)
}

async function resetIntegrationApp() {
  const dirsToReplace = [
    'app',
    'config',
  ]

  for (const dir of dirsToReplace) {
    await Dir.rm(`tmp/integrationtestapp/${dir}`)
    await Dir.copy(`template/psychic-app/${dir}`, `tmp/integrationtestapp/${dir}`)
  }

  await File.rm('tmp/integrationtestapp/src/App.js')
  await Dir.copy('template/psychic-app/js/App.js', 'tmp/integrationtestapp/src/App.js')

  const srcDirsToReplace = [
    'components',
  ]

  for (const dirName of srcDirsToReplace) {
    await Dir.rm(`tmp/integrationtestapp/src/${dirName}`)
    await Dir.copy(`template/psychic-app/js/${dirName}`, `tmp/integrationtestapp/src/${dirName}`)
  }
}

async function runPsyCommand(command, opts={}) {
  await spawn(
    `npm run ${command}`,
    [],
    {
      shell: true,
      stdio: 'inherit',
      cwd: 'tmp/integrationtestapp',
      env: {
        ...process.env,
        CORE_INTEGRATION_TEST: true,
      },
      ...opts,
    }
  )
}

async function swapIntegrationFiles(path) {
  const files = await Dir.read(path, { onlyFiles: true })
  for (const file of files) {
    await File.rm(`tmp/integrationtestapp/${file}`)
    await File.copy(`${path}/${file}`, `tmp/integrationtestapp/${file}`)
  }

  //TODO: simplify with recursion
  const dirs = await Dir.read(path, { onlyDirs: true })
  for (const dir of dirs) {
    const files = await Dir.read(`${path}/${dir}`, { onlyFiles: true })
    for (const file of files) {
      await File.rm(`tmp/integrationtestapp/${dir}/${file}`)
      await File.copy(`${path}/${dir}/${file}`, `tmp/integrationtestapp/${dir}/${file}`)
    }

    const nestedDirs = await Dir.read(`${path}/${dir}`, { onlyDirs: true })
    for (const nestedDir of nestedDirs) {
      const files = await Dir.read(`${path}/${dir}/${nestedDir}`, { onlyFiles: true })
      for (const file of files) {
        await File.rm(`tmp/integrationtestapp/${dir}/${nestedDir}/${file}`)
        await File.copy(`${path}/${dir}/${nestedDir}/${file}`, `tmp/integrationtestapp/${dir}/${nestedDir}/${file}`)
      }
    }
  }
}

async function transpile() {
  await spawn(`npm run buildintspec`, [], { shell: true, stdio: 'inherit' })
}

async function find(text) {
  let button
  try {
    [button] = await page.$x(`//button[contains(text(), '${text}')]`)
  } catch {
    throw 'Failed to find button'
  }

  console.log(button)
  return button
}

async function click(selector, opts) {
  try {
    await page.click(selector, opts)
  } catch {
    await clickByText(selector)
  }
}

async function fillIn(selector, text) {
  try {
    await page.focus(selector)
  } catch {
    await page.focus(`input[name=${selector}]`)
  }

  await page.keyboard.type(text)
}




const escapeXpathString = str => {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
}

async function clickByText(text, { elementType }={}) {
  const escapedText = escapeXpathString(text)
  const linkHandlers = await page.$x(`//${elementType || 'button'}[contains(text(), ${escapedText})]`)

  if (linkHandlers.length > 0) {
    await linkHandlers[0].click()
  } else {
    throw new Error(`Link not found: ${text}`)
  }
}



global.click = click
global.fillIn = fillIn
global.find = find
global.goto = goto
global.baseUrl = 'http://localhost:33333'
global.resetIntegrationApp = resetIntegrationApp
global.runPsyCommand = runPsyCommand
global.swapIntegrationFiles = swapIntegrationFiles
global.transpile = transpile
