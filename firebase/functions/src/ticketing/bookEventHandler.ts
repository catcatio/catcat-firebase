import * as StellarSdk from 'stellar-sdk'

import { HrtimeMarker } from '../utils/hrtimeMarker'

export default (eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider, masterAsset, masterDistributor, { ticketQrUrl }) => async ({ requestSource, from, languageCode }, eventTitle) => {
  const hrMarker = HrtimeMarker.create('bookEvent')
  console.log(`${requestSource}: ${from} start book event`)
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
      ? `รอแป๊บนะ กำลังจอง ${eventTitle} ให้...`
      : `Hold on, we're now booking ${eventTitle} for you...`
    messageSender.sendMessage(from, msg)

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

    if (user.bought_tickets && user.bought_tickets[event.id] && (Object.keys(user.bought_tickets[event.id]).length > 0)) {
      console.error('EVENT_ALREADY_BOOK')
      msg = languageCode === 'th'
        ? 'ดูเหมือนว่า คุณมีตั๋วอยู่แล้วนะ'
        : 'You have already booked the event'
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

    marker = hrMarker.mark('getUnusedTicket')
    console.log(`user: ${user.id} ${user.publicKey}`)
    const unusedTicket = await eventStore.getUnusedTicket(event.id)
    firebaseTime += marker.end().log().duration

    if (!unusedTicket) {
      console.error('EVENT_BOOK_FULL')
      msg = languageCode === 'th'
        ? `ขอโทษทีนะ "${eventTitle}" เต็มแล้ว`
        : `Sorry, the "${eventTitle}" event is fully booked out`
      return messageSender.sendMessage(from, msg)
    }

    marker = hrMarker.mark('doBookTicket')
    const userKey = StellarSdk.Keypair.fromPublicKey(user.publicKey)
    const tmpEvent = Object.assign({}, event)
    tmpEvent.asset = new StellarSdk.Asset(event.id, event.issuer)
    tmpEvent.distributor = StellarSdk.Keypair.fromPublicKey(event.distributor)

    const boughtMemo = `B:${tmpEvent.asset.getCode()}:${unusedTicket.id}`
    const bought_tx = await stellarWrapper.doBookTicket(masterDistributor, masterAsset, userKey, tmpEvent, 1, boughtMemo)
      .catch(() => null)
    stellarTime += marker.end().log().duration

    if (!bought_tx) {
      console.error('EVENT_BOOK_ERROR')
      msg = languageCode === 'th'
        ? 'ขอโทษทีนะ เจอปัญหานิดหน่อยตอนจองตั๋ว จะเร่งแก้ไขให้นะ'
        : 'Sorry, something went wrong. We will get back to you asap.'
      return messageSender.sendMessage(from, msg)
    }

    marker = hrMarker.mark('updateBoughtTicket')
    await eventStore.updateBoughtTicket(user, tmpEvent, unusedTicket, bought_tx)
      .then(() => eventStore.saveMemo(bought_tx, boughtMemo))
    await userStore.updateBoughtTicket(user.id, tmpEvent.id, unusedTicket.id)
    firebaseTime += marker.end().duration

    const ticketUrl = `${ticketQrUrl}/${tmpEvent.id}/${unusedTicket.id}/${requestSource.toLowerCase()}_${from}/${bought_tx}`
    console.log(ticketUrl)
    msg = languageCode === 'th'
        ? `เจอกันที่งาน "${eventTitle}" นะ โชว์ตั๋วนี่เพื่อเข้างานได้เลย`
        : `See you at "${eventTitle}" event! Do show this ticket when attend`
    await messageSender.sendCustomMessages(from, formatter.ticketTemplate(event, ticketUrl))
      .then(() => messageSender.sendMessage(from, msg))

    console.info('EVENT_BOOK_OK')
    return 'EVENT_BOOK_OK'
  } finally {
    console.log(`🔥  ${firebaseTime.toFixed(2)} ms    🚀  ${stellarTime.toFixed(2)} ms`)
    hrMarker.end().log()
  }

}
