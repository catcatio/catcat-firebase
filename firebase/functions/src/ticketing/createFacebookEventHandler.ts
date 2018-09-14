import * as request from 'request-promise-native'
import { HrtimeMarker } from '../utils/hrtimeMarker'

export default (messagingProvider, messageFormatterProvider, { facebookEventScraperUrl }) => async (eventLink, { requestSource, from, languageCode }) => {
  const hrMarker = HrtimeMarker.create('createFacebookEvent')
  try {
    console.log(`create facebook event: ${eventLink}`)
    const messageSender = messagingProvider.get(requestSource)
    const formatter = messageFormatterProvider.get(requestSource)
    await messageSender.sendMessage(from, 'Meow~ Let\'s me see')
    const marker = hrMarker.mark('scrapFBEvent')
    const eventData = await request({
      url: facebookEventScraperUrl,
      qs: { url: `${eventLink}?${Date.now()}` },
      json: true
    })
    marker.end().log()
    const message = formatter.previewFacebookEventTemplate(eventData, eventLink, 40)
    await messageSender.sendMessage(from, 'Here is the preview of event card')
    return messageSender && messageSender.sendCustomMessages(from, message)
  } finally {
    hrMarker.end().log()
  }
}