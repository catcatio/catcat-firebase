import { config, Request, Response, https } from 'firebase-functions';

import * as admin from 'firebase-admin'

import { linkApi, ozApi } from './api'
import { facebookClient } from './facebookClient'
import { lineClient } from './lineClient'

admin.initializeApp(config().firebase)

console.log('functions started')

const ticketingConfig = config().ticketing
const database = null // admin.database()
const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })

const firebaseConfig = {
  firestore: firestore,
  stellarUrl: 'https://horizon-testnet.stellar.org',
  stellarNetwork: 'test',
  masterAssetCode: ticketingConfig.masterassetcode,
  masterIssuerKey: ticketingConfig.masterissuerkey,
  masterDistributorKey: ticketingConfig.masterdistributorkey,
  qrcodeservice: ticketingConfig.qrcodeservice,
  fbaccesstoken: ticketingConfig.fbaccesstoken,
  fburl: ticketingConfig.fburl,
  ticketconfirmurl: ticketingConfig.ticketconfirmurl,
  linebotapi: ticketingConfig.linebotapi,
  linechannelaccesstoken: ticketingConfig.linechannelaccesstoken
}

const line = lineClient(firebaseConfig)
const facebook = facebookClient(firebaseConfig)

const wrapApi = (api: (request: Request, response: Response) => any) =>
  https.onRequest((request: Request, response: Response) => {
    if (!request.path) {
      request.url = `/${request.url}` // prepend '/' to keep query params if any
    }
    return api(request, response)
  })


const link = wrapApi(linkApi(database))
const oz = wrapApi(ozApi({ line, facebook }, firebaseConfig))

export {
  link,
  oz
}