import { IMessageingProvider } from '../messaging'
import { IFirebaseConfig } from '../firebaseConfig'
import { initMessageFormatterProvider } from './formatterProvider'

export const ticketing = (messagingProvider: IMessageingProvider, firebaseConfig: IFirebaseConfig) => {
  const { firestore, stellarUrl, stellarNetwork, masterAssetCode, masterIssuerKey, masterDistributorKey } = firebaseConfig
  const StellarSdk = require('stellar-sdk')
  const firestoreRepoFactory = require('./firestoreRepository').default
  const eventStoreFactory = require('./eventStore').default
  const userStoreFactory = require('./userStore').default
  const stellarWrapperFactory = require('./stellarWrapper').default
  const messageFormatterProvider = initMessageFormatterProvider(firebaseConfig)

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

  const listEvent = require('./listEventsHandle').default(eventStore, messagingProvider, messageFormatterProvider)
  const bookEvent = require('./bookEventHandler').default(eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider, masterAsset, masterDistributor, firebaseConfig)
  const confirmTicket = require('./confirmTicketHandler').default(eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider)
  const useTicket = require('./useTicketHandler').default(eventStore, userStore, stellarWrapper, messagingProvider)
  const getTicketParams = require('./getTicketParams').default(messagingProvider, firebaseConfig)
  const sendWelcomeMessage = require('./sendWelcomeMessageHandler').default(messagingProvider, messageFormatterProvider)
  const isNewSession = require('./isNewSessionHander').default(sessionsRepository)

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
