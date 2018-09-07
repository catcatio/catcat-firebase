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
      console.error('EVENT_BOOK_FULL')
      const msg = languageCode === 'th'
        ? 'เคยจองตั๋วหรือยัง ลองจองตั๋วก่อนนะ'
        : 'Cannot find your ticket, please try booking one'
      return messageSender.sendMessage(from, msg)
    }

    const boughtEvents = Object.keys(user.bought_tickets)
    const eventId = boughtEvents[0]
    const event = await eventStore.getById(eventId)
    if (Object.keys(user.bought_tickets[eventId]).length <= 0) {
      console.error('EVENT_ALREADY_USED')
      const msg = languageCode === 'th'
        ? 'ใช้ตั๋วไปแล้วนี่นา...'
        : 'You have used your ticket'
      return messageSender.sendMessage(from, msg)
    }

    const ticketId = Object.keys(user.bought_tickets[eventId])[0]
    const ticket = await eventStore.getTicketById(eventId, ticketId)

    if (ticket) {
      console.log(JSON.stringify(ticket, null, 2))
      const currTicketUrl = `${ticketQrUrl}/${eventId}/${ticketId}/${requestSource.toLowerCase()}_${from}/${ticket.bought_tx}`
      const msg = languageCode === 'th'
        ? 'นี่คือตั๋วของคุณ'
        : 'Here is your ticket'
      console.log(currTicketUrl)

      return messageSender.sendMessage(from, msg)
        .then(() => messageSender.sendCustomMessages(from, formatter.ticketTemplate(event, currTicketUrl)))
    } else {
      console.error('EVENT_NOT_FOUND')
      const msg = languageCode === 'th'
        ? 'ขอโทษทีนะ หาไม่เจอจริง ๆ ลองใหม่อีกครั้งนะ'
        : 'Sorry, I cannot find you ticket T-T. Please try again.'
      return messageSender.sendMessage(from, msg)
    }

  }
}