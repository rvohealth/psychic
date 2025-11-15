import { DreamCLI } from '@rvoh/dream/system'
import { Request, Response } from 'express'
import colorize from '../../cli/helpers/colorize.js'
import EnvInternal from '../../helpers/EnvInternal.js'
import { HttpMethod } from '../../router/types.js'
import { httpMethodBgColor } from './httpMethodColor.js'
import { statusCodeBgColor } from './statusCodeColor.js'

export default function logIfDevelopment({
  req,
  res,
  startTime,
  fallbackStatusCode = 200,
}: {
  req: Request
  res: Response
  startTime: number
  fallbackStatusCode?: number
}) {
  if (!EnvInternal.isDevelopment) return

  const method = colorize(` ${req.method.toUpperCase()} `, {
    color: 'black',
    bgColor: httpMethodBgColor(req.method.toLowerCase() as HttpMethod),
  })

  const computedStatus = res.statusCode || fallbackStatusCode
  const statusBgColor = statusCodeBgColor(computedStatus)
  const status = colorize(` ${computedStatus} `, {
    color: 'black',
    bgColor: statusBgColor,
  })
  const url = colorize(req.url, { color: 'green' })
  const benchmark = colorize(`${Date.now() - startTime}ms`, { color: 'gray' })
  DreamCLI.logger.log(`${method} ${url} ${status} ${benchmark}`, { logPrefix: '' })
}
