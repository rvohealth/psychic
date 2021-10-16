#!/usr/bin/env node

import path from 'path'
import spawn from 'src/helpers/spawn'
spawn(`cd ${path.resolve(__dirname, '../../')} && ORIGINAL_PWD=${process.env.PWD} yarn run psy ${process.argv.slice(2).join(' ')}`, [], { shell: true, stdio: 'inherit' })
