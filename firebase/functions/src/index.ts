import {config, Request, Response, https} from 'firebase-functions';
import * as Cors from 'cors'
import * as admin from 'firebase-admin'

import {linkApi, ozApi} from './api'
import { facebookClient } from './facebookClient'
import { lineClient } from './lineClient'

const cors = Cors({ origin: true })
admin.initializeApp(config().firebase)

console.log('functions started')

const ticketingConfig = config().ticketing
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
  linemessageapi: ticketingConfig.linemessageapi,
  linechannelaccesstoken: ticketingConfig.linechannelaccesstoken
}

const line = lineClient(firebaseConfig)
const facebook = facebookClient(firebaseConfig)

const wrapApi = (api: (req: Request, res: Response) => any) =>
  https.onRequest((req: Request, res: Response) =>
    cors(req, res, () => api(req, res)))

const link = wrapApi(linkApi(admin.database))
const oz = wrapApi(ozApi({line, facebook}, firebaseConfig))

export {
  link,
  oz
}