import { IFirebaseConfig } from '../firebaseConfig'
import { IMessageingProvider } from '../messaging'
import recommendMessageHandler from './recommendMessageHandler'
import suggestionMessageHandler from './suggestionMessageHandler'
import makePaymentHandler from './makePaymentHandler'

export const bots = (messagingProvider: IMessageingProvider, firebaseConfig: IFirebaseConfig) => {
  const firestoreRepoFactory = require('../ticketing/firestoreRepository').default
  const suggestionStoreFactory = require('./suggestionStore').default

  const { firestore } = firebaseConfig
  const suggestionsRepository = firestoreRepoFactory(firestore, 'suggestions')
  const transactionsRepository = firestoreRepoFactory(firestore, 'transactions')
  const suggestionStore = suggestionStoreFactory(suggestionsRepository)

  return {
    recommend: recommendMessageHandler(messagingProvider, firebaseConfig),
    suggest: suggestionMessageHandler(suggestionStore, messagingProvider, firebaseConfig),
    makePayment: makePaymentHandler(messagingProvider, transactionsRepository, firebaseConfig)
  }
}