import { useEffect } from 'react'
import usersAPI from 'psy/net/api/v1/users'
import blackCatsAPI from 'psy/net/api/v1/black-cats'
import psy from 'psy'
import './App.css'

function App() {
  useEffect(() => {
    async function doit() {
      psy.on('psy/authed', async () => {
        console.log('successfully authenticated!')
        const response = await blackCatsAPI.index()
        console.log('BLACK CATS', response)
      })

      psy.on('testws', data => {
        console.log('TEST WSRESPONSE', data)
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
