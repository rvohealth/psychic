import 'psy/globals/client'
import React from 'react'
import { BrowserRouter as Router, Routes } from 'react-router-dom'

export default function Psychic(props) {
  return (
    <Router>
      <Routes>
        {props.children}
      </Routes>
    </Router>
  )
}

