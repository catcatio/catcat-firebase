import * as StellarSdk from 'stellar-sdk'

const parseEventToken = (eventToken) => {
  if (!eventToken) return null

  const chunks = eventToken.split(':')
  if (chunks.length !== 2) return null

  return new StellarSdk.Asset(chunks[0], chunks[1])
}

export default (eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider) => async (tx, orgRequestParams) => {
  console.log('start confirm ticket')
  let atBeginning = Date.now(),
    startTime = atBeginning

  let firebaseTime = 0, stellarTime = 0

  const orgMessageSender = messagingProvider.get(orgRequestParams.requestSource)
  const formatter = messageFormatterProvider.get(orgRequestParams.requestSource)
  orgMessageSender.sendMessage(orgRequestParams.from, 'Confirming, please wait...')

  // Validate the ticket
  const txAction = await stellarWrapper.queryTransactionAction(tx)
  let pTime = Date.now() - startTime; stellarTime += pTime
  console.log(`get tx memo by tx: ${pTime}`); startTime = Date.now()
  if (!txAction || txAction.action !== 'B') {
    console.error('EVENT_TX_NOTFOUND')
    return orgMessageSender.sendMessage(orgRequestParams.from, 'Tx not found')
  }

  const event = await eventStore.getById(txAction.eventId)
  pTime = Date.now() - startTime; firebaseTime += pTime
  console.log(`get event by id: ${pTime}`); startTime = Date.now()
  if (!event) {
    console.error('EVENT_NOTFOUND')
    return orgMessageSender.sendMessage(orgRequestParams.from, 'Event not found')
  }

  const ticket = await eventStore.getTicketById(txAction.eventId, txAction.ticketId)
  pTime = Date.now() - startTime; firebaseTime += pTime
  console.log(`get ticket ${txAction.eventId} ${txAction.ticketId}: ${pTime}`); startTime = Date.now()
  if (!ticket) {
    console.error('EVENT_TICKET_NOTFOUND')
    return orgMessageSender.sendMessage(orgRequestParams.from, 'Ticket not found')
  }

  const owner = await userStore.getUserById(ticket.owner_id)
  pTime = Date.now() - startTime; firebaseTime += pTime
  console.log(`get owner ${ticket.owner_id}: ${pTime}`); startTime = Date.now()
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

  const asset = parseEventToken(ticket.event_token)
  const userKey = StellarSdk.Keypair.fromPublicKey(owner.publicKey)
  const burnt_tx = await stellarWrapper.transfer(userKey, asset.getIssuer(), 1, asset, `C:${txAction.eventId}:${txAction.ticketId}`)
  pTime = Date.now() - startTime; stellarTime += pTime
  console.log(`brun ticket: ${pTime}`); startTime = Date.now()

  await eventStore.updateBurntTicket(txAction.eventId, txAction.ticketId, burnt_tx)
  console.log(`total ticket use time: ${Date.now() - atBeginning}`); startTime = Date.now()
  console.info('EVENT_TICKET_CONFIRMED')

  return userStore.updateBurntTicket(owner.id, txAction.eventId, txAction.ticketId)
    .then(() => {
      userMessageSender.sendMessage(userAddress, `Welcome to '${event.title}'`)
      orgMessageSender.sendCustomMessages(orgRequestParams.from, formatter.confirmResultTemplate(burnt_tx, firebaseTime, stellarTime))
    })
}
