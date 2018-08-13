import { Request, Response, RequestHandler } from 'express'
import * as request from 'request'

export const apiPath = '/ticket/:eventId/:ticketId/:userProvider/:tx'

export default (ticketingSystem): RequestHandler => {
  return async (req: Request, res: Response) => {

    const params = await ticketingSystem.getTicketParams(req.params)
    request({
      url: 'https://qr.catcat.io',
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' }
    }).pipe(res)
  }
}