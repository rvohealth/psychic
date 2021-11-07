import File from 'src/helpers/file'

class PkgjsonBuilder {
  static async build(path) {
    const pkgjson = JSON.parse((await File.read(path + '/package.json')))

    pkgjson.dependencies = {
      ...pkgjson.dependencies,
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
      "axios": "^0.21.1",
      "babel-plugin-module-resolver": "^4.1.0",
      "babel-plugin-require-context-hook": "^1.0.0",
      "nested-combine-reducers": "^2.0.0",
      "psychic": "git+ssh://git@github.com/avocadojesus/psychic.git#dev",
      "react": "^17.0.2",
      "react-dom": "^17.0.2",
      "react-redux": "^7.2.3",
      "react-scripts": "4.0.3",
    }

    pkgjson.devDependencies = {
      ...pkgjson.devDependencies,
      "coveralls": "^3.0.0",
      "husky": "^7.0.2",
      "jest": "27.3.0",
      "jest-date": "^1.1.4",
      "jest-plugin-context": "^2.9.0",
      "jest-puppeteer": "^6.0.0",
      "nyc": "^14.1.1",
      "puppeteer": "^10.4.0",
      "puppeteer-core": "^10.4.0",
      "tree-kill": "^1.2.2"
    }

    pkgjson.main = 'node_modules/psychic/.dist/index.js'

    pkgjson.scripts.psy = "NODE_PATH=. npm run psybuild && " +
      "clear && " +
      "NODE_PATH=. node ./.dist/bin/psy.js"

    pkgjson.scripts.trance = "NODE_PATH=. npm run psybuild && " +
      "clear && " +
      "NODE_PATH=. node -i --experimental-repl-await -e 'require(\"./node_modules/psychic/.dist/psychic/boot/app/index.js\")'"

    pkgjson.scripts.prepare = null

    pkgjson.scripts.psybuild =
      "NODE_PATH=./node_modules/psychic/ node ./node_modules/psychic/.dist/make/for-app.js && " +
      "NODE_PATH=. ./node_modules/.bin/babel app -d .dist/app --copy-files &&" +
      "NODE_PATH=. ./node_modules/.bin/babel db -d .dist/db --copy-files &&" +
      "NODE_PATH=. ./node_modules/.bin/babel config -d .dist/config --copy-files &&" +
      "NODE_PATH=. ./node_modules/.bin/babel bin -d .dist/bin --copy-files &&" +
      "NODE_PATH=./node_modules/psychic/ ./node_modules/psychic/node_modules/.bin/babel app -d .dist/app --copy-files && " +
      "NODE_PATH=./node_modules/psychic/ ./node_modules/psychic/node_modules/.bin/babel config -d .dist/config --copy-files && " +
      "./node_modules/psychic/node_modules/.bin/babel app -d .dist/app --copy-files &&" +
      "./node_modules/psychic/node_modules/.bin/babel config -d .dist/config --copy-files"

    // pkgjson.scripts.buildspec = "NODE_PATH=. node ./make/for-core-specs.js && NODE_PATH=. ./node_modules/.bin/babel src -d .dist --copy-files && NODE_PATH=. ./node_modules/.bin/babel spec/support/testapp -d .dist/testapp --copy-files"
    pkgjson.scripts.buildspec = "NODE_PATH=. ./node_modules/.bin/babel src -d .dist --copy-files && NODE_PATH=. ./node_modules/.bin/babel app -d .dist/app --copy-files"

    pkgjson.scripts.test = "NODE_PATH=. npm run psybuild && " +
      "clear && " +
      "npm run buildspec && NODE_PATH=. node --experimental-vm-modules ./node_modules/.bin/jest --config ./jest.config.json --runInBand --detectOpenHandles"

    pkgjson.scripts.stories = "NODE_PATH=. npm run psybuild && " +
      "clear && " +
      "npm run buildspec && " +
      "NODE_PATH=. node --experimental-vm-modules ./node_modules/.bin/jest --config ./jest.stories.config.json --runInBand --forceExit"

    return pkgjson
  }

  static async write(path) {
    const newPkgjson = await this.build(path)
    await File.write(path + '/package.json', JSON.stringify(newPkgjson, null, 2))
  }
}

export default PkgjsonBuilder
