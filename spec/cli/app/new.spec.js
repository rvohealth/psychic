import { jest } from '@jest/globals'
import File from 'src/helpers/file'
import Dir from 'src/helpers/dir'
import NewAppProgram from 'src/cli/program/new-app'
import * as exec from 'src/helpers/exec'

let execSpy
const ORIGINAL_PWD = 'tmp/spec/new-app'
const APP_PATH = `${ORIGINAL_PWD}/fishman`
const EXPECTED_FILES = [
  '.env.development',
  '.env.test',
  '.eslintrc.json',
  '.gitignore',
  'README.md',
  'babel.config.js',
  'jest.config.json',
  'jest.stories.config.json',
  'jsconfig.json',
  'log/.gitkeep',
  'package.json',
  'public/index.html',
  'spec/spec-hooks.js',
  'spec/channels/.gitkeep',
  'spec/dreams/.gitkeep',
  'spec/projections/.gitkeep',
  'spec/stories/.gitkeep',
  'src/App.js',
  'storage/.gitkeep',
  'tmp/migrate/.gitkeep',
  'yarn.lock',
]

const REQUIRED_DEVELOPMENT_ENV_STRINGS = [
  'NODE_ENV=development',
  'PSYCHIC_ENV=development',
  'PSYCHIC_SECRET=development_secret_123',
  'DB_NAME=fishman',
  'DB_USERNAME',
  'DB_PASSWORD',
]

const REQUIRED_TEST_ENV_STRINGS = [
  'NODE_ENV=test',
  'PSYCHIC_ENV=test',
  'PSYCHIC_SECRET',
  'DB_NAME=fishman_test',
  'DB_USERNAME',
  'DB_PASSWORD',
  'TWILIO_SMS_PHONE',
  'TWILIO_SID=AC', // twilio SID must begin with "AC"
  'TWILIO_AUTH_TOKEN',
  'TWILIO_AUTH_TOKEN',
  'GMAIL_AUTH_USERNAME',
  'GMAIL_AUTH_PASSWORD',
]

const REQUIRED_PACKAGES = {
  "@babel/cli": "^7.13.0",
  "@babel/core": "^7.13.0",
  "@babel/eslint-parser": "^7.13.0",
  "@babel/node": "^7.13.0",
  "@babel/plugin-proposal-async-do-expressions": "^7.13.0",
  "@babel/plugin-proposal-do-expressions": "^7.13.0",
  "@babel/plugin-transform-runtime": "^7.13.0",
  "@babel/plugin-syntax-jsx": "^7.12.17",
  "@babel/preset-env": "^7.13.0",
  "@babel/preset-react": "^7.13.0",
  "@reduxjs/toolkit": "^1.5.1",
  "@testing-library/jest-dom": "^4.2.4",
  "@testing-library/react": "^9.3.2",
  "@testing-library/user-event": "^7.1.2",
  "react": "^17.0.2",
  "react-dom": "^17.0.2",
  "react-redux": "^7.2.3",
  "react-scripts": "4.0.3",
  "axios": "^0.21.1",
  "babel-plugin-module-resolver": "^4.1.0",
  "babel-plugin-require-context-hook": "^1.0.0",
  "psychic": "git+ssh://git@github.com/avocadojesus/psychic.git#dev",
}

const REQUIRED_DEV_PACKAGES = {
  "coveralls": "^3.0.0",
  "husky": "^7.0.2",
  "jest": "27.3.0",
  "jest-date": "^1.1.4",
  "jest-plugin-context": "^2.9.0",
  "nyc": "^14.1.1",
}

jest.setTimeout(60 * 1000)

describe('cli program app:new', () => {
  context ('with name specified', () => {
    beforeEach(async () => {
      await Dir.rmIfExists(ORIGINAL_PWD)
      await Dir.mkdir(ORIGINAL_PWD)
      process.env.ORIGINAL_PWD = ORIGINAL_PWD
      execSpy = jest.spyOn(exec, 'default').mockImplementation(async () => true)

      const newAppProgram = new NewAppProgram()
      await newAppProgram.new({ args: ['fishman'] })
    })

    afterEach(async () => {
      await Dir.rm(ORIGINAL_PWD)
      process.env.ORIGINAL_PWD = null
    })

    it ('combines psychic base framework with new react app', async () => {
      for (const file of EXPECTED_FILES) {
        try {
          expect(await File.exists(`${APP_PATH}/${file}`)).toBe(true)
        } catch(error) {
          throw new Error(`missing required file: ${file}`)
        }
      }

      for (const str of REQUIRED_DEVELOPMENT_ENV_STRINGS) {
        try {
          expect(await File.contains(`${APP_PATH}/.env.development`, str)).toBe(true)
        } catch(error) {
          const str = await File.read(`${APP_PATH}/.env.development`)
          console.log(str.toString())
          throw new Error(`missing required .env.development const: ${str}}`)
        }
      }

      for (const str of REQUIRED_TEST_ENV_STRINGS) {
        try {
          expect(await File.contains(`${APP_PATH}/.env.test`, str)).toBe(true)
        } catch(error) {
          const str = await File.read(`${APP_PATH}/.env.test`)
          console.log(str.toString())
          throw new Error(`missing required .env.test const: ${str}`)
        }
      }

      expect(await File.exists(`${APP_PATH}/src/psy/index.js`)).toBe(true)
      expect(await File.exists(`${APP_PATH}/src/psy/net/common.js`)).toBe(true)
      expect(await File.exists(`${APP_PATH}/src/psy/singletons/io.js`)).toBe(true)

      const pkgjson = JSON.parse((await File.read(`${APP_PATH}/package.json`)))
      for (const key in REQUIRED_PACKAGES) {
        try {
          expect(pkgjson.dependencies[key]).toEqual(REQUIRED_PACKAGES[key])
        } catch (error) {
          throw new Error(`Missing package ${key} at version ${REQUIRED_PACKAGES[key]}. Received: \n ${JSON.stringify(pkgjson.dependencies)}`)
        }
      }

      for (const key in REQUIRED_DEV_PACKAGES) {
        try {
          expect(pkgjson.devDependencies[key]).toEqual(REQUIRED_DEV_PACKAGES[key])
        } catch (error) {
          throw new Error(`Missing package ${key} at version ${REQUIRED_DEV_PACKAGES[key]}. Received: \n ${JSON.stringify(pkgjson.devDependencies)}`)
        }
      }

      expect(execSpy).toHaveBeenCalledWith(`cd ${APP_PATH} && yarn add babel-eslint eslint-config-react-app babel-plugin-module-resolver -D`)
      expect(execSpy).toHaveBeenCalledWith(`cd ${APP_PATH} && yarn add axios socket.io-client --silent`)
      expect(execSpy).toHaveBeenCalledWith(`cd ${APP_PATH} && yarn install --silent`)
      expect(execSpy).toHaveBeenCalledWith(`cd ${APP_PATH} && yarn run psybuild`)
    })
  })
})

