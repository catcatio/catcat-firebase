import { IMessageingProvider } from '../messaging'
import { IFirebaseConfig } from '../firebaseConfig'

export const ticketing = (messagingProvider: IMessageingProvider, { firestore, stellarUrl, stellarNetwork, masterAssetCode, masterIssuerKey, masterDistributorKey, ticketConfirmUrl, ticketQrUrl, imageResizeService }: IFirebaseConfig) => {
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
  const providersRepository = firestoreRepoFactory(firestore, 'providers')
  const sessionsRepository = firestoreRepoFactory(firestore, 'sessions')
  const userStore = userStoreFactory(userRepository, tempUserRepository, providersRepository)

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
    console.log('number of events', events.length)
    return {
      'type': 'flex',
      'altText': 'Event list',
      'contents': {
        'type': 'carousel',
        'contents': events.map(event => ({
          'type': 'bubble',
          'hero': {
            'type': 'image',
            'size': 'full',
            'aspectRatio': '20:13',
            'aspectMode': 'cover',
            'url': event.coverImage
          },
          'body': {
            'type': 'box',
            'layout': 'vertical',
            'spacing': 'sm',
            'contents': [
              {
                'type': 'text',
                'text': event.title,
                'wrap': true,
                'weight': 'bold',
                'size': 'xl'
              },
              {
                'type': 'box',
                'layout': 'baseline',
                'contents': [
                  {
                    'type': 'text',
                    'text': `${limitChar(event.description, 60)}`,
                    'wrap': true,
                    'size': 'md',
                    'flex': 0
                  }
                ]
              },
              {
                'type': 'text',
                'text': `Remains ${40} from ${event.limit}`,
                'wrap': true,
                'weight': 'bold',
                'size': 'xs',
                'margin': 'md',
                'color': '#222222',
                'flex': 0
              }
            ]
          },
          'footer': {
            'type': 'box',
            'layout': 'vertical',
            'spacing': 'sm',
            'contents': [
              {
                'type': 'button',
                'style': 'primary',
                'action': {
                  'type': 'message',
                  'label': 'JOIN',
                  'text': `Join ${event.title}`,
                }
              },
              {
                'type': 'button',
                'action': {
                  'type': 'uri',
                  'label': 'MORE',
                  'uri': event.link
                }
              }
            ]
          }
        })),
      }
    }
  }

  const lineWelcomeMessageFormatter = (message, ...options) => {
    return {
      'type': 'text',
      'text': message,
      'quickReply': {
        'items': options.map(op => ({
          'type': 'action',
          'action': {
            'type': 'message',
            'label': op,
            'text': op
          }
        }))
      }
    }
  }

  const lineConfirmTemplateFormatter = (imageUrl, ownerDisplayName, ownerProvider, eventTitle, tx) => {
    console.log(`${imageResizeService}${encodeURIComponent(imageUrl)}`)
    return {
      'type': 'flex',
      'altText': `Confirm ticket ${eventTitle}`,
      'contents': {
        'type': 'bubble',
        'hero': {
          'type': 'image',
          'url': `${imageResizeService}${encodeURIComponent(imageUrl)}`,
          'size': 'full',
          'aspectRatio': '20:13',
          'aspectMode': 'cover'
        },
        'body': {
          'type': 'box',
          'layout': 'vertical',
          'spacing': 'md',
          'contents': [
            {
              'type': 'text',
              'text': `${ownerDisplayName} (${ownerProvider})`,
              'wrap': true,
              'weight': 'bold',
              'gravity': 'center',
              'size': 'xl'
            },
            {
              'type': 'text',
              'text': eventTitle,
              'wrap': true,
              'weight': 'bold',
              'gravity': 'center',
              'size': 'md'
            },
            {
              'type': 'button',
              'style': 'primary',
              'action': {
                'type': 'message',
                'label': 'CONFIRM',
                'text': `use ticket ${tx}`,
              }
            },
          ]
        }
      }
    }
  }

  const lineTicketBubbleFormatter = (event, ticketUrl) => {
    return {
      'type': 'bubble',
      'hero': {
        'type': 'image',
        'url': `${event.coverImage}`,
        'size': 'full',
        'aspectRatio': '20:13',
        'aspectMode': 'cover',
        'action': {
          'type': 'uri',
          'uri': event.link
        }
      },
      'body': {
        'type': 'box',
        'layout': 'vertical',
        'spacing': 'md',
        'contents': [
          {
            'type': 'text',
            'text': event.title,
            'wrap': true,
            'weight': 'bold',
            'gravity': 'center',
            'size': 'xl'
          },
          {
            'type': 'box',
            'layout': 'baseline',
            'margin': 'md',
            'contents': [
              {
                'type': 'icon',
                'size': 'sm',
                'url': 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png'
              },
              {
                'type': 'icon',
                'size': 'sm',
                'url': 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png'
              },
              {
                'type': 'icon',
                'size': 'sm',
                'url': 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png'
              },
              {
                'type': 'icon',
                'size': 'sm',
                'url': 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png'
              },
              {
                'type': 'icon',
                'size': 'sm',
                'url': 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gray_star_28.png'
              },
              {
                'type': 'text',
                'text': '4.0',
                'size': 'sm',
                'color': '#999999',
                'margin': 'md',
                'flex': 0
              }
            ]
          },
          {
            'type': 'box',
            'layout': 'vertical',
            'margin': 'lg',
            'spacing': 'sm',
            'contents': [
              {
                'type': 'box',
                'layout': 'baseline',
                'spacing': 'sm',
                'contents': [
                  {
                    'type': 'text',
                    'text': 'Date',
                    'color': '#aaaaaa',
                    'size': 'sm',
                    'flex': 1
                  },
                  {
                    'type': 'text',
                    'text': event.startDate,
                    'wrap': true,
                    'size': 'sm',
                    'color': '#666666',
                    'flex': 4
                  }
                ]
              },
              {
                'type': 'box',
                'layout': 'baseline',
                'spacing': 'sm',
                'contents': [
                  {
                    'type': 'text',
                    'text': 'Place',
                    'color': '#aaaaaa',
                    'size': 'sm',
                    'flex': 1
                  },
                  {
                    'type': 'text',
                    'text': '7 Floor, No.3',
                    'wrap': true,
                    'color': '#666666',
                    'size': 'sm',
                    'flex': 4
                  }
                ]
              },
              {
                'type': 'box',
                'layout': 'baseline',
                'spacing': 'sm',
                'contents': [
                  {
                    'type': 'text',
                    'text': 'Seats',
                    'color': '#aaaaaa',
                    'size': 'sm',
                    'flex': 1
                  },
                  {
                    'type': 'text',
                    'text': 'HUBBA',
                    'wrap': true,
                    'color': '#666666',
                    'size': 'sm',
                    'flex': 4
                  }
                ]
              }
            ]
          },
          {
            'type': 'box',
            'layout': 'vertical',
            'margin': 'xxl',
            'contents': [
              {
                'type': 'spacer'
              },
              {
                'type': 'image',
                'url': ticketUrl,
                'aspectMode': 'cover',
                'size': 'xl'
              },
              {
                'type': 'text',
                'text': 'You can enter the event by using this code instead of a ticket',
                'color': '#aaaaaa',
                'wrap': true,
                'margin': 'xxl',
                'size': 'xs'
              }
            ]
          }
        ]
      }
    }
  }

  const lineTicketTemplateFormatter = (event, ticketUrl) => {
    return {
      'type': 'flex',
      'altText': 'Here is your ticket',
      'contents': lineTicketBubbleFormatter(event, ticketUrl)
    }
  }

  // const facebookQuickReplyFormatter = (message, tx) => {
  //   const text = new fbTemplate.Text(message);
  //   return text
  //     .addQuickReply('Confirm', `use ticket ${tx}`)
  //     .addQuickReply('Cancel', `cancel`)
  //     .get();
  // }

  const listEvent = async ({ requestSource, from }) => {
    const events = await eventStore.getAllEvents()
    const formatter = requestSource === 'LINE' ? lineEventListFormatter : facebookEventListFormatter
    const messageSender = messagingProvider.get(requestSource)
    return messageSender.sendCustomMessages(from, formatter(events))
  }

  const bookEvent = async ({ requestSource, from }, eventTitle) => {
    console.log(`${requestSource}: ${from} start book event`)
    const messageSender = messagingProvider.get(requestSource)
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
        retPromise = retPromise.then(() => messageSender.sendCustomMessages(from, lineTicketTemplateFormatter(event, currTicketUrl)))
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

    // const confirmTicketUrl = `${ticketConfirmUrl}/${bought_tx}`
    // const qrCodeUrl = `${qrcodeservice}${encodeURIComponent(confirmTicketUrl)}`
    const ticketUrl = `${ticketQrUrl}/${tmpEvent.id}/${unusedTicket.id}/${requestSource.toLowerCase()}_${from}/${bought_tx}`
    console.log(ticketUrl)

    await messageSender.sendImage(from, ticketUrl, ticketUrl)
      .then(() => messageSender.sendMessage(from, `See you at '${eventTitle}'! Do show this QR when attend`))
    await messageSender.sendCustomMessages(from, lineTicketTemplateFormatter(event, ticketUrl))

    console.log(`total book time: ${Date.now() - atBeginning}`); startTime = Date.now()
    console.info('EVENT_BOOK_OK')
    return 'EVENT_BOOK_OK'
  }

  const confirmTicket = async (tx) => {
    console.log('start confirm ticket')
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

    const orgAddress = event.providers.line || event.providers.facebook
    // const provider = event.providers.line ? 'line' : 'facebook'
    const orgMessageSender = messagingProvider.get(event.providers)
    // const formatter = event.providers.line ? lineQuickReplyFormatter : facebookQuickReplyFormatter

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

    // const messageSender = owner.providers.line ? line : facebook
    // const userAddress = owner.providers.line || owner.providers.facebook

    if (ticket.burnt_tx) {
      console.error('EVENT_TICKET_USED')
      await orgMessageSender.sendMessage(orgAddress, `Ticket has been used ${tx}`)
      return Promise.reject('EVENT_TICKET_USED')
    }

    const ownerMessageSender = messagingProvider.get(owner.providers)
    const profile = owner.providers.line ? await ownerMessageSender.getProfile(owner.providers.line) : null
    const ownerProvider = owner.providers.line ? 'line' : 'facebook'
    // post confirm options to organizer
    if (profile) {
      console.log(profile.pictureUrl)
      const message = lineConfirmTemplateFormatter(profile.pictureUrl, profile.displayName, ownerProvider, event.title, tx)
      await orgMessageSender.sendCustomMessages(orgAddress, message)
      // await orgMessageSender.sendMessage(orgAddress, `Attendee (${provider}): ${profile.displayName}`)
      // await orgMessageSender.sendImage(orgAddress, profile.pictureUrl, profile.pictureUrl)
    }

    // await orgMessageSender.sendCustomMessages(orgAddress, formatter(`Confirm using ticket '${event.title}'?`, tx))

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
    const orgMessageSender = messagingProvider.get(orgRequestParams.requestSource)
    orgMessageSender.sendMessage(orgRequestParams.from, `Burning ticket ${tx}`)

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

    const userMessageSender = messagingProvider.get(owner.providers)
    const userAddress = owner.providers.line || owner.providers.facebook

    if (ticket.burnt_tx) {
      console.error('EVENT_TICKET_USED')
      return orgMessageSender.sendMessage(orgRequestParams.from, 'This thicket has been used')
    }

    const asset = parseEventToken(ticket.event_token)
    const userKey = StellarSdk.Keypair.fromPublicKey(owner.publicKey)
    const burnt_tx = await stellarWrapper.transfer(userKey, asset.getIssuer(), 1, asset, `C:${txAction.eventId}:${txAction.ticketId}`)

    return eventStore.updateBurntTicket(txAction.eventId, txAction.ticketId, burnt_tx)
      .then(() => userStore.updateBurntTicket(owner.id, txAction.eventId, txAction.ticketId))
      .then(() => {
        userMessageSender.sendMessage(userAddress, `Welcome to '${event.title}'`)
        orgMessageSender.sendMessage(orgRequestParams.from, `Ticket burnt ${tx}\n\n${burnt_tx}`)
      })
  }

  const getTicketParams = async ({ eventId, ticketId, userProvider, tx }) => {
    console.log('start get ticket params')
    const atBeginning = Date.now()
    let startTime = atBeginning
    const [provider, provierId] = userProvider.split('_')
    console.log(userProvider, provider, provierId)
    const messageSender = messagingProvider.get(provider)
    const profile = provider === 'line' ? (await messageSender.getProfile(provierId)) : {}
    console.log(`get user profile: ${Date.now() - startTime}`); startTime = Date.now()


    const confirmTicketUrl = `${ticketConfirmUrl}/${tx}`
    const params = {
      'text': confirmTicketUrl,
      'logoUrl': profile.pictureUrl || 'empty',
      'logoText': profile.displayName || 'anonymous',
      'maskTextLine1': eventId.substr(0, 4),
      'maskTextLine2': eventId.substr(5, 10)
    }
    console.log(params)
    console.log(`total getTicketParams time: ${Date.now() - atBeginning}`)
    return params
  }

  const sendWelcomeMessage = async ({ requestSource, from }) => {
    console.log(`send greeting message tp ${from}`)
    const messageSender = messagingProvider.get(requestSource)
    return messageSender && messageSender.sendCustomMessages(from, lineWelcomeMessageFormatter('Hi there, how can I help you?', 'Show Events', 'Nothing'))
  }

  const isNewSession = async ({ session, from }) => {
    const lastSession = await sessionsRepository.get(from)
    if (!lastSession || lastSession.session !== session) {
      await sessionsRepository.put(from, { session })
      return true
    }
    return false
  }

  return {
    listEvent,
    bookEvent,
    confirmTicket,
    useTicket,
    getTicketParams,
    sendWelcomeMessage,
    isNewSession,
  }
}
