import { HrtimeMarker } from '../utils/hrtimeMarker'
import * as dayjs from 'dayjs'
const relativeTime = require('dayjs/plugin/relativeTime')
const th = require('dayjs/locale/th')
dayjs.extend(relativeTime)

const dayAgo = (day: string, languageCode) => {
  const opt: any = languageCode === 'th' ? { locale: th } : {}
  return (dayjs(day, opt) as any).fromNow()
}

export default (eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider) => async (tx) => {
  const hrMarker = HrtimeMarker.create('useTicket')
  console.log(`start use ticket: ${tx}`)
  let firebaseTime = 0, stellarTime = 0
  try {

    let marker = hrMarker.mark('getMemo')
    // Validate the ticket
    const txAction = await eventStore.getMemo(tx)
    firebaseTime += marker.end().log().duration

    if (!txAction || txAction.action !== 'B') {
      console.error('EVENT_TX_NOTFOUND')
      return Promise.reject('EVENT_TX_NOTFOUND')
    }

    marker = hrMarker.mark('getEventById')
    const event = await eventStore.getById(txAction.eventId)
    firebaseTime += marker.end().log().duration
    if (!event) {
      console.error('EVENT_NOTFOUND')
      return Promise.reject('EVENT_NOTFOUND')
    }

    const orgAddress = event.providers.line || event.providers.facebook
    const orgMessageSender = messagingProvider.get(event.providers)
    marker = hrMarker.mark('getTicketById')
    const ticket = await eventStore.getTicketById(txAction.eventId, txAction.ticketId)
    firebaseTime += marker.end().log().duration

    if (!ticket) {
      console.error('EVENT_TICKET_NOTFOUND')
      orgMessageSender.sendMessage(orgAddress, `Ticket not found ${tx}`)
      return Promise.reject('EVENT_TICKET_NOTFOUND')
    }

    const userLanguageCode = ticket.language_code

    marker = hrMarker.mark('getUserById')
    const owner = await userStore.getUserById(ticket.owner_id)
    firebaseTime += marker.end().log().duration
    if (!owner) {
      console.error('EVENT_OWNER_NOTFOUND')
      orgMessageSender.sendMessage(orgAddress, `Owner not found ${tx}`)
      return Promise.reject('EVENT_OWNER_NOTFOUND')
    }

    marker = hrMarker.mark('sendResponse')
    const ownerMessageSender = messagingProvider.get(owner.providers)
    const ownerAddress = owner.providers.line || owner.providers.facebook

    if (ticket.burnt_tx) {
      console.error('EVENT_TICKET_USED')
      const usedTime = (ticket.used_times || 1) + 1
      const lastUsed = ticket.last_used_time || ticket.burnt_date
      eventStore.updateUsedTicketCount(event.id, ticket.id, usedTime)
      ownerMessageSender.sendMessage(ownerAddress, userLanguageCode === 'th'
        ? `ตั๋ว "${event.title}" ถูกสแกน มาแล้ว ${usedTime} ครั้ง ล่าสุดเมื่อ ${dayAgo(lastUsed, userLanguageCode)}`
        : `Your "${event.title}" ticket has been scanned for ${usedTime} times, last time around ${dayAgo(lastUsed, userLanguageCode)}`)

      const eventFormatter = messageFormatterProvider.get(event.providers)
      orgMessageSender.sendMessage(orgAddress, 'This ticket has already been used')
        .then(() => orgMessageSender.sendCustomMessages(orgAddress, eventFormatter.confirmResultTemplate(ticket.burnt_tx, firebaseTime, stellarTime)))
      return Promise.reject('EVENT_TICKET_USED')
    } else {
      await ownerMessageSender.sendMessage(ownerAddress, userLanguageCode === 'th'
        ? `QR ตั๋ว "${event.title}" ถูกสแกน ขอเราแอบดูแป๊บนึงนะ...`
        : `Your "${event.title}" ticket has been scanned, please wait for validation.`)
    }


    const profile = owner.providers.line ? await ownerMessageSender.getProfile(owner.providers.line) : null
    const ownerProvider = owner.providers.line ? 'line' : 'facebook'
    // post confirm options to organizer
    if (profile) {
      console.log(profile.pictureUrl)
      const formatter = messageFormatterProvider.get(owner.providers)
      const message = formatter.confirmTemplate(profile.pictureUrl, profile.displayName, ownerProvider, event.title, tx)
      orgMessageSender.sendCustomMessages(orgAddress, message)
    }

    firebaseTime += marker.end().log().duration
    console.log('EVENT_TICKET_OK')
    return 'EVENT_TICKET_OK'
  } finally {
    console.log(`🔥  ${firebaseTime.toFixed(2)} ms    🚀  ${stellarTime.toFixed(2)} ms`)
    hrMarker.end().log()
  }
}
