import { useParams } from 'react-router'
import TableView from '../components/table/TableView'

export default function ModelPage() {
  const params = useParams()
  const modelName = params.modelName as string

  return <TableView mode="model" tableOrModelName={modelName} />
}
