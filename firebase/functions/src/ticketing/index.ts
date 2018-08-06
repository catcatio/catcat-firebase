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

  const stellarWrapper = stellarWrapperFactory(server, masterDistributor)
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
          'defaultAction': {
            'type': 'uri',
            'label': 'View detail',
            'uri': event.link
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

  const lineQuickReplyFormatter = (message, tx) => ({
    'type': 'text',
    'text': message,
    'quickReply': {
      'items': [
        {
          'type': 'action',
          'action': {
            'type': 'message',
            'label': 'Confirm',
            'text': `use ticket ${tx}`
          }
        },
        {
          'type': 'action',
          'action': {
            'type': 'message',
            'label': 'Cancel',
            'text': 'Cancel'
          }
        }
      ]
    }
  })

  const facebookQuickReplyFormatter = (message, tx) => {
    const text = new fbTemplate.Text(message);
    return text
      .addQuickReply('Confirm', `use ticket ${tx}`)
      .addQuickReply('Cancel', `cancel`)
      .get();
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
        const ticketUrl = `${qrcodeservice}${encodeURIComponent(`${ticketconfirmurl}${ticket.bought_tx}`)}`
        console.log(ticketUrl)
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

    const confirmTicketUrl = `${ticketconfirmurl}${bought_tx}`
    const qrCodeUrl = `${qrcodeservice}${encodeURIComponent(confirmTicketUrl)}`
    console.log(qrCodeUrl)

    await messageSender.sendImage(from, qrCodeUrl, qrCodeUrl)
      .then(() => messageSender.sendMessage(from, `See you at '${eventTitle}'! Do show this QR when attend`))

    console.log(`total book time: ${Date.now() - atBeginning}`); startTime = Date.now()
    console.info('EVENT_BOOK_OK')
    return 'EVENT_BOOK_OK'
  }

  const confirmTicket = async (tx) => {
    console.log(`start confirm ticket`)
    const atBeginning = Date.now()
    let startTime = atBeginning

    // Validate the ticket
    const txAction = await stellarWrapper.queryTransactionAction(tx)
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

    const ticket = await eventStore.getTicketById(txAction.eventId, txAction.ticketId)
    console.log(`get ticket ${txAction.eventId} ${txAction.ticketId}: ${Date.now() - startTime}`); startTime = Date.now()
    if (!ticket) {
      console.error('EVENT_TICKET_NOTFOUND')
      return Promise.reject('EVENT_TICKET_NOTFOUND')
    }

    const owner = await userStore.getUserById(ticket.owner_id)
    console.log(`get owner ${ticket.owner_id}: ${Date.now() - startTime}`); startTime = Date.now()
    if (!owner) {
      console.error('EVENT_OWNER_NOTFOUND')
      return Promise.reject('EVENT_OWNER_NOTFOUND')
    }

    // const messageSender = owner.providers.line ? line : facebook
    // const userAddress = owner.providers.line || owner.providers.facebook

    if (ticket.burnt_tx) {
      console.error('EVENT_TICKET_USED')
      return Promise.reject('EVENT_TICKET_USED')
    }

    const profile = owner.providers.line ? await line.getProfile(owner.providers.line) : null

    // post confirm options to organizer
    const orgAddress = event.providers.line || event.providers.facebook
    const provider = event.providers.line ? 'line' : 'facebook'
    const orgMessageSender = event.providers.line ? line : facebook
    const formatter = event.providers.line ? lineQuickReplyFormatter : facebookQuickReplyFormatter

    if (profile) {
      await orgMessageSender.sendMessage(orgAddress, `Attendee (${provider}): ${profile.displayName}`)
      await orgMessageSender.sendImage(orgAddress, profile.pictureUrl, profile.pictureUrl)
    }

    await orgMessageSender.sendCustomMessages(orgAddress, formatter(`Confirm using ticket '${event.title}'?`, tx))

    console.log(`total ticket confirm time: ${Date.now() - atBeginning}`); startTime = Date.now()
    console.info('EVENT_TICKET_CONFIRMED')
    return 'EVENT_TICKET_CONFIRMED'
  }

  const parseEventToken = (eventToken) => {
    if (!eventToken) return null

    const chunks = eventToken.split(':')
    if (chunks.length !== 2) return null

    return new StellarSdk.Asset(chunks[0], chunks[1])
  }

  const useTicket = async (tx, orgRequestParams) => {
    const orgMessageSender = orgRequestParams.requestSource === 'LINE' ? line : facebook

    // Validate the ticket
    const txAction = await stellarWrapper.queryTransactionAction(tx)
    if (!txAction || txAction.action !== 'B') {
      console.error('EVENT_TX_NOTFOUND')
      return orgMessageSender.sendMessage(orgRequestParams.from, 'Tx not found')
    }

    const event = await eventStore.getById(txAction.eventId)
    if (!event) {
      console.error('EVENT_NOTFOUND')
      return orgMessageSender.sendMessage(orgRequestParams.from, 'Event not found')
    }

    const ticket = await eventStore.getTicketById(txAction.eventId, txAction.ticketId)
    if (!ticket) {
      console.error('EVENT_TICKET_NOTFOUND')
      return orgMessageSender.sendMessage(orgRequestParams.from, 'Ticket not found')
    }

    const owner = await userStore.getUserById(ticket.owner_id)
    if (!owner) {
      console.error('EVENT_OWNER_NOTFOUND')
      return orgMessageSender.sendMessage(orgRequestParams.from, 'Owner not found')
    }

    const userMessageSender = owner.providers.line ? line : facebook
    const userAddress = owner.providers.line || owner.providers.facebook

    if (ticket.burnt_tx) {
      console.error('EVENT_TICKET_USED')
      return orgMessageSender.sendMessage(orgRequestParams.from, 'The ticket is used')
    }

    const asset = parseEventToken(ticket.event_token)
    const userKey = StellarSdk.Keypair.fromPublicKey(owner.publicKey)
    const burnt_tx = await stellarWrapper.transfer(userKey, asset.getIssuer(), 1, asset, `C:${txAction.eventId}:${txAction.ticketId}`)

    return eventStore.updateBurntTicket(txAction.eventId, txAction.ticketId, burnt_tx)
      .then(() => userStore.updateBurntTicket(owner.id, txAction.eventId, txAction.ticketId))
      .then(() => {
        userMessageSender.sendMessage(userAddress, `Welcome to '${event.title}'`)
        orgMessageSender.sendMessage(orgRequestParams.from, `Brunt Org '${ticket.event_id}'`)
      })
  }

  return {
    listEvent,
    bookEvent,
    confirmTicket,
    useTicket
  }
}
