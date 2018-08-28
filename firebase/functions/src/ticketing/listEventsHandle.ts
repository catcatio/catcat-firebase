import { HrtimeMarker } from '../utils/hrtimeMarker'

export default (eventStore, userStore, messagingProvider, messageFormatterProvider) => {

  return async ({ requestSource, from, languageCode }) => {
    const user = await userStore.getByRequstSource(requestSource, from)
    const bookedTicket = !user? [] : Object.keys(user.bought_tickets).filter(k => Object.keys(user.bought_tickets[k]).length > 0)

    const hrMarker = HrtimeMarker.create('listEvents')
    const getAllEventsMarker = hrMarker.mark('getAllEvents')
    const events = await eventStore.getAllEvents()
    getAllEventsMarker.end().log()
    console.log('number of events: ', events.length)
    const formatter = messageFormatterProvider.get(requestSource)
    const messageSender = messagingProvider.get(requestSource)
    return messageSender.sendCustomMessages(from, formatter.listEvents(events, bookedTicket, languageCode))
      .then(ret => {
        hrMarker.end().log()
        return ret
      })

  }
}