import { IFirebaseConfig } from '../firebaseConfig'
import { IMessageingProvider } from '../messaging'

export default (suggestionStore, messagingProvider: IMessageingProvider, firebaseConfig: IFirebaseConfig) => {
  return (suggestion, { requestSource, from, languageCode }) => {
    console.log(suggestion)
    suggestionStore.addSuggestion(from, suggestion)
    const messageSender = messagingProvider.get(requestSource)
    return messageSender.sendMessage(from, languageCode === 'th' ? 'รับทราบจ้า' : 'Ok, thanks')
  }
}