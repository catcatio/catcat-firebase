import { Request, Response, RequestHandler, Router } from 'express'
//import * as linePay from 'line-pay'
export const apiPath = '/pay'
import { IMessageingProvider } from '../../messaging'

export default (messagingProvider: IMessageingProvider, transactionsRepository, {linePayChannelId, linePayChannelSecret, linepayProduction}): RequestHandler => {
  const linePay = require('line-pay')

  const pay = new linePay({
    channelId: linePayChannelId,
    channelSecret: linePayChannelSecret,
    isSandbox: !linepayProduction
  })

  const router = Router()

  router.get('/confirm', async (req: Request, res: Response) => {
    console.log('/confirm', req.query.transactionId)
    if (!req.query.transactionId) {
      console.log('Transaction Id not found.')
      return res.status(400).send('Transaction Id not found.')
    }

    const transaction = await transactionsRepository.get(req.query.transactionId)
    if (!transaction) {
      console.log('Reservation not found.')
      return res.status(400).send('Reservation not found.')
    }
    console.log('reservation', JSON.stringify(transaction))

    const confirmation = {
      transactionId: req.query.transactionId,
      amount: transaction.reservation.amount,
      currency: transaction.reservation.currency
    }

    console.log('confirmation', JSON.stringify(confirmation))

    return pay.confirm(confirmation).then((response) => {
      res.sendStatus(200)

      const messages = [{
        type: 'sticker',
        packageId: 2,
        stickerId: 144
      }, {
        type: 'text',
        text: `Congratulations! You've just got premium access to "${transaction.reservation.productName}"`
      }]

      const messageSender = messagingProvider.get('line')
      return messageSender.sendCustomMessages(transaction.reservation.userId, ...messages)
    }).then((response) => {
      console.log('pay/confirm', response)
      transactionsRepository.update(transaction.reservation.transactionId, { status: 'completed', completedDate: Date.now() })
      transactionsRepository.put(transaction.reservation.userId, { subscription: 'active' })
    })
  })

  return router
}