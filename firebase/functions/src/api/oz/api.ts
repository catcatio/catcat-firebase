import { Request, Response, RequestHandler } from 'express'

import { sendDialogflowTextMessage } from './dialogflowHelper'

export const apiPath = '/'

export default (ticketingSystem): RequestHandler => {
  return (req: Request, res: Response) => {
    console.log(`start of oz request \n ${JSON.stringify(req.body)}`)
    if (!req.body) return sendDialogflowTextMessage(res, 'No body...')

    const { action, requestSource, userId, senderId, session } = req.body
    if (!action) return sendDialogflowTextMessage(res, 'No action...')

    const requestParams = {
      requestSource,
      from: requestSource === 'LINE' ? userId : senderId,
      session
    }

    if (!requestParams.requestSource || !requestParams.from) return sendDialogflowTextMessage(res, 'No invalid request...')

    // check and store latest session
    const sessionTask = ticketingSystem.isNewSession(requestParams)

    switch (action) {
      case 'list.events':
        // list events
        return ticketingSystem.listEvent(requestParams)
          .then(() => sendDialogflowTextMessage(res, ''))

      case 'events.tickets.book-yes':
        // join an event
        const title = req.body.parameters['event-title']
        return ticketingSystem.bookEvent(requestParams, title)
          .then(() => sendDialogflowTextMessage(res, ''))

      case 'events.tickets.use-yes':
        // use a ticket
        const tx = req.body.parameters['tx']
        return ticketingSystem.useTicket(tx, requestParams)
          .then(() => sendDialogflowTextMessage(res, ''))

      case 'input.welcome':
        // greeting
        return ticketingSystem.sendWelcomeMessage(requestParams)
          .then(() => sendDialogflowTextMessage(res, ''))

      default:
        return sessionTask.then(isNew => {
          // send greetig message if the session is new
          isNew && ticketingSystem.sendWelcomeMessage(requestParams)
          return isNew
        })
          // otherwise, don't know how to handle the message
          .then(isNew => sendDialogflowTextMessage(res, !isNew ? 'hmm...?' : ''))
    }
  }
}
