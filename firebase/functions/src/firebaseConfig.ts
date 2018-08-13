import { config } from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp(config().firebase)
const database = null // admin.database()
const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })

const ticketingConfig = config().ticketing

export default {
  firestore: firestore,
  database: database,
  stellarUrl: 'https://horizon-testnet.stellar.org',
  stellarNetwork: 'test',
  masterAssetCode: ticketingConfig.masterassetcode,
  masterIssuerKey: ticketingConfig.masterissuerkey,
  masterDistributorKey: ticketingConfig.masterdistributorkey,
  fbAccessToken: ticketingConfig.fbaccesstoken,
  imageResizeService: ticketingConfig.imageresizeservice,
  fbUrl: ticketingConfig.fburl,
  ticketConfirmUrl: ticketingConfig.ticketconfirmurl,
  ticketQrUrl: ticketingConfig.ticketqrurl,
  lineBotApi: ticketingConfig.linebotapi,
  lineChannelAccessToken: ticketingConfig.linechannelaccesstoken
}