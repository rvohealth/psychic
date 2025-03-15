#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import '../conf/loadEnv'

import { Command } from 'commander'
import { PsychicCLI } from '../../../src.js'
import seedDb from '../db/seed.js'
import initializePsychicApplication from './helpers/initializePsychicApplication.js'

const program = new Command()

PsychicCLI.provide(program, {
  initializePsychicApplication,
  seedDb,
})

program.parse(process.argv)
