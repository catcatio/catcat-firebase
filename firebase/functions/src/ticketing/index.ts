import { text } from "../../node_modules/@types/body-parser";

export const ticketing = ({ facebook, line }, { firestore, stellarUrl, stellarNetwork, masterAssetCode, masterIssuerKey, masterDistributorKey, qrcodeservice, fbaccesstoken, fburl, ticketconfirmurl }) => {
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
  const userStore = userStoreFactory(userRepository)

  const limitChar = (str, limit) => {
    return str.substr(0, limit)
  }

  const facebookEventListFormatter = (events) => {
    const generic = new fbTemplate.Generic()
    events.forEach(event => {
      generic.addBubble(event.title, event.subtitle)
        .addImage(event.coverImage)
        .addDefaultAction(event.url)
        .addButton('See more detail', event.url)
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
          'text': `${limitChar(event.subtitle, 60)}`,
          "defaultAction": {
            "type": "uri",
            "label": "View detail",
            "uri": event.url
          },
          'actions': [
            {
              'type': 'uri',
              'label': 'MORE',
              'uri': event.url
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
    // Get Event by title
    const atBeginning = Date.now()
    let startTime = atBeginning
    const event = await eventStore.getByTitle(eventTitle)
    console.log(`get Event By Title: ${Date.now() - startTime}`); startTime = Date.now()
    if (!event) {
      return Promise.reject(new Error('EVENT_NOTFOUND'))
    }

    const user = await userStore.getByPreInit(event.code)
    console.log(`get User By PreInit ${event.code}: ${Date.now() - startTime}`); startTime = Date.now()
    if (!user) {
      throw new Error('EVENT_FULL')
    }
    console.log(`user.userId: ${user.userId} ${user.account_id}`)

    try {
      const tx = await strllarWrapper.makeOffer(user.keypair, masterAsset, event.asset, 1, 1, `B:${event.asset.getCode()}:${user.uuid}`)

      if (tx) {
        await userStore.clearPreInit(user.userId)
      }

      console.log(`tx: ${tx}`)
      const confirmTicketUrl = `${ticketconfirmurl}${tx}`
      const qrCode = `${qrcodeservice}${encodeURI(confirmTicketUrl)}`

      userStore.addMemo(user.userId, `${from}:OK`)
      console.log(`user.userId (senderId): ${user.userId} ${from}, SUCCESS`)
      console.log(`make offer: ${Date.now() - startTime}`);
      console.log(`${from} total book time: ${Date.now() - atBeginning}`);

    const messageSender = requestSource === 'LINE' ? line : facebook
    return messageSender.sendImage(from, qrCode, qrCode)
      .then(() => messageSender.sendMessage(from, `See you at '${eventTitle}'! Do show this QR when attend`))
    }
    catch (error) {
      facebook.sendMessage(from, 'Sorry, something went wrong. We will get back to you asap.')
      userStore.clearPreInit(user.userId)
      userStore.addMemo(user.userId, `${from}:ERROR:${error.message}`)
      // throw new Error(`BOOKING_FAILED: ${error.message}`)
      console.log(`user.userId (senderId): ${user.userId} ${from}, BOOKING_FAILED: ${error.message}`)
      console.log(`make offer: ${Date.now() - startTime}`);
      console.log(`${from} total book time: ${Date.now() - atBeginning}`);
    }
  }

  return {
    listEvent,
    bookEvent
  }
}
