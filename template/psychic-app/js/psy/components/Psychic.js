import 'psy/globals/client'
import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'

export default function Psychic(props) {
  return (
    <Router>
      {props.children}
    </Router>
  )
}

