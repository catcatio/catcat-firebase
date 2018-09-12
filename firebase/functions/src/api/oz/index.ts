import * as express from 'express'
// tslint:disable-next-line:no-duplicate-imports
import { Express } from 'express'
import * as Cors from 'cors'

import { ticketing } from '../../ticketing'
import { bots } from '../../bots'
import { default as apiHandler, apiPath } from './api'
import { default as useTicketApiHandler, apiPath as useTicketApiPath } from './useTicketApi'
import { default as qrApiHandler, apiPath as qrApiPath } from './qrApi'
import { default as eventApiHandler, apiPath as eventApiPath } from './eventApi'
import { default as paymentConfirmApiHandler, apiPath as paymentConfirmPath } from './paymentConfirmApi'
import { initMessagingProvider } from '../../messaging'
import { IFirebaseConfig } from '../../firebaseConfig'

export const ozApi = (config: IFirebaseConfig): Express => {
  const messagingProvider = initMessagingProvider(config)
  const ticketingSystem = ticketing(messagingProvider, config)
  const botsSystem = bots(messagingProvider, config)

  const api = express()
  api.use(Cors({ origin: true }))
  api.use(require('./fbdummy').fbdummy) // use static response for facebook, until app review process complete
  api.use((req, res, next) => {
    console.log(`oz: ${req.originalUrl}`)
    next()
  })

  api.post(apiPath, apiHandler(ticketingSystem, botsSystem))
  api.get(useTicketApiPath, useTicketApiHandler(ticketingSystem))
  api.get(qrApiPath, qrApiHandler(ticketingSystem))
  api.use(eventApiPath, eventApiHandler(ticketingSystem))
  api.use(paymentConfirmPath, paymentConfirmApiHandler(ticketingSystem))

  return api
}