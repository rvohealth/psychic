import { useEffect } from 'react'
import common from './psy/common'
import { io } from 'socket.io-client'
import './App.css'

function App() {
  useEffect(() => {
    async function doit() {
      const response = await common.post('api/v1/users/auth', { email: 'jim', password: 'fishman' })
      console.log('zim', response)
      const socket = io('localhost:778')
      socket.on('connect', () => {
        console.log('BLIGGIN!!!!')
        socket.emit('psy/auth', { token: response.data.token, key: 'currentUser' })

        socket.on('shipmonk', d => {
          console.log('stole my fart', d)
        })
      })
    }

    doit()
  }, [])

  return (
    <div>PSYYYYCHIC</div>
  )
}

export default App
