import { HrtimeMarker } from '../utils/hrtimeMarker'

export default (userStore, stellarWrapper, messagingProvider, messageFormatterProvider) => {
  return async ({ requestSource, from, languageCode }) => {
    const hrMarker = HrtimeMarker.create('walletbalance')
    try {
      const formatter = messageFormatterProvider.get(requestSource)
      const messageSender = messagingProvider.get(requestSource)

      const user = await userStore.getByRequstSource(requestSource, from)
      const accountInfo = user
        ? await stellarWrapper.getBalanceInfo(user.publicKey)
        : null
      messageSender.sendCustomMessages(from, formatter.balanceInfoTemplate(user.publicKey, accountInfo, languageCode))

      return true
    } finally {
      hrMarker.end().log()
    }
  }
}