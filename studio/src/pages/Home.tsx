import { NavLink } from 'react-router'

export default function HomePage() {
  return (
    <ul>
      <li>
        <NavLink to="/tables">tables</NavLink>
      </li>

      <li>
        <NavLink to="/models">models</NavLink>
      </li>
    </ul>
  )
}
