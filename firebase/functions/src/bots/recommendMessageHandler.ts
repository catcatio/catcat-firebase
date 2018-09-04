import { IFirebaseConfig } from '../firebaseConfig'
import { IMessageingProvider } from '../messaging'
import lineMessageFormatter from './lineMessageFormatter'

export default (messagingProvider: IMessageingProvider, firebaseConfig: IFirebaseConfig) => {
  const { recommendTemplate } = lineMessageFormatter()

  return ({ requestSource, from, languageCode }) => {
    const recommendObj = recommendTemplate(firebaseConfig.botLineId, languageCode)
    const messageSender = messagingProvider.get(requestSource)
    console.log(JSON.stringify(recommendObj))
    return messageSender.sendCustomMessages(from, recommendObj)
  }
}