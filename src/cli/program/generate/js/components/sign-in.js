import File from 'src/helpers/file'
import config from 'src/config'

export default class GenerateSignInComponent {
  static async generate(dreamName, namespace, keyField, passwordField) {
    const template =
`\
import React, { useState } from 'react'
import ${dreamName.camelize()}API from 'psy/net/${namespace ? namespace + '/' : ''}${dreamName}'

export default function SignIn() {
  const [ ${keyField}, set${keyField.pascalize()} ] = useState('')
  const [ ${passwordField}, set${passwordField.pascalize()} ] = useState('')

  return (
    <div className='sign-in'>
      <input
        name='${keyField}'
        onChange={ value => {
          set${keyField.pascalize()}(value)
        }}
      />

      <input
        name='${passwordField}'
        onChange={ value => {
          set${passwordField.pascalize()}(value)
        }}
      />

      <button
        onClick={async () => {
          const response = await authAPI.auth(${keyField}, ${passwordField})
          console.log(response)
        }}
      >Submit</button>
    </div>
  )
}
`
    await File.write(config.pathTo(`src/components/SignIn.js`), template)
  }
}
