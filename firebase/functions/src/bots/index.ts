import { IFirebaseConfig } from '../firebaseConfig'
import { IMessageingProvider } from '../messaging'

export const bots = (messagingProvider: IMessageingProvider, firebaseConfig: IFirebaseConfig) => {

  const shareIdUrl = `line://nv/recommendOA/${firebaseConfig.botLineId}`
  const shareMessageHandler = ({ requestSource, from }) => {
    const messageSender = messagingProvider.get(requestSource)
    return messageSender.sendMessage(from, shareIdUrl)
  }

  return {
    share: shareMessageHandler
  }
}