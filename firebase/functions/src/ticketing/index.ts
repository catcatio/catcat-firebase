export const ticketing = ({ facebook, line }, { firestore, stellarUrl, stellarNetwork, masterAssetCode, masterIssuerKey, masterDistributorKey, qrcodeservice, ticketconfirmurl }) => {
  const { fbTemplate } = require('claudia-bot-builder')
  const StellarSdk = require('stellar-sdk')
  const firestoreRepoFactory = require('./firestoreRepository').default
  const eventStoreFactory = require('./eventStore').default
  const userStoreFactory = require('./userStore').default
  const stellarWrapperFactory = require('./stellarWrapper').default

  const masterDistributor = StellarSdk.Keypair.fromSecret(masterDistributorKey)
  const masterIssuer = StellarSdk.Keypair.fromSecret(masterIssuerKey)
  const masterAsset = new StellarSdk.Asset(masterAssetCode, masterIssuer.publicKey())

  const server = new StellarSdk.Server(stellarUrl)
  if (stellarNetwork !== 'live') StellarSdk.Network.useTestNetwork()

  const strllarWrapper = stellarWrapperFactory(server, masterDistributor)
  const eventRepository = firestoreRepoFactory(firestore, 'events')
  const eventStore = eventStoreFactory(eventRepository)
  const userRepository = firestoreRepoFactory(firestore, 'users')
  const tempUserRepository = firestoreRepoFactory(firestore, 'tmpusers')
  const userStore = userStoreFactory(userRepository, tempUserRepository)

  const limitChar = (str, limit) => {
    return str.substr(0, limit)
  }

  const facebookEventListFormatter = (events) => {
    const generic = new fbTemplate.Generic()
    events.forEach(event => {
      generic.addBubble(event.title, event.description)
        .addImage(event.coverImage)
        .addDefaultAction(event.link)
        .addButton('See more detail', event.link)
        .addButton(`Join ${event.title}`, `Join ${event.title}`)
    })
    return generic.get()
  }

  const lineEventListFormatter = (events) => {
    return {
      'type': 'template',
      'altText': 'Here is list of events',
      'template': {
        'type': 'carousel',
        'actions': [],
        'columns': events.map(event => ({
          'thumbnailImageUrl': event.coverImage,
          'title': event.title,
          'text': `${limitChar(event.description, 60)}`,
          "defaultAction": {
            "type": "uri",
            "label": "View detail",
            "uri": event.link
          },
          'actions': [
            {
              'type': 'uri',
              'label': 'MORE',
              'uri': event.link
            },
            {
              'type': 'postback',
              'label': `JOIN`,
              'text': `Join ${event.title}`,
              'data': `Join ${event.title}`
            }
          ]
        }))
      }
    }
  }

  const listEvent = async ({ requestSource, from }) => {
    const events = await eventStore.getAllEvents()
    const formatter = requestSource === 'LINE' ? lineEventListFormatter : facebookEventListFormatter
    const messageSender = requestSource === 'LINE' ? line : facebook
    return messageSender.sendCustomMessages(from, formatter(events))
  }

  const bookEvent = async ({ requestSource, from }, eventTitle) => {
    console.log(`${requestSource}: ${from} start book event`)
    const messageSender = requestSource === 'LINE' ? line : facebook
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

    let user = await userStore.getByRequstSource(requestSource, from)
    user = user || await userStore.createUserFromTemp(requestSource, from, masterAsset)

    console.log(`get User by RequstSource: ${Date.now() - startTime}`); startTime = Date.now()

    if (!user) {
      console.error('EVENT_NOT_FULL')
      return messageSender.sendMessage(from, `Sorry, the '${eventTitle}' event is fully booked out`)
    }

    if (user.bought_tickets && user.bought_tickets[event.id] && (Object.keys(user.bought_tickets[event.id]).length > 0)) {
      console.error('EVENT_ALREADY_BOOK')
      let retPromise = messageSender.sendMessage(from, `You already have booked the event`)

      const ticket = await eventStore.getTicketById(event.id, Object.keys(user.bought_tickets[event.id])[0])
      if (ticket) {
        console.log(JSON.stringify(ticket, null, 2))
        const ticketUrl = `${qrcodeservice}${encodeURI(`${ticketconfirmurl}${ticket.bought_tx}`)}`
        retPromise = retPromise.then(() => messageSender.sendMessage(from, `Here is your ticket`))
        retPromise = retPromise.then(() => messageSender.sendImage(from, ticketUrl, ticketUrl))
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

    const bought_tx = await strllarWrapper.doBookTicket(masterDistributor, masterAsset, userKey, tmpEvent, 1, `B:${tmpEvent.asset.getCode()}:${unusedTicket.id}`)
      .catch(() => null)
    console.log(`doBookTicket ${event.id}: ${Date.now() - startTime}`); startTime = Date.now()

    if (!bought_tx) {
      console.error('EVENT_BOOK_ERROR')
      return messageSender.sendMessage(from, 'Sorry, something went wrong. We will get back to you asap.')
    }

    await eventStore.updateBoughtTicket(user, tmpEvent, unusedTicket, bought_tx)
    await userStore.updateBoughtTicket(user.id, tmpEvent.id, unusedTicket.id)
    console.log(`updateBoughtTicket ${bought_tx}: ${Date.now() - startTime}`); startTime = Date.now()

    const confirmTicketUrl = `${ticketconfirmurl}${bought_tx}`
    const qrCodeUrl = `${qrcodeservice}${encodeURI(confirmTicketUrl)}`

    await messageSender.sendImage(from, qrCodeUrl, qrCodeUrl)
      .then(() => messageSender.sendMessage(from, `See you at '${eventTitle}'! Do show this QR when attend`))

    console.log(`total book time: ${Date.now() - atBeginning}`); startTime = Date.now()
    console.info('EVENT_BOOK_OK')
    return 'EVENT_BOOK_OK'
  }

  const confirmTicket = async (tx) => {
    // Validate the ticket
  }

  const useTicket = async (tx) => {
    // Burn the ticket
  }

  return {
    listEvent,
    bookEvent,
    confirmTicket,
    useTicket
  }
}
