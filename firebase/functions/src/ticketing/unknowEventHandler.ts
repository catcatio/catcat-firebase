import { HrtimeMarker } from '../utils/hrtimeMarker'
import { Keypair } from 'stellar-sdk'

const isValidStellarPublicKey = (key) => {
  try {
    Keypair.fromPublicKey(key)
    return true
  } catch (error) {
    return false
  }
}

export default (stellarWrapper, messagingProvider, messageFormatterProvider) => {
  const sendWelcomeMessage = require('./sendWelcomeMessageHandler').default(messagingProvider, messageFormatterProvider)

  return async (isNewSession, { requestSource, from, languageCode, queryText }, ) => {
    const hrMarker = HrtimeMarker.create('unknownEvent')
    try {
      const formatter = messageFormatterProvider.get(requestSource)
      const messageSender = messagingProvider.get(requestSource)

      if (isValidStellarPublicKey(queryText)) {
        const accountInfo = await stellarWrapper.getBalanceInfo(queryText)
        messageSender.sendCustomMessages(from, formatter.balanceInfoTemplate(accountInfo))
        return true
      } else if (isNewSession) {
        sendWelcomeMessage({ requestSource, from, languageCode })
        return true
      }

      return false
    } finally {
      hrMarker.end().log()
    }
  }
}