import { IMessageFormatter } from './messageFormatter'
import { FlexMessage, FlexImage } from '@line/bot-sdk'
import { FlexMessageBuilder, FlexComponentBuilder } from '../messaging/lineMessageBuilder'
import * as dayjs from 'dayjs'
const relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)

const dayAgo = (day: dayjs.Dayjs) => {
  return (day as any).fromNow()
}

export const lineMessageFormatter = ({ imageResizeService }): IMessageFormatter => {
  const limitChar = (str, limit) => {
    return str.substr(0, limit)
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
            .setText(`${event.description}`)
            .setWrap(true)
            .setSize('md')
            .build(),
          FlexComponentBuilder.flexText()
            .setText(event.venue)
            .setWrap(true)
            .setColor('#999999')
            .setSize('xs')
            .build(),
          FlexComponentBuilder.flexText()
            .setText(dayjs(event.startDate).format('dddd, MMMM D, YYYY h:mm A'))
            .setWrap(true)
            .setColor('#999999')
            .setSize('xs')
            .build(),
          FlexComponentBuilder.flexText()
            .setText(`🎫 AVAILABLE (${event.ticket_max - (event.ticket_bought || 0)})`)
            .setWrap(true)
            .setWeight('bold')
            .setSize('xs')
            .setMargin('md')
            .setColor('#222222')
            .build())
        .addFooter()
        .setSpacing('sm')
        .addComponents(FlexComponentBuilder.flexButton()
          .setStyle('primary')
          .setColor('#718792')
          .setAction({
            'type': 'message',
            'label': bookedEvent && bookedEvent.indexOf(event.id) >= 0 ? `${languageCode === 'th' ? 'ยกเลิก' : 'CANCEL'}` : `${languageCode === 'th' ? 'จอง' : 'BOOK'} (${event.ticket_bought || 0}/${event.ticket_max})`,
            'text': bookedEvent && bookedEvent.indexOf(event.id) >= 0 ? `${languageCode === 'th' ? 'ยกเลิก' : 'CANCEL'}` : `${languageCode === 'th' ? 'จองตั๋ว' : 'Book'} ${event.title}`,
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

  const welcomeTemplate = (message, ...options) => {
    return {
      'type': 'text',
      'text': message,
      'quickReply': {
        'items': options.map(op => ({
          'type': 'action',
          'action': {
            'type': 'message',
            'label': op,
            'text': op
          }
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

  const ticketTemplate = (event, ticketUrl) => {
    console.log(`${imageResizeService}${encodeURIComponent(event.coverImage)}`)
    const lineTemplate = new FlexMessageBuilder()
    const template = lineTemplate.flexMessage(`Your ticket: ${event.title}`)
      .addBubble()
      .addHero(FlexComponentBuilder.flexImage()
        .setUrl(`${imageResizeService}${encodeURIComponent(event.coverImage)}&size=800&seed=${Date.now()}`)
        .setSize('full')
        .setAspectRatio('1.91:1')
        .setAspectMode('cover')
        .setAction({
          'type': 'uri',
          'uri': event.link,
          'label': limitChar(event.title, 40)
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
                FlexComponentBuilder.flexIcon()
                  .setUrl('https://raw.githubusercontent.com/catcatio/material-design-icons/master/action/2x_web/ic_info_outline_black_18dp.png')
                  .setSize('sm')
                  .build(),
                FlexComponentBuilder.flexText()
                  .setText(event.description)
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
                FlexComponentBuilder.flexIcon()
                  .setUrl('https://raw.githubusercontent.com/catcatio/material-design-icons/master/device/2x_web/ic_access_time_black_18dp.png')
                  .setSize('sm')
                  .build(),
                FlexComponentBuilder.flexText()
                  .setText(dayjs(event.startDate).format('dddd, MMMM D, YYYY h:mm A'))
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
                FlexComponentBuilder.flexIcon()
                  .setUrl('https://raw.githubusercontent.com/catcatio/material-design-icons/master/communication/2x_web/ic_location_on_black_18dp.png')
                  .setSize('sm')
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

  const balanceInfoTemplate = (balanceInfo, languageCode) => {
    return {
      'type': 'text',
      'text': !balanceInfo || balanceInfo.length <= 0
        ? languageCode === 'th' ? 'ไม่พบข้อมูล' : 'Account not found'
        : balanceInfo.map(balance => `${balance.balance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} ${balance.code}`).join('\n')
    }
  }

  return {
    listEvents,
    ticketTemplate,
    confirmTemplate,
    welcomeTemplate,
    confirmResultTemplate,
    providerName: 'line',
    balanceInfoTemplate
  }
}