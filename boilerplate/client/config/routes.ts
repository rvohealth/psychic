import apiRoutes from '../api/apiRoutes'

const baseUrl = () => {
  if (process.env.REACT_APP_API_HOST) return process.env.REACT_APP_API_HOST
  return process.env.REACT_APP_PSYCHIC_ENV === 'test' ? 'http://localhost:7778' : 'http://localhost:7777'
}

const routes = {
  baseURL: baseUrl(),

  app: {
    home: '/',
    login: '/login',
    logout: '/logout',
    signup: '/signup',
  },

  api: {
    ...apiRoutes,
  },
}

export default routes
