import 'psy/globals/client'
import React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import Home from 'pages/Home'

export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <Home />
        </Route>
      </Switch>
    </Router>
  )
}
