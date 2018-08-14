export default (eventStore, messagingProvider, messageFormatterProvider) => {
  return async ({ requestSource, from }) => {
    const events = await eventStore.getAllEvents()
    const formatter = messageFormatterProvider.get(requestSource)
    console.log(messagingProvider)
    const messageSender = messagingProvider.get(requestSource)
    return messageSender.sendCustomMessages(from, formatter.listEvents(events))
  }
}