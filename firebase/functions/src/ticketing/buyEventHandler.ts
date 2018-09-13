import { HrtimeMarker } from '../utils/hrtimeMarker'
import { formatCurrency } from '../utils/formatCurrency'

export default (eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider, masterAsset, masterDistributor, transactionsRepository, { ticketQrUrl, linePay, linePayConfirmUrl }) => async ({ requestSource, from, languageCode }, eventTitle) => {
  const hrMarker = HrtimeMarker.create('buyEvent')
  console.log(`${requestSource}: ${from} start buy event`)
  let firebaseTime = 0, stellarTime = 0, msg = ''
  try {
    let marker = hrMarker.mark('getEventByTitle')

    const messageSender = messagingProvider.get(requestSource)
    const formatter = messageFormatterProvider.get(requestSource)
    // Get Event by title
    const event = await eventStore.getByTitle(eventTitle)
    firebaseTime += marker.end().log().duration

    if (!event) {
      console.error('EVENT_NOT_FOUND')
      msg = languageCode === 'th'
        ? `ขอโทษทีนะ ไม่รู้จักงาน "${eventTitle}" ลองใหม่อีกทีนะ`
        : `Sorry, we cannot not find your "${eventTitle}" event`
      return messageSender.sendMessage(from, msg)
    }

    marker = hrMarker.mark('getUserByRequestSource')
    console.log(`event: ${event.id}`)
    msg = languageCode === 'th'
      ? `รอแปร๊บนะ กำลังจอง "${eventTitle}" ให้...`
      : `Hold on, we're now making purchase "${eventTitle}" for you...`
    messageSender.sendMessage(from, msg)

    // check if there is any available ticket
    marker = hrMarker.mark('getUnusedTicket')
    const unusedTicket = await eventStore.getUnusedTicket(event.id)
    firebaseTime += marker.end().log().duration

    if (!unusedTicket) {
      console.error('EVENT_BOOK_FULL')
      msg = languageCode === 'th'
        ? `ขอโทษทีนะ "${eventTitle}" เต็มแล้ว`
        : `Sorry, the "${eventTitle}" event is fully booked out`
      return messageSender.sendMessage(from, msg)
    }

    // get user by requestSource, or create new one if necessary
    let user = await userStore.getByRequstSource(requestSource, from)
    user = user || await userStore.createUserFromTemp(requestSource, from, masterAsset)
    firebaseTime += marker.end().log().duration

    if (!user) {
      console.error('EVENT_BOOK_FULL')
      msg = languageCode === 'th'
        ? `ขอโทษทีนะ "${eventTitle}" เต็มแล้ว`
        : `Sorry, the "${eventTitle}" event is fully booked out`
      return messageSender.sendMessage(from, msg)
    }
    console.log(`user: ${user.id} ${user.publicKey}`)

    if (user.bought_tickets && user.bought_tickets[event.id] && (Object.keys(user.bought_tickets[event.id]).length > 0)) {
      console.error('EVENT_ALREADY_BOOK')
      msg = languageCode === 'th'
        ? 'ดูเหมือนว่า คุณมีตั๋วอยู่แล้วนะ'
        : 'You have already bought the event'
      let retPromise = messageSender.sendMessage(from, msg)

      marker = hrMarker.mark('getTicketById')
      const ticket = await eventStore.getTicketById(event.id, Object.keys(user.bought_tickets[event.id])[0])
      firebaseTime += marker.end().log().duration

      if (ticket) {
        console.log(JSON.stringify(ticket, null, 2))
        const currTicketUrl = `${ticketQrUrl}/${event.id}/${ticket.id}/${requestSource.toLowerCase()}_${from}/${ticket.bought_tx}`
        msg = languageCode === 'th'
          ? 'นี่คือตั๋วของคุณ'
          : 'Here is your ticket'
        retPromise = retPromise.then(() => messageSender.sendMessage(from, msg))
        retPromise = retPromise.then(() => messageSender.sendCustomMessages(from, formatter.ticketTemplate(event, currTicketUrl)))
        console.log(currTicketUrl)
      }

      return retPromise
    }

    // initiate LINE PAY flow
    const reservation: any = {
      productName: event.title,
      amount: event.ticket_price,
      currency: event.ticket_currency,
      confirmUrl: linePayConfirmUrl['ticket'],
      confirmUrlType: 'SERVER',
      orderId: `${Date.now()}-${from}`
    }

    console.log(JSON.stringify(reservation))

    const response = await linePay.reserve(reservation)
    reservation.transactionId = response.info.transactionId
    reservation.userId = from

    await transactionsRepository.put(reservation.transactionId, {
      reservation,
      status: 'new',
      createdDate: Date.now(),
      languageCode: languageCode,
      userId: user.id,
      eventId: event.id,
      ticketId: unusedTicket.id,
      eventTitle: event.title,
      requestSource: requestSource,
      from: from,
      type: 'ticket'
    })

    console.log(JSON.stringify(response.info))

    const message = {
      type: 'template',
      altText: 'Please proceed to the payment.',
      template: {
        type: 'buttons',
        text: `${formatCurrency(event.ticket_price)} THB for "${event.title}" ticket. Please proceed to the payment.`,
        actions: [
          { type: 'uri', label: 'Pay by LINE Pay', uri: response.info.paymentUrl.web }
        ]
      }
    }

    await messageSender.sendCustomMessages(from, message)
    return 'EVENT_BUY_OK'

  } finally {
    console.log(`🔥  ${firebaseTime.toFixed(2)} ms    🚀  ${stellarTime.toFixed(2)} ms`)
    hrMarker.end().log()
  }

}
