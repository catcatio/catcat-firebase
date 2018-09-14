import { HrtimeMarker } from '../utils/hrtimeMarker'

export default (eventStore, userStore, messagingProvider, messageFormatterProvider, { ticketQrUrl }) => {

  return async ({ requestSource, from, languageCode }) => {
    const user = await userStore.getByRequstSource(requestSource, from)
    const messageSender = messagingProvider.get(requestSource)
    const formatter = messageFormatterProvider.get(requestSource)
    await messageSender.sendMessage(from, languageCode === 'th'
      ? 'รอแปร๊บนะ...'
      : 'Checking...')

    if (!user || !user.bought_tickets || (Object.keys(user.bought_tickets).length <= 0)) {
      console.error('EVENT_BOOK_EMPTY')
      const msg = languageCode === 'th'
        ? 'เคยจองตั๋วหรือยัง ลองจองตั๋วก่อนนะ'
        : 'Cannot find your ticket, please try booking one'
      return messageSender.sendMessage(from, msg)
    }

    const boughtEvents = Object.keys(user.bought_tickets)
    const ticketTasks = []
    const eventTasks = []
    boughtEvents.filter(eid => Object.keys(user.bought_tickets[eid]).length > 0)
      .forEach(eid => {
        const tid = Object.keys(user.bought_tickets[eid])[0]
        const ticket = eventStore.getTicketById(eid, tid)
        const event = eventStore.getById(eid)
        ticketTasks.push(ticket)
        eventTasks.push(event)
      })
    const tickets = await Promise.all(ticketTasks)
    const events = await Promise.all(eventTasks)

    if (tickets && tickets.length > 0) {
      const msg = languageCode === 'th'
      ? 'นี่คือตั๋วของคุณ'
      : 'Here is your ticket'
      await messageSender.sendMessage(from, msg)
      tickets.forEach((ticket, index) => {
        const event = events[index]
        const currTicketUrl = `${ticketQrUrl}/${ticket.event_id}/${ticket.id}/${requestSource.toLowerCase()}_${from}/${ticket.bought_tx}`
        messageSender.sendCustomMessages(from, formatter.ticketTemplate(event, currTicketUrl))
      })
    } else {
      console.error('EVENT_NOT_FOUND')
      const msg = languageCode === 'th'
        ? 'ขอโทษทีนะ หาไม่เจอจริง ๆ ลองใหม่อีกครั้งนะ'
        : 'Sorry, I cannot find you ticket T-T. Please try again.'
      return messageSender.sendMessage(from, msg)
    }
  }
}