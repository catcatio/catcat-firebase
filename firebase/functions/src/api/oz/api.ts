import { Request, Response, RequestHandler } from 'express'

import { sendDialogflowTextMessage } from './dialogflowHelper'

export const apiPath = '/'

export default (ticketingSystem, botsSystem): RequestHandler => {
  return (req: Request, res: Response) => {
    console.log(`start of oz request \n ${JSON.stringify(req.body)}`)
    if (!req.body) return sendDialogflowTextMessage(res, 'No body...')

    const { action, requestSource, userId, senderId, session, languageCode, queryText } = req.body
    if (!action) return sendDialogflowTextMessage(res, 'No action...')

    const requestParams = {
      requestSource,
      from: requestSource === 'LINE' ? userId : senderId,
      languageCode,
      session,
      queryText
    }

    if (!requestParams.requestSource || !requestParams.from) {
      return sendDialogflowTextMessage(res, 'Invalid request...')
    }

    // check and store latest session
    const sessionTask = ticketingSystem.isNewSession(requestParams)

    switch (action) {
      case 'list.events':
        // list events
        return ticketingSystem.listEvent(requestParams)
          .then(() => res.sendStatus(200))

      case 'events.tickets.book':
        const preBookTitle = req.body.parameters['event-title']
        if (preBookTitle) return res.sendStatus(200)
        sendDialogflowTextMessage(res, languageCode === 'th' ? 'ลองดูรายการนี้นะ...' : 'Here is what we have...')
        return ticketingSystem.listEvent(requestParams)

      case 'events.tickets.buy':
        const preBuyTitle = req.body.parameters['event-title']
        if (preBuyTitle) return res.sendStatus(200)
        sendDialogflowTextMessage(res, languageCode === 'th' ? 'ลองดูรายการนี้นะ...' : 'Here is what we have...')
        return ticketingSystem.listEvent(requestParams)

      case 'events.tickets.book-yes':
        // book an event
        const bookingTitle = req.body.parameters['event-title']
        return ticketingSystem.bookEvent(requestParams, bookingTitle)
          .then(() => res.sendStatus(200))

      case 'events.tickets.buy-yes':
        // buy an event
        const buyingTitle = req.body.parameters['event-title']
        return ticketingSystem.buyEvent(requestParams, buyingTitle)
          .then(() => res.sendStatus(200))

      case 'events.tickets.confirm-yes':
        // confirm to burn a ticket
        const tx = req.body.parameters['tx']
        return ticketingSystem.confirmTicket(tx, requestParams)
          .then(() => res.sendStatus(200))

      case 'events.tickets.view':
        //  view a ticket
        return ticketingSystem.viewTicket(requestParams)
          .then(() => res.sendStatus(200))

      case 'input.welcome':
        // greeting
        return ticketingSystem.sendWelcomeMessage(requestParams)
          .then(() => res.sendStatus(200))

      case 'wallet.balance':
        // greeting
        return ticketingSystem.walletBalance(requestParams)
          .then(() => res.sendStatus(200))

      case 'bots.recommend':
        // recommend to friend
        return botsSystem.recommend(requestParams)
          .then(() => res.sendStatus(200))

      case 'botssuggestion.botssuggestion-context':
        // suggestion flow
        const suggestion = req.body.parameters['suggestion']
        return botsSystem.suggest(suggestion, requestParams)
          .then(() => res.sendStatus(200))

      case 'eventsics.eventsics-yes':
        // ics flow
        const icsParams = {
          title: req.body.parameters['event-title'],
          email: req.body.parameters['email']
        }
        return ticketingSystem.sendIcs(icsParams.title, icsParams.email, requestParams)

      case 'events.tickets.payment':
        const itemCount = req.body.parameters['item-count']
        return botsSystem.makePayment(itemCount <= 0 ? 1 : itemCount, requestParams)
          .then(() => res.sendStatus(200))

      case 'events.create.facebook':
          const eventLink = req.body.parameters['event-link']
          return ticketingSystem.createFacebookEvent(eventLink, requestParams)
            .then(() => res.sendStatus(200))

      default:
        return sessionTask.then(isNewSession => {
          return ticketingSystem.handleUnknownEvent(isNewSession, requestParams)
        })
          .then(handled => handled
            ? res.sendStatus(200)
            : sendDialogflowTextMessage(res, languageCode === 'th' ? 'เมี๊ยว~' : 'meow~'))
    }
  }
}
