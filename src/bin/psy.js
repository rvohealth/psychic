#!/usr/bin/env node

import spawn from 'src/helpers/spawn'
spawn(`yarn run psy`, [], { shell: true, stdio: 'inherit' })
