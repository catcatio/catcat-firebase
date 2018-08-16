export default (eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider) => async (tx) => {
  console.log('start use ticket')
  const atBeginning = Date.now()
  let startTime = atBeginning

  // Validate the ticket
  const txAction = await eventStore.getMemo(tx)
  console.log(`get transaction by id: ${Date.now() - startTime}`); startTime = Date.now()
  if (!txAction || txAction.action !== 'B') {
    console.error('EVENT_TX_NOTFOUND')
    return Promise.reject('EVENT_TX_NOTFOUND')
  }

  const event = await eventStore.getById(txAction.eventId)
  console.log(`get event by id: ${Date.now() - startTime}`); startTime = Date.now()
  if (!event) {
    console.error('EVENT_NOTFOUND')
    return Promise.reject('EVENT_NOTFOUND')
  }

  const orgAddress = event.providers.line || event.providers.facebook
  const orgMessageSender = messagingProvider.get(event.providers)

  const ticket = await eventStore.getTicketById(txAction.eventId, txAction.ticketId)
  console.log(`get ticket ${txAction.eventId} ${txAction.ticketId}: ${Date.now() - startTime}`); startTime = Date.now()
  if (!ticket) {
    console.error('EVENT_TICKET_NOTFOUND')
    await orgMessageSender.sendMessage(orgAddress, `Ticket not found ${tx}`)
    return Promise.reject('EVENT_TICKET_NOTFOUND')
  }

  const owner = await userStore.getUserById(ticket.owner_id)
  console.log(`get owner ${ticket.owner_id}: ${Date.now() - startTime}`); startTime = Date.now()
  if (!owner) {
    console.error('EVENT_OWNER_NOTFOUND')
    await orgMessageSender.sendMessage(orgAddress, `Owner not found ${tx}`)
    return Promise.reject('EVENT_OWNER_NOTFOUND')
  }

  if (ticket.burnt_tx) {
    console.error('EVENT_TICKET_USED')
    const eventFormatter = messageFormatterProvider.get(event.providers)
    orgMessageSender.sendMessage(orgAddress, 'This ticket has already been used')
    .then(() => orgMessageSender.sendCustomMessages(orgAddress, eventFormatter.confirmResultTemplate(ticket.burnt_tx, true)))
    return Promise.reject('EVENT_OWNER_NOTFOUND')
  }

  const ownerMessageSender = messagingProvider.get(owner.providers)
  const profile = owner.providers.line ? await ownerMessageSender.getProfile(owner.providers.line) : null
  const ownerProvider = owner.providers.line ? 'line' : 'facebook'
  // post confirm options to organizer
  if (profile) {
    console.log(profile.pictureUrl)
    const formatter = messageFormatterProvider.get(owner.providers)
    const message = formatter.confirmTemplate(profile.pictureUrl, profile.displayName, ownerProvider, event.title, tx)
    await orgMessageSender.sendCustomMessages(orgAddress, message)
  }

  console.log(`total ticket use time: ${Date.now() - atBeginning}`); startTime = Date.now()
  console.info('EVENT_TICKET_OK')
  return 'EVENT_TICKET_OK'
}
