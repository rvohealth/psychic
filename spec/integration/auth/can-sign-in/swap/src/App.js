import React, { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import SignIn from './components/SignIn'
import SignUp from './components/SignUp'
import Authtest from './Authtest'
import psy from 'psy'

export default function App() {
  const [ authed, setAuthed ] = useState(false)

  psy.on('psy/authed', async () => {
    setAuthed(true)
  })

  return (
    <Router>
      { authed ? <h1>Authed via WS</h1> : <h1>No WS Auth found yet</h1>}
      <Routes>
        <Route path="/signup" element={<SignUp />}/>
        <Route exact path="/login" element={<SignIn />}/>
        <Route exact path="/authtest" element={<Authtest />}/>
      </Routes>
    </Router>
  )
}
