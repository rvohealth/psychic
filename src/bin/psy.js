#!/usr/bin/env node

import path from 'path'
import spawn from 'src/helpers/spawn'
console.log(
  "GDHJSGDJHSGDJSGDHGSHJDGSJHGDHJSGDJHSGDHJSGDJGHS",
  process.argv,
  process.argv.slice(2),
  process.env.INIT_CWD,
)
// spawn(`cd ${path.resolve(__dirname, '../../')} && ORIGINAL_CWD=${process.env.INIT_CWD} yarn run psy ${process.argv.slice(2).join(' ')}`, [], { shell: true, stdio: 'inherit' })
