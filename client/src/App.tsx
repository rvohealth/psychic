import axios from 'axios'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import baseWsUrl from './helpers/baseWsUrl'
import viteEnvValue from './helpers/viteEnvValue'

import './App.css'
import { Route, Routes, useParams } from 'react-router'

export default function App() {
  return (
    <Routes>
      <Route path="/socket-test/:token" element={<SocketTestPage />} />
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}

function HomePage() {
  const [message, setMessage] = useState('')

  const port = viteEnvValue('VITE_PSYCHIC_ENV') === 'test' ? 7778 : 7777

  useEffect(() => {
    async function getMessage() {
      const res = await axios.get(`http://localhost:${port}/ping`)
      setMessage(res.data)
    }

    void getMessage()
  }, [])

  return (
    <div>
      <p>{message}</p>
    </div>
  )
}

function SocketTestPage() {
  const [websocketMessage, setWebsocketMessage] = useState('')
  const params = useParams()
  const authToken = params.token as string

  useEffect(() => {
    const socket = io(baseWsUrl(), {
      auth: {
        token: authToken,
      },
      withCredentials: true,
      transports: ['websocket'],
    })

    socket.on('/ops/connection-success', () => {
      setWebsocketMessage('websockets connected')
    })
  }, [])

  return (
    <div>
      <p>{websocketMessage}</p>
    </div>
  )
}
