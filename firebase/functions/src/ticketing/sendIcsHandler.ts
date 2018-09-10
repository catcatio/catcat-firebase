import { HrtimeMarker } from '../utils/hrtimeMarker'

export default (eventStore, userStore, messagingProvider, messageFormatterProvider, { mailgunKey, mailgunDomain, catcatMail }) => {
  const mailgun = require('mailgun-js')({ apiKey: mailgunKey, domain: mailgunDomain })
  const ics = require('ics')
  const moment = require('moment')
  const sanitize = require('sanitize-filename')

  const createIcsAsync = (data) => new Promise<string>((resolve, reject) => {
    ics.createEvent(data, (error, value) => {
      if (error) {
        reject(error)
      } else {
        resolve(value)
      }
    })
  })

  const html = `<html>
<div style="text-align: center;">
  <p style="margin: 2px;">See you at <b>Chatbots & Blockchain</b> event!</p>
  <p style="margin: 2px;"> / </p>
  <img width="32px" height="32px" src="https://raw.githubusercontent.com/rabbotio/minemark/master/public/kat.png">
  <br/>
  <p style="font-size: xx-small;color:#cccccc;">MADE WITH ❤ <a href="https://catcat.io" style="font-size: xx-small;color:#cccccc;text-decoration-line: none;">CATCAT.IO</a></p>
</div>
</html>
`

  return async (eventTitle, email, { requestSource, from, languageCode }) => {
    const hrMarker = HrtimeMarker.create('sendIcs')
    console.log(`${requestSource}: ${from} start send ics`)
    let firebaseTime = 0, stellarTime = 0, msg = ''
    try {
      const marker = hrMarker.mark('getEventByTitle')
      const messageSender = messagingProvider.get(requestSource)
      const formatter = messageFormatterProvider.get(requestSource)

      // Get Event by title
      const event = await eventStore.getByTitle(eventTitle)
      firebaseTime += marker.end().log().duration

      if (!event) {
        console.error('EVENT_NOT_FOUND')
        msg = languageCode === 'th'
          ? `ขอโทษทีนะ ไม่รู้จักงาน "${eventTitle}" ลองใหม่อีกทีนะ`
          : `Sorry, we cannot not find your "${eventTitle}" event`
        return messageSender.sendMessage(from, msg)
      }

      const icsData = {
        start: moment(event.startDate).format('YYYY-M-D-HH-mm').split('-'),
        end: moment(event.endDate).format('YYYY-M-D-HH-mm').split('-'),
        title: event.title,
        description: event.description,
        location: event.venue,
        url: event.link,
        status: 'CONFIRMED',
        organizer: { name: 'catcat', email: catcatMail },
        attendees: [
          { name: email, email: email, rsvp: true }
        ]
      }

      const icsContent = await createIcsAsync(icsData)
      const attachment = new mailgun.Attachment({
        data: Buffer.from(icsContent, 'utf8'),
        filename: sanitize(`${event.title}.ics`, { replacement: '_' }),
        knownLength: icsContent.length,
        contentType: 'Content-Type: text/calendar; charset=UTF-8; method=REQUEST'
      })

      const mailOption = {
        from: catcatMail,
        to: email,
        subject: `Event ${event.title}`,
        html,
        attachment
      }

      mailgun.messages().send(mailOption, (error, body) => {
        console.log(JSON.stringify(error || body))
        if (error) {
          return messageSender.sendMessage(from, languageCode === 'th'
          ? 'ขอโทษทีนะ เจอปัญหานิดหน่อยกับการส่งอีเมล จะเร่งแก้ไขให้นะ'
          : 'Sorry, something went wrong. We will get back to you asap.')
        } else {
          return messageSender.sendMessage(from, languageCode === 'th'
            ? `เราส่งคาเลนดาร์ให้คุณแล้ว ลองดูในอีเมล์ ${email} ของคุณนะ`
            : `Calendar has been sent to your email ${email}`)
        }
      })
    } finally {
      console.log(`🔥  ${firebaseTime.toFixed(2)} ms    🚀  ${stellarTime.toFixed(2)} ms`)
      hrMarker.end().log()
    }
  }
}