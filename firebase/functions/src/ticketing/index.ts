const { fbTemplate } = require('claudia-bot-builder')
import {default as firestoreRepoFactory} from './firestoreRepository'
import {default as eventStoreFactory} from './eventStore'


const bookEvent = async (eventTitle) => {
  const confirmTicketUrl = `https://firebasestorage.googleapis.com/v0/b/ticketing-dlt-poc.appspot.com/o/qr%2Faec2e826501e801c0dd1f4c6d0068f2ae1df012701d07918c7ceb9553cff2379.png?alt=media&token=318ac652-e2ea-4c02-9150-975941d8f2d6`
  return ({
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
}

export const ticketing = ({firestore}) => {

  const eventRepository = firestoreRepoFactory(firestore, 'events')
  const eventStore = eventStoreFactory(eventRepository)

  const listEvent = async () => {
    const events = await eventStore.getAllEvents()
    const generic = new fbTemplate.Generic()
    events.forEach(event => {
      generic.addBubble(event.title, event.subtitle)
        .addImage(event.coverImage)
        .addDefaultAction(event.url)
        .addButton('See more detail', event.url)
        .addButton(`Join ${event.title}`, `Join ${event.title}`)
    })
    return {
      "facebook": generic.get()
    }
  }

  return {
  listEvent,
  bookEvent
}}
