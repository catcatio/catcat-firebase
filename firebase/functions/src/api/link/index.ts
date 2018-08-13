import * as express from 'express'
// tslint:disable-next-line:no-duplicate-imports
import { Express } from 'express'
import * as Cors from 'cors'

import { default as apiHandler, apiPath } from './api'


export const linkApi = ({ database }): Express => {
  const api = express()
  api.use(Cors({ origin: true }))
  api.post(apiPath, apiHandler(database))

  return api
}