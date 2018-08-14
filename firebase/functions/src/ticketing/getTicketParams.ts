export default (messagingProvider, { useTicketUrl }) => async ({ eventId, ticketId, userProvider, tx }) => {
  console.log('start get ticket params')
  const atBeginning = Date.now()
  let startTime = atBeginning
  const [provider, provierId] = userProvider.split('_')
  console.log(userProvider, provider, provierId)
  const messageSender = messagingProvider.get(provider)
  const profile = provider === 'line' ? (await messageSender.getProfile(provierId)) : {}
  console.log(`get user profile: ${Date.now() - startTime}`); startTime = Date.now()


  const confirmTicketUrl = `${useTicketUrl}/${tx}`
  const params = {
    'text': confirmTicketUrl,
    'logoUrl': profile.pictureUrl || 'empty',
    'logoText': profile.displayName || 'anonymous',
    'maskTextLine1': eventId.substr(0, 4),
    'maskTextLine2': eventId.substr(5, 10)
  }
  console.log(params)
  console.log(`total getTicketParams time: ${Date.now() - atBeginning}`)
  return params
}