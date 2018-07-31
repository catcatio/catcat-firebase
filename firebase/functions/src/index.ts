import * as functions from 'firebase-functions';
const cors = require('cors')({ origin: true })
const admin = require('firebase-admin')

admin.initializeApp(functions.config().firebase)

import { facebookClient } from './facebookClient'
import { lineClient } from './lineClient'
import { ticketing } from './ticketing'

const ticketingConfig = functions.config().ticketing
const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })
const config = {
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

const facebook = facebookClient(config)
const line = lineClient(config)
const ticketingSystem = ticketing({facebook, line}, config)

const sendOKAt = (res, data, error?) =>
  res.status(200).send({
    data,
    error,
    at: new Date().toISOString()
  })

const willLink = async (provider, id, publicKey) => {
  const ref = admin.database().ref(`/${provider}`)
  await ref.child(id).set(publicKey)
  return { id }
}

export const link = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { provider, id, publicKey } = req.body
    if (!provider) return sendOKAt(res, null, 'Required : provider')
    if (!id) return sendOKAt(res, null, 'Required : id')
    if (!publicKey) return sendOKAt(res, null, 'Required : publicKey')

    willLink(provider, id, publicKey)
      .then(payload => sendOKAt(res, payload))
      .catch(err => sendOKAt(res, null, err))
  })
})

const sendDialogflowTextMessage = (res, text: string, retCode: number = 200) => {
  return res.status(retCode).send({
    "dialogflow": {
      "text": {
        text
      }
    }
  })
}

const delay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

const sendDelayResponse = (res, message, delayMs = 1000) => {
  return delay(delayMs).then(() => sendDialogflowTextMessage(res, message))
}

export const oz = functions.https.onRequest((req, res) => {
  console.log('start of oz request')
  cors(req, res, () => {
    console.log('start of oz (cors) request')
    if (!req.body) return sendDialogflowTextMessage(res, `No body...`)

    const { action, requestSource, userId, senderId } = req.body
    if (!action) return sendDialogflowTextMessage(res, `No action...`)

    const requestParams = {
      requestSource,
      from: requestSource === 'LINE' ? userId : senderId
    }

    switch (action) {
      case "list.events":
        sendDelayResponse(res, '')

        return ticketingSystem.listEvent(requestParams)
      case "events.tickets.book-yes":
        const title = req.body.parameters['event-title']

        sendDelayResponse(res, `Hold on, we're now booking ${title} for you...`)

        return ticketingSystem.bookEvent(requestParams, title)
      default:
        return sendDialogflowTextMessage(res, `Something went wrong with ${action}`)
    }
  })
})
