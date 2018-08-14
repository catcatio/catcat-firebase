import * as express from 'express'
// tslint:disable-next-line:no-duplicate-imports
import { Express } from 'express'
import * as Cors from 'cors'

import { ticketing } from '../../ticketing'
import { default as apiHandler, apiPath } from './api'
import { default as confirmApiHandler, apiPath as confirmApiPath } from './confirmApi'
import { default as qrApiHandler, apiPath as qrApiPath } from './qrApi'
import { IMessageingProvider } from '../../messaging'
import { IFirebaseConfig } from '../../firebaseConfig'

export const ozApi = (messagingProvider: IMessageingProvider, config: IFirebaseConfig): Express => {
  const ticketingSystem = ticketing(messagingProvider, config)

  const api = express()
  api.use(Cors({ origin: true }))
  api.use(require('./fbdummy').fbdummy) // use static response for facebook, until app review process complete

  api.post(apiPath, apiHandler(ticketingSystem))
  api.get(confirmApiPath, confirmApiHandler(ticketingSystem))
  api.get(qrApiPath, qrApiHandler(ticketingSystem))

  return api
}