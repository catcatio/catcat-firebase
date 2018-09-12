import { IMessageingProvider } from '../messaging'

export default (messagingProvider: IMessageingProvider, transactionsRepository, {linePay, linePayConfirmUrl}) => {
  return async (itemCount = 1, { requestSource, from, languageCode }) => {
    console.log('makePayment', itemCount)
    const reservation: any = {
      productName: 'Chatbots & Blockchain',
      amount: 100 * itemCount,
      currency: 'THB', // TODO: currency always THB?
      confirmUrl: linePayConfirmUrl['demo'],
      confirmUrlType: 'SERVER',
      orderId: `${Date.now()}-${from}`
    }

    const response = await linePay.reserve(reservation)
    console.log(JSON.stringify(response.info))
    reservation.transactionId = response.info.transactionId
    reservation.userId = from

    await transactionsRepository.put(reservation.transactionId, {
      reservation,
      status: 'new',
      createdDate: Date.now()
    })

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