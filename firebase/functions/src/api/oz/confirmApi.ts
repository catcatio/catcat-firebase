import { Request, Response, RequestHandler } from 'express'
import { sendDialogflowTextMessage } from './dialogflowHelper'

export const apiPath = '/confirm/:bought_tx'

export default (ticketingSystem): RequestHandler => {
  return (req: Request, res: Response) => {
    const bought_tx = req.params.bought_tx
    return ticketingSystem.confirmTicket(bought_tx)
      .then(ret => sendDialogflowTextMessage(res, ret))
      .catch(err => sendDialogflowTextMessage(res, err))
  }
}