const { fbTemplate } = require('claudia-bot-builder')
import * as StellarSdk from 'stellar-sdk'
import { default as firestoreRepoFactory } from './firestoreRepository'
import { default as eventStoreFactory } from './eventStore'
import { default as userStoreFactory } from './userStore'
import { default as stellarWrapperFactory } from './stellarWrapper'

export const ticketing = ({ firestore, stellarUrl, stellarNetwork, masterAssetCode, masterIssuerKey, masterDistributorKey }) => {

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

  const bookEvent = async (eventTitle) => {
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
    }
    catch (error) {
      throw new Error(`BOOKING_FAILED: ${error.message}`)
    }
    console.log(`make offer: ${Date.now() - startTime}`); startTime = Date.now()

    const confirmTicketUrl = `https://firebasestorage.googleapis.com/v0/b/ticketing-dlt-poc.appspot.com/o/qr%2Faec2e826501e801c0dd1f4c6d0068f2ae1df012701d07918c7ceb9553cff2379.png?alt=media&token=318ac652-e2ea-4c02-9150-975941d8f2d6`
    return ({
      "dialogflow":
        [
          {
            "image": {
              "imageUri": confirmTicketUrl
            }
          },
          {
            "text": {
              "text": [
                "See you at event! Do show this QR when attend"
              ]
            }
          }
        ]
    })
  }

  return {
    listEvent,
    bookEvent
  }
}
