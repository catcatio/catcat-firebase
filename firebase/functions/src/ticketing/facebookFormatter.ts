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
        .addButton(`Join ${event.title}`, `Join ${event.title}`)
    })
    return generic.get()
  }

  const ticketTemplate = (event, ticketUrl: string) => {
    return {}
  }

  const welcomeTemplate = (message: string, ...options: string[]) => {
    return {}
  }

  const confirmTemplate = (pictureUrl: string, displayName: string, ownerProvider: string, eventTitle: string, tx: string) => {
    return {}
  }

  return {
    listEvents,
    ticketTemplate,
    confirmTemplate,
    welcomeTemplate,
    providerName: 'facebook'
  }
}