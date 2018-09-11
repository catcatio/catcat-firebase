import * as express from 'express'
// tslint:disable-next-line:no-duplicate-imports
import { Express } from 'express'
import * as Cors from 'cors'

import { default as payApiHandler, apiPath as payApiPath } from './payApi'
import { IFirebaseConfig } from '../../firebaseConfig'
import { initMessagingProvider } from '../../messaging'

export const lineApi = (config: IFirebaseConfig): Express => {
  const firestoreRepoFactory = require('../../ticketing/firestoreRepository').default
  const transactionsRepository = firestoreRepoFactory(config.firestore, 'transactions')
  const messagingProvider = initMessagingProvider(config)

  const api = express()
  api.use(Cors({ origin: true }))
  api.use(payApiPath, payApiHandler(messagingProvider, transactionsRepository, config))
  return api
}