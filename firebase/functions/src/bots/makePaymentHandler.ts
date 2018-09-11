import { IFirebaseConfig } from '../firebaseConfig'
import { IMessageingProvider } from '../messaging'

export default (messagingProvider: IMessageingProvider, transactionsRepository, {linePayChannelId, linePayChannelSecret, linePayConfirmUrl, linepayProduction}) => {
  const linePay = require('line-pay')

  const pay = new linePay({
    channelId: linePayChannelId,
    channelSecret: linePayChannelSecret,
    isSandbox: !linepayProduction
  })

  return async (itemCount = 1, { requestSource, from, languageCode }) => {
    console.log('makePayment', itemCount)
    const reservation: any = {
      productName: 'Chatbots & Blockchain',
      amount: 100 * itemCount,
      currency: 'THB', // TODO: currency always THB?
      confirmUrl: linePayConfirmUrl,
      confirmUrlType: 'SERVER',
      orderId: `${from}-${Date.now()}`
    }

    const response = await pay.reserve(reservation)
    reservation.transactionId = response.info.transactionId
    reservation.userId = from

    await transactionsRepository.put(reservation.transactionId, {
      reservation,
      status: 'new',
      createdDate: Date.now()
    })

    console.log(JSON.stringify(response.info))

    const message = {
      type: 'template',
      altText: 'Please proceed to the payment.',
      template: {
        type: 'buttons',
        text: `${100 * itemCount} THB for ${itemCount} tickets. Please proceed to the payment.`,
        actions: [
          { type: 'uri', label: 'Pay by LINE Pay', uri: response.info.paymentUrl.web },
          { type: 'uri', label: 'Pay by LINE Pay-app', uri: response.info.paymentUrl.app },
        ]
      }
    }

    const messageSender = messagingProvider.get(requestSource)
    return messageSender.sendCustomMessages(from, message)
  }
}