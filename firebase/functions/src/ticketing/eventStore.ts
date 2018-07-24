import { Event } from './Event'


const eventStoreFactory = (eventRepository) => {
  let stellarEventCreator = null

  const setEventCreator = (eventCreator) => {
    stellarEventCreator = eventCreator
  }

  const getOrCreate = async (event) => {
    const createdEvent  = await eventRepository.get(event.code)
    if (createdEvent) {
      return Event.fromJSON(createdEvent)
    }

    return stellarEventCreator(event.code, event.limit)
      .then(async stellarEvent => {
        console.log(`new event created: ${stellarEvent.code}`)
        let newEvent = Object.assign({}, stellarEvent, event)
        await eventRepository.put(event.code, newEvent)
        return Event.fromJSON(newEvent)
      })
  }

  const getAllEvents = () => {
    return eventRepository.all()
  }

  const get = async (eventCode) => {
    let event = await eventRepository.get(eventCode)
    if (event) {
      return Event.fromJSON(event)
    }
    return null
  }

  const getByTitle = async (title) => {
    let events = await eventRepository.query('title', title)
    return events && events.length > 0 ? Event.fromJSON(events[0]) : null

  }

  return {
    setEventCreator,
    getOrCreate,
    getAllEvents,
    getByTitle,
    get
  }
}

export default eventStoreFactory