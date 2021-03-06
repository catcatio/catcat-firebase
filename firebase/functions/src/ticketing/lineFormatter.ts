import { IMessageFormatter } from './messageFormatter'
import { FlexMessage, FlexImage } from '@line/bot-sdk'
import { FlexMessageBuilder, FlexComponentBuilder } from '../messaging/lineMessageBuilder'
import { formatCurrency } from '../utils/formatCurrency'
import { from as dayAgo } from '../utils/dayAgo'
import { replaceAll } from '../utils/string'
import * as dayjs from 'dayjs'

const niceIssuer = (issuer) => `${issuer.substr(0, 2)}...${issuer.substr(issuer.length - 4, issuer.length)}`

export const lineMessageFormatter = ({ imageResizeService }): IMessageFormatter => {
  const limitChar = (str, limit) => {
    return `${str.substr(0, limit)}${str.length > limit ? '...' : ''}`
  }

  const listEvents = (events: any[], bookedEvent: any[], languageCode: string): FlexMessage => {
    const lineTemplate = new FlexMessageBuilder()
    const template = lineTemplate.flexMessage(languageCode === 'th' ? 'รายการอีเว้นท์' : 'Event list')
      .addCarousel()

    events.forEach(event =>
      template.addBubble()
        .addHero(FlexComponentBuilder.flexImage()
          .setUrl(`${imageResizeService}${encodeURIComponent(event.coverImage)}&size=800&seed=${Date.now()}`)
          .setSize('full')
          .setAspectRatio('1.91:1')
          .setAspectMode('cover')
          .build() as FlexImage)
        .addBody()
        .setLayout('vertical')
        .setSpacing('sm')
        .addComponents(
          FlexComponentBuilder.flexText()
            .setText(event.title)
            .setWrap(true)
            .setWeight('bold')
            .setSize('xl')
            .build(),
          FlexComponentBuilder.flexText()
            .setText(limitChar(replaceAll(event.description, '\\\\n', '\n'), 120))
            .setWrap(true)
            .setSize('md')
            .build(),
          FlexComponentBuilder.flexText()
            .setText(`${dayjs(event.startDate).format('dddd, MMMM D, YYYY HH:mm')}`)
            .setWrap(true)
            .setColor('#999999')
            .setSize('xs')
            .build(),
          FlexComponentBuilder.flexText()
            .setText(`${event.venue}`)
            .setWrap(true)
            .setColor('#999999')
            .setSize('xs')
            .build(),
          FlexComponentBuilder.flexText()
            .setText(`🎫  ${languageCode === 'th' ? 'ตั๋ว' : 'TICKET'} ${event.ticket_max - (event.ticket_bought || 0)} (${languageCode === 'th' ? 'จาก' : 'from'} ${event.ticket_max})`)
            .setWrap(true)
            .setWeight('bold')
            .setSize('xs')
            .setMargin('md')
            .setColor('#222222')
            .build(),
          FlexComponentBuilder.flexText()
            .setText(event.ticket_price > 0
              ? `💵  ${languageCode === 'th' ? 'ราคา' : 'PRICE'} ${formatCurrency(event.ticket_price, true)} ${event.ticket_currency}`
              : '💵  FREE')
            .setWrap(true)
            .setColor('#222222')
            .setWeight('bold')
            .setSize('xs')
            .build())
        .addFooter()
        .setSpacing('sm')
        .addComponents(FlexComponentBuilder.flexButton()
          .setStyle('primary')
          .setColor('#718792')
          .setAction({
            'type': 'message',
            'label': bookedEvent && bookedEvent.indexOf(event.id) >= 0
              ? `${languageCode === 'th' ? 'ยกเลิก' : 'CANCEL'}`
              : (event.ticket_price > 0
                ? `${languageCode === 'th' ? 'ซื้อ' : 'BUY'}`
                : `${languageCode === 'th' ? 'จอง' : 'BOOK'}`),
            'text': bookedEvent && bookedEvent.indexOf(event.id) >= 0
              ? `${languageCode === 'th' ? 'ยกเลิก' : 'CANCEL'}`
              : (event.ticket_price > 0
                ? `${languageCode === 'th' ? 'ซื้อตั๋ว' : 'Buy'} ${event.title}`
                : `${languageCode === 'th' ? 'จองตั๋ว' : 'Book'} ${event.title}`),
          })
          .build())
        .addComponents(FlexComponentBuilder.flexBox()
          .setLayout('horizontal')
          .setSpacing('md')
          .addContents(
            FlexComponentBuilder.flexButton()
              .setAction({
                'type': 'uri',
                'label': languageCode === 'th' ? 'แผนที่' : 'MAP',
                'uri': event.venuelink
              })
              .build(),
            FlexComponentBuilder.flexButton()
              .setAction({
                'type': 'uri',
                'label': languageCode === 'th' ? 'รายละเอียด' : 'MORE',
                'uri': event.link
              })
              .build()
          )
          .build())
    )

    return template.build()
  }

  const quickReplyTemplate = (message, ...options) => {
    return {
      'type': 'text',
      'text': message,
      'quickReply': {
        'items': options.map(op => (typeof op === 'string'
          ? {
            'type': 'action',
            'action': {
              'type': 'message',
              'label': op,
              'text': op
            }
          }
          : {
            'type': 'action',
            'action': op
          }))
      }
    }
  }

  const confirmTemplate = (imageUrl, ownerDisplayName, ownerProvider, eventTitle, tx) => {
    console.log(`${imageResizeService}${encodeURIComponent(imageUrl)}`)

    const lineTemplate = new FlexMessageBuilder()
    const template = lineTemplate.flexMessage(`Confirm ticket ${eventTitle}`)
      .addBubble()
      .addHero(FlexComponentBuilder.flexImage()
        .setUrl(`${imageResizeService}${encodeURIComponent(imageUrl)}&size=240&seed=${Date.now()}`)
        .setSize('full')
        .setAspectRatio('1:1')
        .setAspectMode('cover')
        .build() as FlexImage)
      .addBody()
      .setSpacing('md')
      .addComponents(
        FlexComponentBuilder.flexText()
          .setText(`${ownerDisplayName} (${ownerProvider})`)
          .setWrap(true)
          .setWeight('bold')
          .setGarvity('center')
          .setSize('xl')
          .build(),
        FlexComponentBuilder.flexText()
          .setText(eventTitle)
          .setWrap(true)
          .setWeight('bold')
          .setGarvity('center')
          .setSize('md')
          .build(),
        FlexComponentBuilder.flexButton()
          .setStyle('primary')
          .setColor('#718792')
          .setAction({
            'type': 'postback',
            'label': 'CONFIRM',
            'displayText': 'Confirm',
            'data': `confirm ticket ${tx}`,
          })
          .build()
      )

    return template.build()
  }

  const buildTicketTemplate = (template, event, ticketUrl) => {
    return template.addBubble()
      .addHero(FlexComponentBuilder.flexImage()
        .setUrl(`${imageResizeService}${encodeURIComponent(event.coverImage)}&size=800&seed=${Date.now()}`)
        .setSize('full')
        .setAspectRatio('1.91:1')
        .setAspectMode('cover')
        .setAction({
          'type': 'uri',
          'uri': event.link,
          'label': limitChar(event.title, 37)
        })
        .build() as FlexImage)
      .addBody()
      .setLayout('vertical')
      .setSpacing('md')
      .addComponents(
        FlexComponentBuilder.flexText()
          .setText(event.title)
          .setWrap(true)
          .setWeight('bold')
          .setGravity('center')
          .setSize('xl')
          .build(),
        FlexComponentBuilder.flexBox()
          .setLayout('vertical')
          .setMargin('lg')
          .setSpacing('sm')
          .addContents(
            FlexComponentBuilder.flexBox()
              .setLayout('baseline')
              .setSpacing('md')
              .addContents(
                FlexComponentBuilder.flexText()
                  .setText('💡')
                  .setSize('sm')
                  .setGarvity('top')
                  .setFlex(0)
                  .build(),
                FlexComponentBuilder.flexText()
                  .setText(limitChar(replaceAll(event.description, '\\\\n', '\n'), 120))
                  .setWrap(true)
                  .setColor('#666666')
                  .setSize('sm')
                  .setGarvity('top')
                  .setFlex(1)
                  .build()
              )
              .build(),
            FlexComponentBuilder.flexBox()
              .setLayout('baseline')
              .setSpacing('md')
              .addContents(
                FlexComponentBuilder.flexText()
                  .setText('🗓️')
                  .setSize('sm')
                  .setGarvity('top')
                  .setFlex(0)
                  .build(),
                FlexComponentBuilder.flexText()
                  .setText(dayjs(event.startDate).format('dddd, MMMM D, YYYY HH:mm'))
                  .setWrap(true)
                  .setColor('#666666')
                  .setGarvity('center')
                  .setSize('sm')
                  .setFlex(4)
                  .build()
              )
              .build(),
            FlexComponentBuilder.flexBox()
              .setLayout('baseline')
              .setSpacing('md')
              .addContents(
                FlexComponentBuilder.flexText()
                  .setText('📍')
                  .setSize('sm')
                  .setGarvity('top')
                  .setFlex(0)
                  .build(),
                FlexComponentBuilder.flexText()
                  .setText(event.venue)
                  .setWrap(true)
                  .setColor('#666666')
                  .setGarvity('center')
                  .setSize('sm')
                  .setFlex(4)
                  .build()
              )
              .build()
          )
          .build(),
        FlexComponentBuilder.flexImage()
          .setUrl(`${ticketUrl}?seed=${Date.now()}`)
          .setAspectRatio('1:1')
          .setAspectMode('cover')
          .setSize('5xl')
          .build(),
        FlexComponentBuilder.flexText()
          .setText('You can use this ticket to enter the event')
          .setAlign('center')
          .setColor('#aaaaaa')
          .setWrap(true)
          .setMargin('xxl')
          .setSize('xs')
          .build()
      )
  }

  const ticketTemplate = (event, ticketUrl) => {
    console.log(`${imageResizeService}${encodeURIComponent(event.coverImage)}`)
    const lineTemplate = new FlexMessageBuilder()
    const template = lineTemplate.flexMessage(`Your ticket: ${event.title}`)
    buildTicketTemplate(template, event, ticketUrl)
    return template.build()
  }

  const ticketsTemplate = (tickets: { event, ticketUrl }[]) => {
    const lineTemplate = new FlexMessageBuilder()
    const template = lineTemplate.flexMessage('your tickets')
      .addCarousel()
    tickets.forEach(({ event, ticketUrl }) => buildTicketTemplate(template, event, ticketUrl))

    return template.build()
  }

  const confirmResultTemplate = (burntTx, firebaseTime, stellarTime, burntDate = null) => {
    const lineTemplate = new FlexMessageBuilder()
    const template = lineTemplate.flexMessage('Confirmed ticket')
      .addBubble()
      .addHeader()
      .addComponents(
        FlexComponentBuilder.flexBox()
          .setLayout('horizontal')
          .addContents(FlexComponentBuilder.flexText()
            .setText(`${burntDate ? `Used (${dayAgo(dayjs(burntDate))})` : 'Succeeded!'}`)
            .setWeight('bold')
            .setColor(burntDate ? '#ef5451' : null)
            .setSize('sm')
            .build())
          .build()
      )
      .addBody()
      .setStyleBackgroundColor('#EFEFEF')
      .setStyleSeparator(true)
      .setStyleSeparatorColor('#DDDDDD')
      .setLayout('vertical')
      .setSpacing('md')
      .addComponents(
        FlexComponentBuilder.flexText()
          .setText(burntTx)
          .setWrap(true)
          .setSize('sm')
          .build()
      )
      .addFooter()
      .setStyleSeparator(true)
      .setStyleSeparatorColor('#DDDDDD')
      .setLayout('vertical')
      .setSpacing('md')
      .addComponents(
        FlexComponentBuilder.flexText()
          .setText(`🔥  ${firebaseTime.toFixed(2)} ms    🚀  ${stellarTime.toFixed(2)} ms`)
          .setSize('sm')
          .build(),
        FlexComponentBuilder.flexButton()
          .setStyle('secondary')
          .setColor('#b0bec5')
          .setAction({
            'type': 'uri',
            'label': 'horizon',
            'uri': `https://horizon-testnet.stellar.org/transactions/${burntTx}`
          })
          .build(),
        FlexComponentBuilder.flexButton()
          .setStyle('secondary')
          .setColor('#b0bec5')
          .setAction({
            'type': 'uri',
            'label': 'stellar.expert',
            'uri': `https://stellar.expert/explorer/testnet/tx/${burntTx}`
          })
          .build(),
      )

    return template.build()
  }

  const balanceInfoTemplate = (walletAddress, balanceInfo, languageCode) => {
    const lineTemplate = new FlexMessageBuilder()
    const template = lineTemplate.flexMessage('wallet info')
      .addBubble()
      .addHeader()
      .addComponents(
        FlexComponentBuilder.flexBox()
          .setLayout('horizontal')
          .addContents(FlexComponentBuilder.flexText()
            .setText(`👛 ${languageCode === 'th' ? 'กระเป๋า' : 'Wallet'} (${niceIssuer(walletAddress)})`)
            .setWeight('bold')
            .setSize('sm')
            .build())
          .build()
      )
      .addBody()
      .setStyleBackgroundColor('#EFEFEF')
      .setStyleSeparator(true)
      .setStyleSeparatorColor('#DDDDDD')
      .setLayout('vertical')
      .setSpacing('md')
      .addComponents(
        ...balanceInfo
          .sort((a, b) => (a.code < b.code) ? -1 : (a.code > b.code ? 1 : 0))
          .map(balance => FlexComponentBuilder.flexBox()
            .setLayout('horizontal')
            .addContents(
              FlexComponentBuilder.flexText()
                .setText(formatCurrency(balance.balance))
                .setWrap(true)
                .setSize('sm')
                .build(),
              FlexComponentBuilder.flexText()
                .setText(balance.code)
                .setWrap(true)
                .setSize('sm')
                .build(),
              // TODO: compare known issuer
              FlexComponentBuilder.flexText()
                .setText(balance.issuer
                  ? (balance.code === 'CAT' ? '🐈' : `(${niceIssuer(balance.issuer)})`)
                  : '🚀')
                .setWrap(true)
                .setSize('sm')
                .build()
            )
            .build()
          )
      )
      .addFooter()
      .setStyleSeparator(true)
      .setStyleSeparatorColor('#DDDDDD')
      .setLayout('horizontal')
      .setSpacing('md')
      .addComponents(
        FlexComponentBuilder.flexButton()
          .setStyle('secondary')
          .setColor('#b0bec5')
          .setAction({
            'type': 'postback',
            'label': languageCode === 'th' ? 'ขอดูอีกรอบ' : 'Refresh',
            'displayText': languageCode === 'th' ? 'กระเป๋า' : 'wallet',
            'data': languageCode === 'th' ? 'กระเป๋า' : 'wallet',
          })
          .build(),
        FlexComponentBuilder.flexButton()
          .setStyle('secondary')
          .setColor('#b0bec5')
          .setAction({
            'type': 'postback',
            'label': languageCode === 'th' ? 'ส่งให้เพื่อน' : 'Transfer',
            'displayText': languageCode === 'th' ? 'ส่งให้เพื่อน' : 'Transfer',
            'data': languageCode === 'th' ? 'ส่งเหรียญ' : 'transfer',
          })
          .build(),
      )

    return template.build()
  }

  const inviteTemplate = (eventId, userId, eventTitle, ticketRemaing, languageCode) => {
    const lineTemplate = new FlexMessageBuilder()
    const template = lineTemplate.flexMessage('Invite friend')
      .addBubble()
      .addHeader()
      .addComponents(
        FlexComponentBuilder.flexBox()
          .setLayout('horizontal')
          .addContents(FlexComponentBuilder.flexText()
            .setText(eventTitle)
            .setWeight('bold')
            .setSize('sm')
            .build())
          .build()
      )
      .addBody()
      .setStyleBackgroundColor('#EFEFEF')
      .setStyleSeparator(true)
      .setStyleSeparatorColor('#DDDDDD')
      .setLayout('vertical')
      .setSpacing('md')
      .addComponents(
        FlexComponentBuilder.flexText()
          .setText(languageCode === 'th' ? `🎫  เหลือ ${ticketRemaing} ใบ` : `🎫  available ${ticketRemaing} tickets`)
          .setWrap(true)
          .setSize('sm')
          .build()
      )
      .addFooter()
      .setStyleSeparator(true)
      .setStyleSeparatorColor('#DDDDDD')
      .setLayout('horizontal')
      .setSpacing('md')
      .addComponents(
        FlexComponentBuilder.flexButton()
          .setStyle('secondary')
          .setColor('#b0bec5')
          .setAction({
            'type': 'uri',
            'label': languageCode === 'th' ? 'ชวนเพื่อน' : 'invite',
            'uri': `line://msg/text/?https://t.catcat.io/${eventId}`
          })
          .build(),
      )

    return template.build()
  }

  const makePaymentTemplate = (title, message, paymentLink) => {
    const lineTemplate = new FlexMessageBuilder()
    const template = lineTemplate.flexMessage('Invite friend')
      .addBubble()
      .addHeader()
      .addComponents(
        FlexComponentBuilder.flexBox()
          .setLayout('horizontal')
          .addContents(FlexComponentBuilder.flexText()
            .setText(title)
            .setWeight('bold')
            .setSize('sm')
            .build())
          .build()
      )
      .addBody()
      .setStyleBackgroundColor('#EFEFEF')
      .setStyleSeparator(true)
      .setStyleSeparatorColor('#DDDDDD')
      .setLayout('vertical')
      .setSpacing('md')
      .addComponents(
        FlexComponentBuilder.flexText()
          .setText(message)
          .setWrap(true)
          .setSize('sm')
          .build()
      )
      .addFooter()
      .setStyleSeparator(true)
      .setStyleSeparatorColor('#DDDDDD')
      .setLayout('horizontal')
      .setSpacing('md')
      .addComponents(
        FlexComponentBuilder.flexButton()
          .setStyle('secondary')
          .setColor('#b0bec5')
          .setAction({
            'type': 'uri',
            'label': 'Pay by LINE Pay',
            'uri': paymentLink
          })
          .build(),
      )

    return template.build()
  }

  const previewFacebookEventTemplate = (event, link, limit) => {
    const lineTemplate = new FlexMessageBuilder()
    const template = lineTemplate.flexMessage('Preview event card')
    const times = event.eventTime.split(' to ')

    template.addBubble()
      .addHero(FlexComponentBuilder.flexImage()
        .setUrl(`${imageResizeService}${encodeURIComponent(event.coverImage)}&size=1000&seed=${Date.now()}`)
        .setSize('full')
        .setAspectRatio('1.91:1')
        .setAspectMode('cover')
        .build() as FlexImage)
      .addBody()
      .setLayout('vertical')
      .setSpacing('sm')
      .addComponents(
        FlexComponentBuilder.flexText()
          .setText(event.title)
          .setWrap(true)
          .setWeight('bold')
          .setSize('xl')
          .build(),
        FlexComponentBuilder.flexText()
          .setText(`${limitChar(replaceAll(event.description, '\\\\n', '\n'), 120)}`)
          .setWrap(true)
          .setSize('md')
          .build(),
        FlexComponentBuilder.flexText()
          .setText(`${dayjs(times[0]).format('dddd, MMMM D, YYYY HH:mm')}`)
          .setWrap(true)
          .setColor('#999999')
          .setSize('xs')
          .build(),
        FlexComponentBuilder.flexText()
          .setText(`${limitChar(event.venue, 64)}`)
          .setWrap(true)
          .setColor('#999999')
          .setSize('xs')
          .build(),
        FlexComponentBuilder.flexText()
          .setText(`🎫  TICKET ${limit} (from ${limit})`)
          .setWrap(true)
          .setWeight('bold')
          .setSize('xs')
          .setMargin('md')
          .setColor('#222222')
          .build(),
        FlexComponentBuilder.flexText()
          .setText('💵  FREE')
          .setWrap(true)
          .setColor('#222222')
          .setWeight('bold')
          .setSize('xs')
          .build())
      .addFooter()
      .setSpacing('sm')
      .addComponents(FlexComponentBuilder.flexButton()
        .setStyle('primary')
        .setColor('#718792')
        .setAction({
          'type': 'message',
          'label': 'BOOK',
          'text': `BOOK ${event.title}`
        })
        .build())
      .addComponents(FlexComponentBuilder.flexBox()
        .setLayout('horizontal')
        .setSpacing('md')
        .addContents(
          FlexComponentBuilder.flexButton()
            .setAction({
              'type': 'uri',
              'label': 'MAP',
              'uri': event.venueLink
            })
            .build(),
          FlexComponentBuilder.flexButton()
            .setAction({
              'type': 'uri',
              'label': 'MORE',
              'uri': link
            })
            .build()
        )
        .build())

    return template.build()
  }


  return {
    listEvents,
    ticketTemplate,
    ticketsTemplate,
    confirmTemplate,
    quickReplyTemplate,
    confirmResultTemplate,
    providerName: 'line',
    balanceInfoTemplate,
    inviteTemplate,
    makePaymentTemplate,
    previewFacebookEventTemplate
  }
}
