import { HrtimeMarker } from '../utils/hrtimeMarker'

export default (eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider) => async (tx) => {
  const hrMarker = HrtimeMarker.create('useTicket')
  console.log('start use ticket')
  let firebaseTime = 0, stellarTime = 0
  try {

    let marker = hrMarker.mark('getMemo')
    // Validate the ticket
    const txAction = await eventStore.getMemo(tx)
    firebaseTime += marker.end().log().duration

    if (!txAction || txAction.action !== 'B') {
      console.error('EVENT_TX_NOTFOUND')
      return Promise.reject('EVENT_TX_NOTFOUND')
    }

    marker = hrMarker.mark('getEventById')
    const event = await eventStore.getById(txAction.eventId)
    firebaseTime += marker.end().log().duration
    if (!event) {
      console.error('EVENT_NOTFOUND')
      return Promise.reject('EVENT_NOTFOUND')
    }

    const orgAddress = event.providers.line || event.providers.facebook
    const orgMessageSender = messagingProvider.get(event.providers)
    marker = hrMarker.mark('getTicketById')
    const ticket = await eventStore.getTicketById(txAction.eventId, txAction.ticketId)
    firebaseTime += marker.end().log().duration

    if (!ticket) {
      console.error('EVENT_TICKET_NOTFOUND')
      orgMessageSender.sendMessage(orgAddress, `Ticket not found ${tx}`)
      return Promise.reject('EVENT_TICKET_NOTFOUND')
    }

    marker = hrMarker.mark('getUserById')
    const owner = await userStore.getUserById(ticket.owner_id)
    firebaseTime += marker.end().log().duration
    if (!owner) {
      console.error('EVENT_OWNER_NOTFOUND')
      orgMessageSender.sendMessage(orgAddress, `Owner not found ${tx}`)
      return Promise.reject('EVENT_OWNER_NOTFOUND')
    }

    marker = hrMarker.mark('sendResponse')
    if (ticket.burnt_tx) {
      console.error('EVENT_TICKET_USED')
      const eventFormatter = messageFormatterProvider.get(event.providers)
      orgMessageSender.sendMessage(orgAddress, 'This ticket has already been used')
        .then(() => orgMessageSender.sendCustomMessages(orgAddress, eventFormatter.confirmResultTemplate(ticket.burnt_tx, true)))
      return Promise.reject('EVENT_OWNER_NOTFOUND')
    }

    const ownerMessageSender = messagingProvider.get(owner.providers)
    const ownerAddress = owner.providers.line || owner.providers.facebook
    // ownerMessageSender.sendMessage(ownerAddress, 'Your QR has been scan, please wait for confirmation.')

    const profile = owner.providers.line ? await ownerMessageSender.getProfile(owner.providers.line) : null
    const ownerProvider = owner.providers.line ? 'line' : 'facebook'
    // post confirm options to organizer
    if (profile) {
      console.log(profile.pictureUrl)
      const formatter = messageFormatterProvider.get(owner.providers)
      const message = formatter.confirmTemplate(profile.pictureUrl, profile.displayName, ownerProvider, event.title, tx)
      orgMessageSender.sendCustomMessages(orgAddress, message)
    }

    firebaseTime += marker.end().log().duration

    return 'EVENT_TICKET_OK'
  } finally {
    console.log(`🔥  ${firebaseTime.toFixed(2)} ms    🚀  ${stellarTime.toFixed(2)} ms`)
    hrMarker.end().log()
  }
}
