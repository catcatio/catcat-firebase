const eventStoreFactory = (eventRepository, memosRepository) => {
  const getAllEvents = () => {
    return eventRepository.all()
  }

  const getById = async (eventId) => {
    return await eventRepository.get(eventId)
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

  const getTicketById = async (eventId, ticketId) => {
    const ticketsCollection = eventRepository.collection.doc(eventId).collection('tickets')
    return await ticketsCollection.doc(ticketId).get()
      .then(doc => {
        if (!doc.exists) {
          return null
        } else {
          return doc.data()
        }
      })
  }

  const incrementTicketCount = async (eventId, fieldName, amount) => {
    const currentBoughtTicketCount = (await getById(eventId))[fieldName] || 0
    return eventRepository.update(eventId, {
      [fieldName]: currentBoughtTicketCount + amount
    })
  }

  const incrementBoughtTicketCount = async (eventId, amount = 1) => {
    return incrementTicketCount(eventId, 'ticket_bought', amount)
  }

  const incrementBurntTicketCount = async (eventId, amount = 1) => {
    return incrementTicketCount(eventId, 'ticket_burnt', amount)
  }

  const updateBoughtTicket = async (user, event, ticket, bought_tx, languageCode) => {
    await incrementBoughtTicketCount(event.id)

    const ticketsCollection = eventRepository.collection.doc(event.id).collection('tickets')
    return await ticketsCollection.doc(ticket.id).update({
      bought_tx,
      owner_token: `${event.asset.getCode()}:${event.asset.getIssuer()}`,
      owner_id: user.id,
      owned_date: new Date().toISOString(),
      language_code: languageCode
    }).then(() => ({
      ticket_id: ticket.id,
      event_id: event.id
    }))
  }

  const updateBurntTicket = async (eventId, ticketId, burnt_tx) => {
    await incrementBurntTicketCount(eventId)

    const ticketsCollection = eventRepository.collection.doc(eventId).collection('tickets')
    return await ticketsCollection.doc(ticketId).update({
      burnt_tx,
      burnt_date: new Date().toISOString()
    })
  }

  const saveMemo = (tx: string, memo: string) => {
    console.log('saveMemo', tx, memo)
    return memosRepository.put(tx, { tx, memo })
  }

  const parseTxAction = (memoText) => {
    if (!memoText) return null

    const chunks = memoText.split(':')
    if (chunks.length !== 3) return null

    return { action: chunks[0], eventId: chunks[1], ticketId: chunks[2] }
  }

  const getMemo = async (tx: string) => {
    const memo = await memosRepository.get(tx)
    return memo ? parseTxAction(memo.memo) : null
  }

  return {
    getAllEvents,
    getByTitle,
    getById,
    getUnusedTicket,
    getTicketById,
    updateBoughtTicket,
    updateBurntTicket,
    saveMemo,
    getMemo
  }
}

export default eventStoreFactory