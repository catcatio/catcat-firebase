const facebookClient = (fburl, fbaccesstoken) => {
  const { postJSON } = require('@rabbotio/fetcher')
  const url = `${fburl}?access_token=${fbaccesstoken}`
  const sendImageToFacebook = async (recipientId, imageUrl) => {
    const payload = {
      "messaging_type": "NON_PROMOTIONAL_SUBSCRIPTION",
      "recipient": {
        "id": recipientId
      },
      "message": {
        "attachment": {
          "type": "image",
          "payload": {
            "is_reusable": true,
            "url": imageUrl
          }
        }
      }
    }
    return postJSON(url, payload).catch(err => console.log(err))
  }

  const sendMessage = async (recipientId, text) => {
    const payload = {
      "messaging_type": "NON_PROMOTIONAL_SUBSCRIPTION",
      "recipient": {
        "id": recipientId
      },
      "message": {
        text
      }
    }
    return postJSON(url, payload).catch(err => console.log(err))
  }

  return {
    sendImageToFacebook,
    sendMessage
  }
}

export const ticketing = ({ firestore, stellarUrl, stellarNetwork, masterAssetCode, masterIssuerKey, masterDistributorKey, qrcodeservice, fbaccesstoken, fburl, ticketconfirmurl }) => {
  const { fbTemplate } = require('claudia-bot-builder')
  const StellarSdk = require('stellar-sdk')
  const firestoreRepoFactory = require('./firestoreRepository').default
  const eventStoreFactory = require('./eventStore').default
  const userStoreFactory = require('./userStore').default
  const stellarWrapperFactory = require('./stellarWrapper').default

  const fbClient = facebookClient(fburl, fbaccesstoken)

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

  const listEvent = async () => {
    const events = await eventStore.getAllEvents()
    const generic = new fbTemplate.Generic()
    events.forEach(event => {
      generic.addBubble(event.title, event.subtitle)
        .addImage(event.coverImage)
        .addDefaultAction(event.url)
        .addButton('See more detail', event.url)
        .addButton(`Join ${event.title}`, `Join ${event.title}`)
    })
    return {
      "facebook": generic.get()
    }
  }

  const bookEvent = async (senderId, eventTitle) => {
    // Get Event by title
    let startTime = Date.now()
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
    console.log(`user: ${user.account_id}`)

    try {
      const tx = await strllarWrapper.makeOffer(user.keypair, masterAsset, event.asset, 1, 1, `B:${event.asset.getCode()}:${user.uuid}`)

      if (tx) {
        console.log(`user.userId: ${user.userId}`)
        await userStore.clearPreInit(user.userId)
      }

      console.log(`tx: ${tx}`)
      const confirmTicketUrl = `${ticketconfirmurl}${tx}`
      const qrCode = `${qrcodeservice}${encodeURI(confirmTicketUrl)}`

      userStore.addMemo(user.userId, `${senderId}:OK`)
      return fbClient.sendImageToFacebook(senderId, qrCode)
      // TODO: handle failure case
    }
    catch (error) {
      fbClient.sendMessage(senderId, 'Sorry, something went wrong. We will get back to you asap.')
      userStore.clearPreInit(user.userId)
      userStore.addMemo(user.userId, `${senderId}:ERROR:${error.message}`)
      throw new Error(`BOOKING_FAILED: ${error.message}`)
    }
    console.log(`make offer: ${Date.now() - startTime}`); startTime = Date.now()
  }

  return {
    listEvent,
    bookEvent
  }
}
