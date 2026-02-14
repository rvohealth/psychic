import { DreamCLI } from '@rvoh/dream/system'
import Koa from 'koa'
import colorize from '../../cli/helpers/colorize.js'
import EnvInternal from '../../helpers/EnvInternal.js'
import { HttpMethod } from '../../router/types.js'
import { httpMethodBgColor } from './httpMethodColor.js'
import { statusCodeBgColor } from './statusCodeColor.js'

export default function logIfDevelopment({
  ctx,
  startTime,
  fallbackStatusCode = 200,
}: {
  ctx: Koa.Context
  startTime: number
  fallbackStatusCode?: number
}) {
  if (!EnvInternal.isDevelopment) return

  const method = colorize(` ${ctx.method.toUpperCase()} `, {
    color: 'black',
    bgColor: httpMethodBgColor(ctx.method.toLowerCase() as HttpMethod),
  })

  const computedStatus = ctx.status || fallbackStatusCode
  const statusBgColor = statusCodeBgColor(computedStatus)
  const status = colorize(` ${computedStatus} `, {
    color: 'black',
    bgColor: statusBgColor,
  })
  const url = colorize(ctx.url, { color: 'green' })
  const benchmark = colorize(`${Date.now() - startTime}ms`, { color: 'gray' })
  DreamCLI.logger.log(`${method} ${url} ${status} ${benchmark}`, { logPrefix: '' })
}
