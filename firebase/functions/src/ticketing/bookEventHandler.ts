import * as StellarSdk from 'stellar-sdk'

export default (eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider, masterAsset, masterDistributor, { ticketQrUrl }) => async ({ requestSource, from }, eventTitle) => {
  console.log(`${requestSource}: ${from} start book event`)
  const messageSender = messagingProvider.get(requestSource)
  const formatter = messageFormatterProvider.get(requestSource)
  // Get Event by title
  const atBeginning = Date.now()
  let startTime = atBeginning
  const event = await eventStore.getByTitle(eventTitle)
  console.log(`get Event By Title: ${Date.now() - startTime}`); startTime = Date.now()

  if (!event) {
    console.error('EVENT_NOT_FOUND')
    return messageSender.sendMessage(from, `Sorry, we cannot not find your '${eventTitle}' event`)
  }

  console.log(`event: ${event.id}`)
  messageSender.sendMessage(from, `Hold on, we're now booking ${eventTitle} for you...`)

  let user = await userStore.getByRequstSource(requestSource, from)
  user = user || await userStore.createUserFromTemp(requestSource, from, masterAsset)

  console.log(`get User by RequstSource: ${Date.now() - startTime}`); startTime = Date.now()

  if (!user) {
    console.error('EVENT_NOT_FULL')
    return messageSender.sendMessage(from, `Sorry, the '${eventTitle}' event is fully booked out`)
  }

  if (user.bought_tickets && user.bought_tickets[event.id] && (Object.keys(user.bought_tickets[event.id]).length > 0)) {
    console.error('EVENT_ALREADY_BOOK')
    let retPromise = messageSender.sendMessage(from, 'You have already booked the event')

    const ticket = await eventStore.getTicketById(event.id, Object.keys(user.bought_tickets[event.id])[0])
    if (ticket) {
      console.log(JSON.stringify(ticket, null, 2))
      const currTicketUrl = `${ticketQrUrl}/${event.id}/${ticket.id}/${requestSource.toLowerCase()}_${from}/${ticket.bought_tx}`
      retPromise = retPromise.then(() => messageSender.sendMessage(from, 'Here is your ticket'))
      retPromise = retPromise.then(() => messageSender.sendImage(from, currTicketUrl, currTicketUrl))
      retPromise = retPromise.then(() => messageSender.sendCustomMessages(from, formatter.ticketTemplate(event, currTicketUrl)))
      console.log(currTicketUrl)
    }

    return retPromise
  }

  console.log(`user: ${user.id} ${user.publicKey}`)
  const unusedTicket = await eventStore.getUnusedTicket(event.id)
  console.log(`getUnusedTicket ${event.id}: ${Date.now() - startTime}`); startTime = Date.now()

  if (!unusedTicket) {
    console.error('EVENT_NOT_FULL')
    return messageSender.sendMessage(from, `Sorry, the '${eventTitle}' event is fully booked out`)
  }

  const userKey = StellarSdk.Keypair.fromPublicKey(user.publicKey)
  const tmpEvent = Object.assign({}, event)
  tmpEvent.asset = new StellarSdk.Asset(event.id, event.issuer)
  tmpEvent.distributor = StellarSdk.Keypair.fromPublicKey(event.distributor)

  const bought_tx = await stellarWrapper.doBookTicket(masterDistributor, masterAsset, userKey, tmpEvent, 1, `B:${tmpEvent.asset.getCode()}:${unusedTicket.id}`)
    .catch(() => null)
  console.log(`doBookTicket ${event.id}: ${Date.now() - startTime}`); startTime = Date.now()

  if (!bought_tx) {
    console.error('EVENT_BOOK_ERROR')
    return messageSender.sendMessage(from, 'Sorry, something went wrong. We will get back to you asap.')
  }

  await eventStore.updateBoughtTicket(user, tmpEvent, unusedTicket, bought_tx)
  await userStore.updateBoughtTicket(user.id, tmpEvent.id, unusedTicket.id)
  console.log(`updateBoughtTicket ${bought_tx}: ${Date.now() - startTime}`); startTime = Date.now()

  const ticketUrl = `${ticketQrUrl}/${tmpEvent.id}/${unusedTicket.id}/${requestSource.toLowerCase()}_${from}/${bought_tx}`
  console.log(ticketUrl)
  await messageSender.sendImage(from, ticketUrl, ticketUrl)
    .then(() => messageSender.sendMessage(from, `See you at '${eventTitle}'! Do show this QR when attend`))
  await messageSender.sendCustomMessages(from, formatter.ticketTemplate(event, ticketUrl))

  console.log(`total book time: ${Date.now() - atBeginning}`); startTime = Date.now()
  console.info('EVENT_BOOK_OK')
  return 'EVENT_BOOK_OK'
}
