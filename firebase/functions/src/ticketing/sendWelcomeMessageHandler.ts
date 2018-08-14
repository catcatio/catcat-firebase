export default (messagingProvider, messageFormatterProvider) => async ({ requestSource, from }) => {
  console.log(`send greeting message tp ${from}`)
  const messageSender = messagingProvider.get(requestSource)
  const formatter = messageFormatterProvider.get(requestSource)
  return messageSender && messageSender.sendCustomMessages(from, formatter.welcomeTemplate('Hi there, how can I help you?', 'Show Events', 'Nothing'))
}