export default (eventStore, messagingProvider, messageFormatterProvider) => {
  return async ({ requestSource, from }) => {
    const events = await eventStore.getAllEvents()
    console.log('number of events: ', events.length)
    const formatter = messageFormatterProvider.get(requestSource)
    const messageSender = messagingProvider.get(requestSource)
    return messageSender.sendCustomMessages(from, formatter.listEvents(events))
  }
}