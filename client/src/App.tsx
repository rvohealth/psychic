import axios from 'axios'
import { useEffect, useState } from 'react'
import './App.css'
import viteEnvValue from './helpers/viteEnvValue'

function App() {
  const [message, setMessage] = useState('')

  const port = viteEnvValue('VITE_PSYCHIC_ENV') === 'test' ? 7778 : 7777

  useEffect(() => {
    async function getMessage() {
      const res = await axios.get(`http://localhost:${port}/ping`)
      setMessage(res.data)
    }

    void getMessage()
  }, [])

  return <div>{message}</div>
}

export default App
