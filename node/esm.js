/*
 * A note about this file:
 *
 * previously, when using the node command to load typescript, you could
 * specify the --loader=ts-node/esm option to use ts-node to load your project.
 *
 * This still works, but it raises a warning in node now, indicating that the
 * --loader argument is experimental, and could be replaced in future versions.
 *
 * To get around this, you can manually add a file to your project to accomplish the
 * same thing, and then import it in your node command, which is what we are now doing
 * in our package.json file:
 *
 * node --experimental-specifier-resolution=node --import=./node/esm.js ./test-app/cli/index.ts
 * */
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

register('ts-node/esm', pathToFileURL('./'))
