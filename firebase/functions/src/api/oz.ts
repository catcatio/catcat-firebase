import * as express from 'express'
// tslint:disable-next-line:no-duplicate-imports
import { Express, Request, Response, RequestHandler } from 'express'
import * as Cors from 'cors'
import { ticketing } from '../ticketing'

const sendDialogflowTextMessage = (res, text: string, retCode: number = 200) => {
  return res.status(retCode).send({
    "dialogflow": {
      "text": {
        text
      }
    }
  })
}

const apiHandler = (facebook, line, config): RequestHandler => {
  const ticketingSystem = ticketing({ facebook, line }, config)

  return (req: Request, res: Response) => {
    console.log(`start of oz request \n ${JSON.stringify(req.body)}`)
    if (!req.body) return sendDialogflowTextMessage(res, 'No body...')

    const { action, requestSource, userId, senderId } = req.body
    if (!action) return sendDialogflowTextMessage(res, 'No action...')

    const requestParams = {
      requestSource,
      from: requestSource === 'LINE' ? userId : senderId
    }

    if (!requestParams.requestSource || !requestParams.from) return sendDialogflowTextMessage(res, 'No invalid request...')

    switch (action) {
      case "list.events":
        return ticketingSystem.listEvent(requestParams)
          .then(() => sendDialogflowTextMessage(res, ''))

      case "events.tickets.book-yes":
        const title = req.body.parameters['event-title']
        return ticketingSystem.bookEvent(requestParams, title)
          .then(() => sendDialogflowTextMessage(res, ''))

      case "events.tickets.use-yes":
        const tx = req.body.parameters['tx']
        return ticketingSystem.useTicket(tx, requestParams)
          .then(() => sendDialogflowTextMessage(res, ''))

      default:
        return sendDialogflowTextMessage(res, `Something went wrong with ${action}`)
    }
  }
}

const confirmApiHandler = (facebook, line, config): RequestHandler => {
  const ticketingSystem = ticketing({ facebook, line }, config)

  return (req: Request, res: Response) => {
    const bought_tx = req.params.bought_tx
    return ticketingSystem.confirmTicket(bought_tx)
      .then(ret => sendDialogflowTextMessage(res, ret))
      .catch(err => sendDialogflowTextMessage(res, err))
  }
}

export const ozApi = ({ facebook, line }, config): Express => {
  const api = express()
  api.use(Cors({ origin: true }))
  api.use(require('./fbdummy').fbdummy) // use static response for facebook, until app review process complete
  api.post('/', apiHandler(facebook, line, config))
  api.get('/v1/confirm/:bought_tx', confirmApiHandler(facebook, line, config))
  return api
}