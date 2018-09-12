import * as StellarSdk from 'stellar-sdk'

import { HrtimeMarker } from '../utils/hrtimeMarker'

export default (eventStore, userStore, stellarWrapper, messagingProvider, messageFormatterProvider, masterAsset, masterDistributor, transactionsRepository, { ticketQrUrl, linePay }) => async (transactionId) => {
  const hrMarker = HrtimeMarker.create('confirmPaymentEvent')
  console.log(`${transactionId} start confirm payment event`)
  let firebaseTime = 0, stellarTime = 0, msg = ''
  try {
    // Get Pay Transaction by Id
    let marker = hrMarker.mark('getPayTransactionById')
    const transaction = await transactionsRepository.get(transactionId)
    firebaseTime += marker.end().log().duration
    if (!transaction) {
      console.error('PAY_TX_FOUND')
      return 'PAY_TX_FOUND'
    }

    console.log(JSON.stringify(transaction))

    const languageCode = transaction.languageCode
    const requestSource = transaction.requestSource
    const from = transaction.from

    const messageSender = messagingProvider.get(requestSource)
    const formatter = messageFormatterProvider.get(requestSource)

    msg = languageCode === 'th'
      ? `รอแปร๊บนะ กำลังออกตั๋ว "${transaction.eventTitle}" ให้...`
      : `Hold on, we're now issuing "${transaction.eventTitle}" for you...`
    messageSender.sendMessage(from, msg)

    // Get Event by title
    marker = hrMarker.mark('getEventById')
    console.log(transaction.eventId)
    const event = await eventStore.getById(transaction.eventId)
    firebaseTime += marker.end().log().duration
    if (!event) {
      console.error('EVENT_NOT_FOUND')
      return 'PAY_TX_FOUND'
    }

    marker = hrMarker.mark('getTicketById')
    const ticket = await eventStore.getTicketById(transaction.eventId, transaction.ticketId)
    firebaseTime += marker.end().log().duration

    if (!ticket) {
      console.error('TICKET_NOT_FOUND')
      return 'TICKET_NOT_FOUND'
    }

    marker = hrMarker.mark('getUserById')
    const user = await userStore.getUserById(transaction.userId)
    firebaseTime += marker.end().log().duration

    if (!user) {
      console.error('USER_NOT_FOUND')
      return 'USER_NOT_FOUND'
    }

    marker = hrMarker.mark('doBookTicket')
    const userKey = StellarSdk.Keypair.fromPublicKey(user.publicKey)
    const tmpEvent = Object.assign({}, event)
    tmpEvent.asset = new StellarSdk.Asset(event.id, event.issuer)
    tmpEvent.distributor = StellarSdk.Keypair.fromPublicKey(event.distributor)

    const boughtMemo = `B:${tmpEvent.asset.getCode()}:${ticket.id}`
    const bought_tx = await stellarWrapper.doBookTicket(masterDistributor, masterAsset, userKey, tmpEvent, 1, boughtMemo)
      .catch(() => null)
    stellarTime += marker.end().log().duration

    if (!bought_tx) {
      console.error('EVENT_BOOK_ERROR')
      msg = languageCode === 'th'
        ? 'ขอโทษทีนะ เจอปัญหานิดหน่อยตอนจองตั๋ว จะเร่งแก้ไขให้นะ'
        : 'Sorry, something went wrong. We will get back to you asap.'
      await messageSender.sendMessage(from, msg)
      return 'EVENT_BOOK_ERROR'
    }

    const confirmation = {
      transactionId: transactionId,
      amount: transaction.reservation.amount,
      currency: transaction.reservation.currency
    }

    const response = await linePay.confirm(confirmation)
      .then(res => {
        transactionsRepository.update(transactionId, { status: 'completed', completedDate: Date.now() })
        return res
      })
      .catch(err => {
        console.error(err.message)
        transactionsRepository.update(transactionId, { status: 'failed', failedDate: Date.now(), reason: err.message, completedDate: Date.now() })
        return null
      })

    if (!response) {
      console.error('EVENT_BOOK_ERROR')
      msg = languageCode === 'th'
        ? 'ขอโทษทีนะ เจอปัญหานิดหน่อยตอนจองตั๋ว จะเร่งแก้ไขให้นะ'
        : 'Sorry, something went wrong. We will get back to you asap.'
      await messageSender.sendMessage(from, msg)
      return 'EVENT_BOOK_ERROR'
    }

    marker = hrMarker.mark('updateBoughtTicket')
    await eventStore.updateBoughtTicket(user, tmpEvent, ticket, bought_tx, languageCode)
      .then(() => eventStore.saveMemo(bought_tx, boughtMemo))
    await userStore.updateBoughtTicket(user.id, tmpEvent.id, ticket.id)
    firebaseTime += marker.end().duration

    const ticketUrl = `${ticketQrUrl}/${tmpEvent.id}/${ticket.id}/${requestSource.toLowerCase()}_${from}/${bought_tx}`
    console.log(ticketUrl)
    msg = languageCode === 'th'
      ? `เจอกันที่งาน "${transaction.eventTitle}" นะ โชว์ตั๋วนี่เพื่อเข้างานได้เลย`
      : `See you at "${transaction.eventTitle}" event! Do show this ticket when attend`
    await messageSender.sendCustomMessages(from, formatter.ticketTemplate(event, ticketUrl))
      .then(() => messageSender.sendMessage(from, msg))

    // Offer adding event to calendar
    msg = languageCode === 'th'
      ? 'อยากเพิ่มนัดในปฏิทินด้วยมั๊ยเมี๊ยว~'
      : 'Do you want to add this event on calendar?'
    await messageSender.sendCustomMessages(from,
      languageCode === 'th'
        ? formatter.quickReplyTemplate(msg, 'มะ', {
          'type': 'postback',
          'label': 'เอาเอา',
          'displayText': 'เอาเอา',
          'data': 'ขอไอซีเอส',
        })
        : formatter.quickReplyTemplate(msg, 'No', 'gimme ics')
    )

    console.info('EVENT_BOOK_OK')
    return 'EVENT_BOOK_OK'
  } catch (error) {
    console.error(error)
    return 'EVENT_BOOK_ERROR'
  } finally {
    console.log(`🔥  ${firebaseTime.toFixed(2)} ms    🚀  ${stellarTime.toFixed(2)} ms`)
    hrMarker.end().log()
  }
}
