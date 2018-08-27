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
          .then(() => sendDialogflowTextMessage(res, ''))

      case 'events.tickets.book-yes':
        // book an event
        const title = req.body.parameters['event-title']
        return ticketingSystem.bookEvent(requestParams, title)
          .then(() => sendDialogflowTextMessage(res, ''))

      case 'events.tickets.confirm-yes':
        // confirm to burn a ticket
        const tx = req.body.parameters['tx']
        return ticketingSystem.confirmTicket(tx, requestParams)
          .then(() => sendDialogflowTextMessage(res, ''))

      case 'input.welcome':
        // greeting
        return ticketingSystem.sendWelcomeMessage(requestParams)
          .then(() => sendDialogflowTextMessage(res, ''))

      case 'bots.share':
        return botsSystem.share(requestParams)
          .then(() => sendDialogflowTextMessage(res, ''))

      default:
        return sessionTask.then(isNewSession => {
          return ticketingSystem.handleUnknownEvent(isNewSession, requestParams)
        })
          .then(handled => sendDialogflowTextMessage(res, !handled ? 'hmm...?' : ''))
    }
  }
}
