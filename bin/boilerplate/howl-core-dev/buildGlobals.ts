#!/usr/bin/node

// Note:
// this is a version of the <app-path>/src/.howl/buildGlobals.ts file
// adapted specifically to work with the test-app directory, rather
// than looking to the <project root>/src.o
//
// It is not meant to be exported out of the core development environment.
// If you are adding something here that is integral to the functionality
// of the app, you will also need to write it (or something similar)
// in the bin/boilerplate/howl/buildGlobals.ts file
//
import { DreamModel } from 'dream'
import * as fs from 'fs'
import PsychicController from '../../src/controller'
import pathifyNestedObject from '../../src/helpers/pathifyNestedObject'

export default async function buildGlobals() {
  const models = await modelIndex()
  const controllers = await controllerIndex()
  buildGlobalsFor('models', models)
  buildGlobalsFor('controllers', controllers)
}

async function buildGlobalsFor(kind: string, data: { [key: string]: any }) {
  const pathifiedData = pathifyNestedObject(data)
  const content = `\
${Object.keys(pathifiedData)
  .filter(fullPath => !/\.js$/.test(fullPath))
  .map(fullPath => {
    const construct = (pathifiedData as any)[fullPath]
    return `import ${construct.name} from '../app/${kind}/${fullPath}'`
  })
  .join('\n')}

export default {
  ${Object.keys(pathifiedData)
    .filter(fullPath => !/\.js$/.test(fullPath))
    .map(fullPath => {
      const constructor = (pathifiedData as any)[fullPath]
      return `'${fullPath}': ${constructor.name},`
    })
    .join('\n  ')}
}
`

  fs.writeFileSync(rootPath() + `/.howl/${kind}.ts`, content)
}

async function controllerIndex() {
  return await buildRecursiveIndex<typeof PsychicController>('controllers')
}

async function modelIndex(nestedPath = '') {
  return await buildRecursiveIndex<DreamModel<any, any>>('models')
}

interface RecursiveObject<T> {
  [key: string]: T | RecursiveObject<T>
}
async function buildRecursiveIndex<T>(kind: string, nestedPath = '') {
  const sanitizedFullNestedPath = nestedPath.replace(/\/$/, '')
  const kindPath = rootPath() + `/app/${kind}${nestedPath ? `/${sanitizedFullNestedPath}` : ''}`
  const kindFiles = fs.readdirSync(kindPath)
  const kindIndex: RecursiveObject<T> = {}

  let currentDir = kindPath
  for (const file of kindFiles) {
    if (fs.lstatSync(currentDir + '/' + file).isDirectory()) {
      kindIndex[file] = await buildRecursiveIndex(kind, `${nestedPath}/${file}`)
    } else {
      const importedFile = await import(kindPath + '/' + file)
      const key = file.replace(/\.ts$/, '')
      kindIndex[key] = importedFile.default as T
    }
  }

  return kindIndex
}

function rootPath() {
  if (process.env.CORE_DEVELOPMENT === '1') {
    return `${process.cwd()}/test-app`
  } else {
    return process.cwd()
  }
}

buildGlobals()
