import { Request, Response } from 'firebase-functions';
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

export const ozApi = ({ facebook, line }, config) => {
  const ticketingSystem = ticketing({ facebook, line }, config)

  return (req: Request, res: Response) => {
    console.log('start of oz request')
    console.log(`req.body : ${JSON.stringify(req.body)}`)

    if (!req.body) return sendDialogflowTextMessage(res, 'No body...')

    const { action, requestSource, userId, senderId } = req.body
    if (!action) return sendDialogflowTextMessage(res, 'No action...')

    const requestParams = {
      requestSource,
      from: requestSource === 'LINE' ? userId : senderId
    }

    switch (action) {
      case "list.events":
        sendDelayResponse(res, '')

        return ticketingSystem.listEvent(requestParams)
      case "events.tickets.book-yes":
        const title = req.body.parameters['event-title']

        sendDelayResponse(res, `Hold on, we're now booking ${title} for you...`)
        return ticketingSystem.bookEvent(requestParams, title)

      case "test.qr": return res.status(200).send({
        "dialogflow":
          [
            {
              "image": {
                "imageUri": "https://firebasestorage.googleapis.com/v0/b/catcatchatbot.appspot.com/o/0b0a69b119e86bb5c66bd1e3e72f853062bec514375c4ad25187a945891fa18b.png?alt=media&token=69e49c03-1d9b-4749-a529-2d3ac6b900e3"
              }
            },
            {
              "text": {
                "text": [
                  "See you at event! Do show this QR when attend"
                ]
              }
            }
          ]
      })
      default:
        return sendDialogflowTextMessage(res, `Something went wrong with ${action}`)
    }
  }
}