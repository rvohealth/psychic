import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import './App.css'
import HomePage from './pages/Home'
import TablesPage from './pages/TablesPage'
import TablePage from './pages/TablePage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },

  {
    path: '/tables',
    element: <TablesPage />,
  },

  {
    path: '/tables/:tableName',
    element: <TablePage />,
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
