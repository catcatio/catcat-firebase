import { Request, Response, RequestHandler } from 'express'

export const apiPath = '/v1/use/:bought_tx'

export default (ticketingSystem): RequestHandler => {
  return (req: Request, res: Response) => {
    const bought_tx = req.params.bought_tx
    return ticketingSystem.useTicket(bought_tx)
      .catch(err => console.log(err))
      .then(() => res.sendStatus(200))
  }
}