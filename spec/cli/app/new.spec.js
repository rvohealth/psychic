import { jest } from '@jest/globals'
import File from 'src/helpers/file'
import NewAppProgram from 'src/cli/program/new-app'
import * as exec from 'src/helpers/exec'
import l from 'src/singletons/l'

let execSpy

describe('cli program app:new', () => {
  context ('with name specified', () => {
    beforeEach(async () => {
      jest.mock('src/helpers/file')
      jest.spyOn(l, 'logStatus').mockImplementation(() => {})
      execSpy = jest.spyOn(exec, 'default').mockImplementation(async () => true)

      const packageJson = {
        scripts: {},
        dependencies: {},
        devDependencies: {},
      }

      File.copy = jest.fn()
      File.rm = jest.fn()
      File.write = jest.fn()
      File.read = jest.fn().mockImplementation(async () => JSON.stringify(packageJson))

      const newAppProgram = new NewAppProgram()
      await newAppProgram.new({ args: ['fishman'] })
    })

    it ('creates a new app with the specified name, assuming postgres db', async () => {
      expect(execSpy).toHaveBeenCalledWith(`npx create-react-app ../fishman --template redux --silent`)

      expect(File.copy).toHaveBeenCalledWith('src/template', '../fishman')
      expect(File.copy).toHaveBeenCalledWith('../fishman/js', '../fishman/src/')
      expect(File.rm).toHaveBeenCalledWith('../fishman/js')

      expect(execSpy).toHaveBeenCalledWith(`cd ../fishman && yarn add babel-eslint eslint-config-react-app -D`)
      expect(execSpy).toHaveBeenCalledWith(`cd ../fishman && yarn add axios socket.io-client --silent`)
      expect(execSpy).toHaveBeenCalledWith(`cd ../fishman && yarn install --silent`)

      expect(File.copy).toHaveBeenCalledWith('./', '../fishman/node_modules/psychic')

      expect(execSpy).toHaveBeenCalledWith(`cd ../fishman/node_modules/psychic && yarn install --silent`)

      expect(File.copy).toHaveBeenCalledWith('./.babelrc', '../fishman/.babelrc')
    })
  })
})

