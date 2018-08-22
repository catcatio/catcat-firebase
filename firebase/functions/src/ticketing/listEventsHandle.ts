import { HrtimeMarker } from '../utils/hrtimeMarker'

export default (eventStore, messagingProvider, messageFormatterProvider) => {

  return async ({ requestSource, from, languageCode }) => {
    const hrMarker = HrtimeMarker.create('listEvents')
    const getAllEventsMarker = hrMarker.mark('getAllEvents')
    const events = await eventStore.getAllEvents()
    getAllEventsMarker.end().log()
    console.log('number of events: ', events.length)
    const formatter = messageFormatterProvider.get(requestSource)
    const messageSender = messagingProvider.get(requestSource)
    return messageSender.sendCustomMessages(from, formatter.listEvents(events, languageCode))
      .then(ret => {
        hrMarker.end().log()
        return ret
      })

  }
}