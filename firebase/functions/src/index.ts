import * as functions from 'firebase-functions';
const cors = require('cors')({ origin: true })
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

import { ticketing } from './ticketing'

const config = {
  firestore: admin,
  stellarUrl: 'https://horizon-testnet.stellar.org',
  stellarNetwork: 'test',
  masterAssetCode: functions.config().ticketing.masterassetcode,
  masterIssuerKey: functions.config().ticketing.masterissuerkey,
  masterDistributorKey: functions.config().ticketing.masterdistributorkey,
}

const ticketingSystem = ticketing(config)

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
      "message": {
        text
      }
    }
  })
}

export const oz = functions.https.onRequest((req, res) => {
  cors(req, res, () => {

    if (!req.body) return sendDialogflowTextMessage(res, `No body...`)

    const { action } = req.body
    if (!action) return sendDialogflowTextMessage(res, `No action...`)

    switch (action) {
      case "list.events":
        return ticketingSystem.listEvent()
          .then(response => {
            res.status(200).send(response)
          })
          .catch(err => res.status(400).send(`ACTION_FAILED: ${err.message}`))
      case "events.tickets.book-yes":
        const title = req.body.parameters['event-title']
        return ticketingSystem.bookEvent(title)
          .then(response => {
            res.status(200).send(response)
          })
          .catch(err => res.status(400).send(`ACTION_FAILED: ${err.message}`))
      default:
        return sendDialogflowTextMessage(res, `Something went wrong with ${action}`)
    }
  })
})
