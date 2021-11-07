import File from 'src/helpers/file'
import config from 'src/config'

export default class GenerateSignInComponent {
  static async generate(dreamName, namespace, keyField, passwordField) {
    const apiName = `${dreamName.camelize().pluralize()}API`

    const template =
`\
import React, { useState } from 'react'
import psy from 'psy'

export default function SignIn() {
  const [ ${keyField}, set${keyField.pascalize()} ] = useState('')
  const [ ${passwordField}, set${passwordField.pascalize()} ] = useState('')

  return withForm('psy:${namespace}/${dreamName.hyphenize()}', f =>
    <f.blank>
      <f.email name='${keyField}' />
      <f.password name='${passwordField}' />
      <f.submit />
    </f.blank>
  )
}
`
    await File.write(config.pathTo(`src/components/SignIn.js`), template)
  }
}
