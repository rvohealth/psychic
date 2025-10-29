import { useEffect, useState } from 'react'
import Axios from 'axios'
import { NavLink } from 'react-router'

export default function TablesPage() {
  const [tablesFetched, setTablesFetched] = useState<boolean>(false)
  const [tables, setTables] = useState<string[]>([])

  useEffect(() => {
    if (tablesFetched) return

    const fetchTables = async () => {
      try {
        const res = await Axios.get('http://localhost:7777/studio/tables')
        setTables(res.data)
      } finally {
        setTablesFetched(true)
      }
    }
    void fetchTables()
  }, [tablesFetched, tables])

  return (
    <ul>
      {tables.map(table => (
        <li key={table}>
          <NavLink to={`/tables/${table}`}>{table}</NavLink>
        </li>
      ))}
    </ul>
  )
}
