import { config } from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp(config().firebase)
const database = admin.database()
const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })

const ticketingConfig = config().ticketing

const firebaseConfig: IFirebaseConfig = {
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

export interface IFirebaseConfig {
  firestore?: admin.firestore.Firestore,
  database: admin.database.Database,
  stellarUrl: string,
  stellarNetwork: 'test' | 'live',
  masterAssetCode: string,
  masterIssuerKey: string,
  masterDistributorKey: string,
  fbAccessToken: string,
  imageResizeService: string,
  fbUrl: string,
  ticketConfirmUrl: string,
  ticketQrUrl: string,
  lineBotApi: string,
  lineChannelAccessToken: string
}

export default firebaseConfig