#!/usr/bin/env node

import path from 'path'
import spawn from 'src/helpers/spawn'
spawn(`cd ${path.resolve(__dirname, '../../')} && yarn run psy`, [], { shell: true, stdio: 'inherit' })
