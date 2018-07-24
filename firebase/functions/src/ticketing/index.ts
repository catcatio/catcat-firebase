const { fbTemplate } = require('claudia-bot-builder')
const listEvent = async () => {
  const events = [{
    'code': 'GG01',
    'startDate': '2018-07-28T09:00:00.000Z',
    'endDate': '2018-07-28T10:00:00.000Z',
    'title': 'Tuesday Evening Ceramics',
    'subtitle': 'Tuesday, July 24, 2018 7:00 PM @House 182',
    'description': 'Do ceramics at our regular meetup! All skill levels welcome. See all our work ',
    'coverImage': 'https://secure.meetupstatic.com/photo_api/event/rx1100x800/dt000ddfxff646a/sgc348cff06b/464942367.jpeg',
    'venue': 'House 182',
    'host': 'Ross and Jane J.',
    'email': 'someone@example.com',
    'url': 'https://www.facebook.com/BangkokPotteryClub',
    'uuid': 'user unique id',
    'limit': 10
  },
  {
    'code': 'GG02',
    'startDate': '2018-07-28T09:00:00.000Z',
    'endDate': '2018-07-28T10:00:00.000Z',
    'title': 'Satoshi Square - Lightning Network Special',
    'subtitle': 'Monday, July 30, 2018 7:00 PM @The Clubhouse Sports Bar & Grill',
    'description': 'Lightning Network 101: Ryan Milbourne will be covering the problem Lightning Network is solving, its advantages and disadvantages, as well as the current state of Lightning Network Development.',
    'coverImage': 'https://secure.meetupstatic.com/photo_api/event/rx1100x800/dt2737ffxffc600/sge64cef73ca/449330933.jpeg',
    'venue': 'The Clubhouse Sports Bar & Grill',
    'host': 'Jeremy B.',
    'email': 'someone@example.com',
    'url': 'https://www.meetup.com/Bangkok-Satoshi-Square/events/btqmtpyxkbnc/',
    'uuid': 'user unique id',
    'limit': 10
  }]

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

const bookEvent = async (eventTitle) => {
  const confirmTicketUrl = `https://firebasestorage.googleapis.com/v0/b/ticketing-dlt-poc.appspot.com/o/qr%2Faec2e826501e801c0dd1f4c6d0068f2ae1df012701d07918c7ceb9553cff2379.png?alt=media&token=318ac652-e2ea-4c02-9150-975941d8f2d6`
  return ({
    "dialogflow":
    {
      "type": "Image",
      "imageUrl": confirmTicketUrl
    }
  })
}

export const ticketing = (config) => ({
  listEvent,
  bookEvent
})
