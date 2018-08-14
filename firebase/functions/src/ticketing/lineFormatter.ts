import { IMessageFormatter } from './messageFormatter'
import { FlexMessage, FlexImage } from '@line/bot-sdk'
import { FlexMessageBuilder, FlexComponentBuilder } from './lineMessageBuilder'

export const lineMessageFormatter = ({ imageResizeService }): IMessageFormatter => {
  const limitChar = (str, limit) => {
    return str.substr(0, limit)
  }

  const listEvents = (events: any[]): FlexMessage => {
    const lineTemplate = new FlexMessageBuilder()
    const template = lineTemplate.flexMessage('Event list')
      .addCarousel()

    events.forEach(event =>
      template.addBubble()
        .addHero(FlexComponentBuilder.flexImage()
          .setUrl(`${imageResizeService}${encodeURIComponent(event.coverImage)}`)
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
            .setText(`${limitChar(event.description, 60)}`)
            .setWrap(true)
            .setWeight('bold')
            .setSize('md')
            .build(),
          FlexComponentBuilder.flexText()
            .setText(`BOOKED (${event.ticket_bought || 0}/${event.ticket_max})`)
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
          .setAction({
            'type': 'message',
            'label': 'JOIN',
            'text': `Join ${event.title}`,
          })
          .build())
        .addComponents(FlexComponentBuilder.flexButton()
          .setAction({
            'type': 'uri',
            'label': 'MORE',
            'uri': event.link
          })
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
        .setUrl(`${imageResizeService}${encodeURIComponent(imageUrl)}`)
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
          .setAction({
            'type': 'message',
            'label': 'CONFIRM',
            'text': `use ticket ${tx}`,
          })
          .build()
      )

    return template.build()
  }

  const ticketTemplate = (event, ticketUrl) => {
    console.log(`xx ${imageResizeService}${encodeURIComponent(event.coverImage)}`)
    const lineTemplate = new FlexMessageBuilder()
    const template = lineTemplate.flexMessage(`Your ticket: ${event.title}`)
      .addBubble()
      .addHero(FlexComponentBuilder.flexImage()
        .setUrl(`${imageResizeService}${encodeURIComponent(event.coverImage)}`)
        .setSize('full')
        .setAspectRatio('1.91:1')
        .setAspectMode('cover')
        .setAction({
          'type': 'uri',
          'uri': event.link,
          'label': event.title
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
              .setSpacing('sm')
              .addContents(
                FlexComponentBuilder.flexText()
                  .setText('Info')
                  .setColor('#aaaaaa')
                  .setSize('sm')
                  .setFlex(1)
                  .build(),
                FlexComponentBuilder.flexText()
                  .setText(event.description)
                  .setWrap(true)
                  .setColor('#666666')
                  .setSize('sm')
                  .setFlex(4)
                  .build()
              )
              .build(),
            FlexComponentBuilder.flexBox()
              .setLayout('baseline')
              .setSpacing('sm')
              .addContents(
                FlexComponentBuilder.flexText()
                  .setText('Date')
                  .setColor('#aaaaaa')
                  .setSize('sm')
                  .setFlex(1)
                  .build(),
                FlexComponentBuilder.flexText()
                  .setText(event.startDate)
                  .setWrap(true)
                  .setColor('#666666')
                  .setSize('sm')
                  .setFlex(4)
                  .build()
              )
              .build()
          )
          .build(),
          FlexComponentBuilder.flexImage()
            .setUrl(ticketUrl)
            .setAspectRatio('1:1')
            .setAspectMode('cover')
            .setSize('5xl')
            .build(),
          FlexComponentBuilder.flexText()
            .setText('You can enter the event by using this code instead of a ticket')
            .setColor('#aaaaaa')
            .setWrap(true)
            .setMargin('xxl')
            .setSize('xs')
            .build()
      )

    return template.build()
  }

  return {
    listEvents,
    ticketTemplate,
    confirmTemplate,
    welcomeTemplate,
    providerName: 'line'
  }
}