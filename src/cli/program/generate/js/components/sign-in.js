import File from 'src/helpers/file'
import config from 'src/config'

export default class GenerateSignInComponent {
  static async generate(dreamName, namespace, keyField, passwordField) {
    const apiName = `${dreamName.camelize().pluralize()}API`

    const template =
`\
import React, { useState } from 'react'
import ${apiName} from 'psy/net/${namespace ? namespace + '/' : ''}${dreamName.pluralize()}'

export default function SignIn() {
  const [ ${keyField}, set${keyField.pascalize()} ] = useState('')
  const [ ${passwordField}, set${passwordField.pascalize()} ] = useState('')

  return (
    <div className='sign-in'>
      <input
        name='${keyField}'
        onChange={ event => {
          set${keyField.pascalize()}(event.target.value)
        }}
      />

      <input
        name='${passwordField}'
        onChange={ event => {
          set${passwordField.pascalize()}(event.target.value)
        }}
      />

      <button
        onClick={async () => {
          try {
            const response = await ${apiName}.auth({ ${keyField}, ${passwordField} })
            console.log(response)
          } catch(error) {
            console.error('AXIOS ERROR:', error)
          }
        }}
      >Submit</button>
    </div>
  )
}
`
    await File.write(config.pathTo(`src/components/SignIn.js`), template)
  }
}
