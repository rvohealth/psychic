import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import { HttpMethod } from '../../../../src/router/types'

export default ({
  // method = 'get',
  params = {},
  body = {},
}: {
  method?: HttpMethod
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: { [key: string]: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: { [key: string]: any }
} = {}): { req: Request; res: Response } => ({
  req: getMockReq({ params, body }),
  res: getMockRes().res,
})
