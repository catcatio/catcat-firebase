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

const delay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

const sendDelayResponse = (res, message, delayMs = 1000) => {
  return delay(delayMs).then(() => sendDialogflowTextMessage(res, message))
}

export const apiHandler = (facebook, line, config) => {
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
        sendDelayResponse(res, '')

        return ticketingSystem.listEvent(requestParams)
      case "events.tickets.book-yes":
        const title = req.body.parameters['event-title']

        sendDelayResponse(res, `Hold on, we're now booking ${title} for you...`)
        return ticketingSystem.bookEvent(requestParams, title)
      default:
        return sendDialogflowTextMessage(res, `Something went wrong with ${action}`)
    }
  }
}

export const ozApi = ({ facebook, line }, config) => {
  const api = express()
  api.use(Cors({ origin: true }))
  api.post('/', apiHandler(facebook, line, config))
  return api
}