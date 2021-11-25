import React from 'react'
import Psychic from 'psy/components/Psychic'
import { Route } from 'react-router-dom'
import Home from 'pages/Home'

export default function App() {
  return (
    <Psychic>
      <Route exact path="/" element={ <Home /> } />
    </Psychic>
  )
}
