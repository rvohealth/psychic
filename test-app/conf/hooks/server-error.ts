import { Request, Response } from 'express'
import developmentOrTestEnv from '../../../boot/cli/helpers/developmentOrTestEnv'

export default async function onServerError(error: unknown, req: Request, res: Response) {
  const message = developmentOrTestEnv()
    ? `An unexpected error has caused this request to crash.
                error:
                  ${error}`
    : ''

  res.status(500).send(message)
}
