import * as StellarSdk from 'stellar-sdk'

import { HrtimeMarker } from '../utils/hrtimeMarker'

const parseEventToken = (eventToken) => {
  if (!eventToken) return null

  const chunks = eventToken.split(':')
  if (chunks.length !== 2) return null

  return new StellarSdk.Asset(chunks[0], chunks[1])
}

export default (eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider) => async (tx, orgRequestParams) => {
  const hrMarker = HrtimeMarker.create('confirmTicket')
  console.log('start confirm ticket')
  let firebaseTime = 0, stellarTime = 0
  try {
    let marker = hrMarker.mark('getTx')
    const orgMessageSender = messagingProvider.get(orgRequestParams.requestSource)
    const formatter = messageFormatterProvider.get(orgRequestParams.requestSource)
    orgMessageSender.sendMessage(orgRequestParams.from, 'Confirming, please wait...')

    // Validate the ticket
    const txAction = await stellarWrapper.queryTransactionAction(tx)
    stellarTime += marker.end().log().duration
    if (!txAction || txAction.action !== 'B') {
      console.error('EVENT_TX_NOTFOUND')
      return orgMessageSender.sendMessage(orgRequestParams.from, 'Tx not found')
    }
    console.log(txAction)

    marker = hrMarker.mark('getEventById')
    const event = await eventStore.getById(txAction.eventId)
    firebaseTime += marker.end().log().duration
    if (!event) {
      console.error('EVENT_NOTFOUND')
      return orgMessageSender.sendMessage(orgRequestParams.from, 'Event not found')
    }

    marker = hrMarker.mark('getTicketById')
    const ticket = await eventStore.getTicketById(txAction.eventId, txAction.ticketId)
    firebaseTime += marker.end().log().duration
    if (!ticket) {
      console.error('EVENT_TICKET_NOTFOUND')
      return orgMessageSender.sendMessage(orgRequestParams.from, 'Ticket not found')
    }

    const userLanguageCode = ticket.language_code || 'en'

    marker = hrMarker.mark('getUserById')
    const owner = await userStore.getUserById(ticket.owner_id)
    firebaseTime += marker.end().log(`get owner ${ticket.owner_id}`).duration
    if (!owner) {
      console.error('EVENT_OWNER_NOTFOUND')
      return orgMessageSender.sendMessage(orgRequestParams.from, 'Owner not found')
    }

    const userMessageSender = messagingProvider.get(owner.providers)
    const userAddress = owner.providers.line || owner.providers.facebook

    if (ticket.burnt_tx) {
      console.error('EVENT_TICKET_USED')

      await orgMessageSender.sendMessage(orgRequestParams.from, 'This ticket has already been used')
      return orgMessageSender.sendCustomMessages(orgRequestParams.from, formatter.confirmResultTemplate(ticket.burnt_tx, firebaseTime, stellarTime, ticket.burnt_date))
    }

    marker = hrMarker.mark('burnTicket')
    const asset = parseEventToken(ticket.event_token)
    const userKey = StellarSdk.Keypair.fromPublicKey(owner.publicKey)
    const burnt_tx = await stellarWrapper.transfer(userKey, asset.getIssuer(), 1, asset, `C:${txAction.eventId}:${txAction.ticketId}`)
    stellarTime += marker.end().log().duration

    marker = hrMarker.mark('updateTicketBurnt')
    await eventStore.updateBurntTicket(txAction.eventId, txAction.ticketId, burnt_tx)
    console.info('EVENT_TICKET_CONFIRMED')

    return await userStore.updateBurntTicket(owner.id, txAction.eventId, txAction.ticketId)
      .then(() => {
        userMessageSender.sendMessage(userAddress,
          userLanguageCode === 'th' ? 'ยืนยันตั๋วเรียบร้อย~' : 'Ticket seem to be valid :)',
          userLanguageCode === 'th' ? `เชิญเข้างาน "${event.title}" ได้เลยจ้า!` : `Welcome to "${event.title}" event!`)
        orgMessageSender.sendCustomMessages(orgRequestParams.from, formatter.confirmResultTemplate(burnt_tx, firebaseTime, stellarTime))
      }).then(() => stellarTime += marker.end().log().duration)
  } finally {
    console.log(`🔥  ${firebaseTime.toFixed(2)} ms    🚀  ${stellarTime.toFixed(2)} ms`)
    hrMarker.end().log()
  }
}
