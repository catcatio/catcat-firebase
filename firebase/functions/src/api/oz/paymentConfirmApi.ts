import { Request, Response, RequestHandler, Router } from 'express'

export const apiPath = '/paymentconfirm'

export default (ticketingSystem): RequestHandler => {

  const router = Router()
  router.use('/linepay', async (req: Request, res: Response) => {
    const transactionId = req.query.transactionId
    if (!transactionId) {
      console.log('invalid request')
      return res.status(400).send('invalid request')
    }

    return ticketingSystem.confirmPayment(transactionId)
      .then(result => res.sendStatus(result === 'EVENT_BOOK_OK' ? 200 : 400))
  })

  return router
}