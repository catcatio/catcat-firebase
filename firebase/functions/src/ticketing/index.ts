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
  const memosRepository = firestoreRepoFactory(firestore, 'memos')
  const eventStore = eventStoreFactory(eventRepository, memosRepository)
  const userRepository = firestoreRepoFactory(firestore, 'users')
  const tempUserRepository = firestoreRepoFactory(firestore, 'tmpusers')
  const providersRepository = firestoreRepoFactory(firestore, 'providers')
  const sessionsRepository = firestoreRepoFactory(firestore, 'sessions')
  const transactionsRepository = firestoreRepoFactory(firestore, 'transactions')

  const userStore = userStoreFactory(userRepository, tempUserRepository, providersRepository)

  const listEvent = require('./listEventsHandle').default(eventStore, userStore, messagingProvider, messageFormatterProvider)
  const bookEvent = require('./bookEventHandler').default(eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider, masterAsset, masterDistributor, firebaseConfig)
  const buyEvent = require('./buyEventHandler').default(eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider, masterAsset, masterDistributor, transactionsRepository, firebaseConfig)
  const confirmPayment = require('./confirmPaymentEventHandler').default(eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider, masterAsset, masterDistributor, transactionsRepository, firebaseConfig)
  const useTicket = require('./useTicketHandler').default(eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider)
  const confirmTicket = require('./confirmTicketHandler').default(eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider)
  const getTicketParams = require('./getTicketParams').default(messagingProvider, firebaseConfig)
  const handleUnknownEvent = require('./unknowEventHandler').default(stellarWrapper, messagingProvider, messageFormatterProvider)
  const sendWelcomeMessage = require('./sendWelcomeMessageHandler').default(messagingProvider, messageFormatterProvider)
  const isNewSession = require('./isNewSessionHander').default(sessionsRepository)
  const viewTicket = require('./viewTicketHandler').default(eventStore, userStore, messagingProvider, messageFormatterProvider, firebaseConfig)
  const walletBalance = require('./walletBalanceHandler').default(userStore, stellarWrapper, messagingProvider, messageFormatterProvider)
  const sendIcs = require('./sendIcsHandler').default(eventStore, userStore, messagingProvider, messageFormatterProvider, firebaseConfig)

  const setupAfterEvent = async ({eventId}) => {
    console.log(`setupAfterEvent for ${eventId}`)
  }

  const processAfterEvent = async ({eventId, userId}) => {
    console.log(`processAfterEvent for ${eventId} ${userId}`)
  }

  return {
    listEvent,
    bookEvent,
    confirmTicket,
    useTicket,
    buyEvent,
    confirmPayment,
    getTicketParams,
    handleUnknownEvent,
    isNewSession,
    sendWelcomeMessage,
    viewTicket,
    walletBalance,
    setupAfterEvent,
    processAfterEvent,
    sendIcs
  }
}
