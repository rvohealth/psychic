import React, { useEffect, useState } from 'react'
import api from './psy/net/common'

export default function Authtest() {
  const [ authWasSuccessful, setAuthWasSuccessful ] = useState(false)

  useEffect(() => {
    async function fetchAuthTest() {
      try {
        await api.get('authtest')
        setAuthWasSuccessful(true)
      } catch(error) {
        // do nothing
      }
    }
    fetchAuthTest()
  })

  return (
    <div>
      <h1>Authtest</h1>
      {
        authWasSuccessful &&
        <h2>Auth was successful</h2>
      }
    </div>
  )
}

