import { useEffect } from 'react'
import usersAPI from 'psy/net/api/v1/users'
import psy from 'psy'
import './App.css'

function App() {
  useEffect(() => {
    async function doit() {
      psy.on('psy/authed', () => {
        console.log('successfully authenticated!')
      })

      const response = await usersAPI.auth({ email: 'jim', password: 'fishman' })
      console.log(response)
    }

    doit()
  }, [])

  return (
    <div>PSYYYYCHIC</div>
  )
}

export default App
