import './App.css'

import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import HomePage from './pages/Home'
import ModelPage from './pages/ModelPage'
import ModelsPage from './pages/ModelsPage'
import TablePage from './pages/TablePage'
import TablesPage from './pages/TablesPage'

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

  {
    path: '/models',
    element: <ModelsPage />,
  },

  {
    path: '/models/:modelName',
    element: <ModelPage />,
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
