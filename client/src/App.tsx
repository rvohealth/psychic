import axios from 'axios'
import { useEffect, useState } from 'react'
import viteEnvValue from './helpers/viteEnvValue'

import { Route, Routes } from 'react-router'
import './App.css'

export default function App() {
  return (
    <Routes>
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
