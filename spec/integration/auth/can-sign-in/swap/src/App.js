import React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import SignIn from './components/SignIn'
import SignUp from './components/SignUp'

export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/signup">
          <SignUp />
        </Route>

        <Route exact path="/login">
          <SignIn />
        </Route>
      </Switch>
    </Router>
  )
}
