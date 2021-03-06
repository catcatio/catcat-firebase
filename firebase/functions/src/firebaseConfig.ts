import { config } from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp(config().firebase)
const database = admin.database()
const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })
const envConfig = config()

const ticketingConfig = envConfig.ticketing

const linePay = require('line-pay')

const pay = new linePay({
  channelId: ticketingConfig.linepaychannelid,
  channelSecret: ticketingConfig.linepaychannelsecret,
  isSandbox: ticketingConfig.linepayproduction !== 'true'
})

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
  useTicketUrl: ticketingConfig.useticketurl,
  ticketQrUrl: ticketingConfig.ticketqrurl,
  lineBotApi: ticketingConfig.linebotapi,
  lineChannelAccessToken: ticketingConfig.linechannelaccesstoken,
  linePayConfirmUrl: {
    ticket: ticketingConfig.linepayconfirmurl,
    demo: ticketingConfig.linepayconfirmdemourl,
  },
  linePay: pay,
  botLineId: ticketingConfig.botlineid,
  mailgunKey: ticketingConfig.mailgunkey,
  mailgunDomain: ticketingConfig.mailgundomain,
  catcatMail: ticketingConfig.catcatmail,
  facebookEventScraperUrl: ticketingConfig.facebookeventscraperurl
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
  useTicketUrl: string,
  ticketQrUrl: string,
  lineBotApi: string,
  lineChannelAccessToken: string,
  linePayConfirmUrl: any,
  linePay: any,
  botLineId: string,
  mailgunKey: string,
  mailgunDomain: string,
  catcatMail: string,
  facebookEventScraperUrl: string
}

export default firebaseConfig