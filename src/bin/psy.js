#!/usr/bin/env node

import path from 'path'
import spawn from 'src/helpers/spawn'
console.log(
  "GDHJSGDJHSGDJSGDHGSHJDGSJHGDHJSGDJHSGDHJSGDJGHS",
  process.argv,
  process.argv.slice(2),
  'init: ' + process.env.INIT_CWD || "nil",
)
// spawn(`cd ${path.resolve(__dirname, '../../')} && ORIGINAL_CWD=${process.env.INIT_CWD} yarn run psy ${process.argv.slice(2).join(' ')}`, [], { shell: true, stdio: 'inherit' })
