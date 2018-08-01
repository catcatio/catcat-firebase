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
        const newEvent = Object.assign({}, stellarEvent, event)
        await eventRepository.put(event.code, newEvent)
        return Event.fromJSON(newEvent)
      })
  }

  const getAllEvents = () => {
    return eventRepository.all()
  }

  const get = async (eventCode) => {
    const event = await eventRepository.get(eventCode)
    if (event) {
      return Event.fromJSON(event)
    }
    return null
  }

  const getByTitle = async (title) => {
    const events = await eventRepository.query('title', title)
    return events && events.length > 0 ? events[0] : null
  }

  const getUnusedTicket = async (eventId) => {
    const ticketsCollection = eventRepository.collection.doc(eventId).collection('tickets')
    const ret = await ticketsCollection.where('bought_tx', '==', '').limit(1).get()
      .then(x => x.docs.map(doc => doc.data()))
      .catch(err => {
        console.log('Error getting documents', err)
        return []
      })

    return ret.length > 0 ? ret[0] : null
  }

  const updateBoughtTicket = async (user, event, ticket, bought_tx) => {
    const ticketsCollection = eventRepository.collection.doc(event.id).collection('tickets')
    return await ticketsCollection.doc(ticket.id).update({
      bought_tx,
      owner_token: `${event.asset.getCode()}:${event.asset.getIssuer()}`,
      owner_id: user.id,
      owned_date: new Date().toISOString()
    }).then(() => ({
      ticket_id: ticket.id,
      event_id: event.id
    }))
  }

  return {
    setEventCreator,
    getOrCreate,
    getAllEvents,
    getByTitle,
    get,
    getUnusedTicket,
    updateBoughtTicket
  }
}

export default eventStoreFactory