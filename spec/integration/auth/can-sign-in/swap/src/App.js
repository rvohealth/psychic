import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import SignIn from './components/SignIn'
import SignUp from './components/SignUp'
import Authtest from './Authtest'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUp />}/>
        <Route exact path="/login" element={<SignIn />}/>
        <Route exact path="/authtest" element={<Authtest />}/>
      </Routes>
    </Router>
  )
}
