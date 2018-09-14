import { IMessageFormatter } from './messageFormatter'
export const facebookMessageFormatter = ({ }): IMessageFormatter => {

  const { fbTemplate } = require('claudia-bot-builder')

  const listEvents = (events) => {
    const generic = new fbTemplate.Generic()
    events.forEach(event => {
      generic.addBubble(event.title, event.description)
        .addImage(event.coverImage)
        .addDefaultAction(event.link)
        .addButton('See more detail', event.link)
        .addButton(`Book ${event.title}`, `Book ${event.title}`)
    })
    return generic.get()
  }

  const ticketTemplate = (event, ticketUrl: string) => {
    return {}
  }

  const quickReplyTemplate = (message: string, ...options: string[]) => {
    return {}
  }

  const confirmTemplate = (pictureUrl: string, displayName: string, ownerProvider: string, eventTitle: string, tx: string) => {
    return {}
  }

  const confirmResultTemplate = (burnttx: string, firebaseTime: number, stellarTime: number) => {
    return {}
  }

  const balanceInfoTemplate = (walletAddress: string, balanceInfo: any[]) => {
    return {}
  }

  const inviteTemplate = (eventId, userId, eventTitle, ticketRemaing, languageCode) => {
    return {}
  }

  const makePaymentTemplate = (title: string, message: string, paymentLink: string) => {
    return {}
  }

  const previewFacebookEventTemplate = (event: any, link: string, limit: number) => {
    return {}
  }

  return {
    listEvents,
    ticketTemplate,
    confirmTemplate,
    quickReplyTemplate,
    confirmResultTemplate,
    balanceInfoTemplate,
    inviteTemplate,
    providerName: 'facebook',
    makePaymentTemplate,
    previewFacebookEventTemplate
  }
}