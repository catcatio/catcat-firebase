import { HrtimeMarker } from '../utils/hrtimeMarker'

export default (messagingProvider, { useTicketUrl }) => async ({ eventId, ticketId, userProvider, tx }) => {
  const hrMarker = HrtimeMarker.create('getTicketParams')
  console.log('start get ticket params')
  const [provider, provierId] = userProvider.split('_')
  console.log(userProvider, provider, provierId)
  const marker = hrMarker.mark('get')
  const messageSender = messagingProvider.get(provider)
  const profile = provider === 'line' ? (await messageSender.getProfile(provierId)) : {}
  marker.end().log()

  const confirmTicketUrl = `${useTicketUrl}/${tx}`
  const firstZeroIndex = eventId.indexOf('0')
  const spliterIndex = firstZeroIndex < 0 || firstZeroIndex > 4 ? 4 : firstZeroIndex
  const params = {
    'text': confirmTicketUrl,
    'logoUrl': profile.pictureUrl || 'empty',
    'logoText': profile.displayName || 'anonymous',
    'maskTextLine1': eventId.substr(0, spliterIndex),
    'maskTextLine2': eventId.substr(spliterIndex + 1, 10)
  }
  console.log(params)
  hrMarker.end().log()
  return params
}