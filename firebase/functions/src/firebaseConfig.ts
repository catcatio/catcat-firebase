import { config } from 'firebase-functions'

const ticketingConfig = config().ticketing

export = (firestore, database) => ({
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
})