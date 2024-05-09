import { Ws } from '../../../src'

export const wsRoutes = ['/api/v1/authed-ping-response'] as const
const appWs = new Ws(wsRoutes)

export default appWs
