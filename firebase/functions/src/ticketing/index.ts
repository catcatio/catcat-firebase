export const ticketing = (facebook, { firestore, stellarUrl, stellarNetwork, masterAssetCode, masterIssuerKey, masterDistributorKey, qrcodeservice, fbaccesstoken, fburl, ticketconfirmurl }) => {
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
    console.log(`user.userId: ${user.userId} ${user.account_id}`)

    try {
      const tx = await strllarWrapper.makeOffer(user.keypair, masterAsset, event.asset, 1, 1, `B:${event.asset.getCode()}:${user.uuid}`)

      if (tx) {
        await userStore.clearPreInit(user.userId)
      }

      console.log(`tx: ${tx}`)
      const confirmTicketUrl = `${ticketconfirmurl}${tx}`
      const qrCode = `${qrcodeservice}${encodeURI(confirmTicketUrl)}`

      userStore.addMemo(user.userId, `${senderId}:OK`)
      console.log(`user.userId (senderId): ${user.userId} ${senderId}, SUCCESS`)
      console.log(`make offer: ${Date.now() - startTime}`); startTime = Date.now()
      return facebook.sendImageToFacebook(senderId, qrCode)
        .then(() => facebook.sendMessage(senderId, `See you at "${eventTitle}"! Do show this QR when attend`))
      // TODO: handle failure case
    }
    catch (error) {
      facebook.sendMessage(senderId, 'Sorry, something went wrong. We will get back to you asap.')
      userStore.clearPreInit(user.userId)
      userStore.addMemo(user.userId, `${senderId}:ERROR:${error.message}`)
      // throw new Error(`BOOKING_FAILED: ${error.message}`)
      console.log(`user.userId (senderId): ${user.userId} ${senderId}, BOOKING_FAILED: ${error.message}`)
      console.log(`make offer: ${Date.now() - startTime}`); startTime = Date.now()
    }
  }

  return {
    listEvent,
    bookEvent
  }
}
