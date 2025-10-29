import { useParams } from 'react-router'
import TableView from '../components/table/TableView'

export default function TablePage() {
  const params = useParams()
  const tableName = params.tableName as string

  return <TableView mode="table" tableOrModelName={tableName} />
}
