import { useEffect, useState } from 'react'
import Axios from 'axios'
import { NavLink } from 'react-router'

export default function ModelsPage() {
  const [modelsFetched, setModelsFetched] = useState<boolean>(false)
  const [modelNames, setModelNames] = useState<string[]>([])

  useEffect(() => {
    if (modelsFetched) return

    const fetchModels = async () => {
      try {
        const res = await Axios.get('http://localhost:7777/studio/models')
        setModelNames(res.data)
      } finally {
        setModelsFetched(true)
      }
    }
    void fetchModels()
  }, [modelsFetched, modelNames])

  return (
    <ul>
      {modelNames.map(modelName => (
        <li key={modelName}>
          <NavLink to={`/models/${modelName}`}>{modelName}</NavLink>
        </li>
      ))}
    </ul>
  )
}
