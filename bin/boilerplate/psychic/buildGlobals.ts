#!/usr/bin/node

import { DreamModel } from 'dream'
import { PsychicController, pathifyNestedObject } from 'psychic'
import * as fs from 'fs'

export default async function buildGlobals() {
  const models = await modelIndex()
  const controllers = await controllerIndex()
  buildGlobalsFor('models', models)
  buildGlobalsFor('controllers', controllers)
}

async function buildGlobalsFor(kind: string, data: { [key: string]: any }) {
  const pathifiedData = pathifyNestedObject(data) as { [key: string]: any }
  const content = `\
${(Object.keys(pathifiedData) as any[])
  .filter(fullPath => /\.ts$/.test(fullPath))
  .map(fullPath => {
    const construct = (pathifiedData as any)[fullPath]
    return `import ${construct.name} from '../app/${kind}/${fullPath}'`
  })
  .join('\n')}

export default {
  ${(Object.keys(pathifiedData) as any[])
    .filter(fullPath => /\.ts$/.test(fullPath))
    .map(fullPath => {
      const constructor = (pathifiedData as any)[fullPath]
      return `'${fullPath}': ${constructor.name},`
    })
    .join('\n  ')}
}
`

  fs.writeFileSync(rootPath() + `/.psy/${kind}.ts`, content)
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
  console.log('KIND PATH:', kindPath)
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
  return process.cwd() + '/../../src'
}

buildGlobals()
