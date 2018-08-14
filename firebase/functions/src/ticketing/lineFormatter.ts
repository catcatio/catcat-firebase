import { IMessageFormatter } from './messageFormatter'

export const lineMessageFormatter = ({ imageResizeService }): IMessageFormatter => {
  const limitChar = (str, limit) => {
    return str.substr(0, limit)
  }

  const listEvents = (events: any[]) => {
    console.log('number of events', events.length)
    return {
      'type': 'flex',
      'altText': 'Event list',
      'contents': {
        'type': 'carousel',
        'contents': events.map(event => ({
          'type': 'bubble',
          'hero': {
            'type': 'image',
            'size': 'full',
            'aspectRatio': '20:13',
            'aspectMode': 'cover',
            'url': event.coverImage
          },
          'body': {
            'type': 'box',
            'layout': 'vertical',
            'spacing': 'sm',
            'contents': [
              {
                'type': 'text',
                'text': event.title,
                'wrap': true,
                'weight': 'bold',
                'size': 'xl'
              },
              {
                'type': 'box',
                'layout': 'baseline',
                'contents': [
                  {
                    'type': 'text',
                    'text': `${limitChar(event.description, 60)}`,
                    'wrap': true,
                    'size': 'md',
                    'flex': 0
                  }
                ]
              },
              {
                'type': 'text',
                'text': `Remains ${40} from ${event.limit}`,
                'wrap': true,
                'weight': 'bold',
                'size': 'xs',
                'margin': 'md',
                'color': '#222222',
                'flex': 0
              }
            ]
          },
          'footer': {
            'type': 'box',
            'layout': 'vertical',
            'spacing': 'sm',
            'contents': [
              {
                'type': 'button',
                'style': 'primary',
                'action': {
                  'type': 'message',
                  'label': 'JOIN',
                  'text': `Join ${event.title}`,
                }
              },
              {
                'type': 'button',
                'action': {
                  'type': 'uri',
                  'label': 'MORE',
                  'uri': event.link
                }
              }
            ]
          }
        })),
      }
    }
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
    return {
      'type': 'flex',
      'altText': `Confirm ticket ${eventTitle}`,
      'contents': {
        'type': 'bubble',
        'hero': {
          'type': 'image',
          'url': `${imageResizeService}${encodeURIComponent(imageUrl)}`,
          'size': 'full',
          'aspectRatio': '20:13',
          'aspectMode': 'cover'
        },
        'body': {
          'type': 'box',
          'layout': 'vertical',
          'spacing': 'md',
          'contents': [
            {
              'type': 'text',
              'text': `${ownerDisplayName} (${ownerProvider})`,
              'wrap': true,
              'weight': 'bold',
              'gravity': 'center',
              'size': 'xl'
            },
            {
              'type': 'text',
              'text': eventTitle,
              'wrap': true,
              'weight': 'bold',
              'gravity': 'center',
              'size': 'md'
            },
            {
              'type': 'button',
              'style': 'primary',
              'action': {
                'type': 'message',
                'label': 'CONFIRM',
                'text': `use ticket ${tx}`,
              }
            },
          ]
        }
      }
    }
  }

  const lineTicketBubbleFormatter = (event, ticketUrl) => {
    return {
      'type': 'bubble',
      'hero': {
        'type': 'image',
        'url': `${event.coverImage}`,
        'size': 'full',
        'aspectRatio': '20:13',
        'aspectMode': 'cover',
        'action': {
          'type': 'uri',
          'uri': event.link
        }
      },
      'body': {
        'type': 'box',
        'layout': 'vertical',
        'spacing': 'md',
        'contents': [
          {
            'type': 'text',
            'text': event.title,
            'wrap': true,
            'weight': 'bold',
            'gravity': 'center',
            'size': 'xl'
          },
          {
            'type': 'box',
            'layout': 'baseline',
            'margin': 'md',
            'contents': [
              {
                'type': 'icon',
                'size': 'sm',
                'url': 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png'
              },
              {
                'type': 'icon',
                'size': 'sm',
                'url': 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png'
              },
              {
                'type': 'icon',
                'size': 'sm',
                'url': 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png'
              },
              {
                'type': 'icon',
                'size': 'sm',
                'url': 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png'
              },
              {
                'type': 'icon',
                'size': 'sm',
                'url': 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gray_star_28.png'
              },
              {
                'type': 'text',
                'text': '4.0',
                'size': 'sm',
                'color': '#999999',
                'margin': 'md',
                'flex': 0
              }
            ]
          },
          {
            'type': 'box',
            'layout': 'vertical',
            'margin': 'lg',
            'spacing': 'sm',
            'contents': [
              {
                'type': 'box',
                'layout': 'baseline',
                'spacing': 'sm',
                'contents': [
                  {
                    'type': 'text',
                    'text': 'Date',
                    'color': '#aaaaaa',
                    'size': 'sm',
                    'flex': 1
                  },
                  {
                    'type': 'text',
                    'text': event.startDate,
                    'wrap': true,
                    'size': 'sm',
                    'color': '#666666',
                    'flex': 4
                  }
                ]
              },
              {
                'type': 'box',
                'layout': 'baseline',
                'spacing': 'sm',
                'contents': [
                  {
                    'type': 'text',
                    'text': 'Place',
                    'color': '#aaaaaa',
                    'size': 'sm',
                    'flex': 1
                  },
                  {
                    'type': 'text',
                    'text': '7 Floor, No.3',
                    'wrap': true,
                    'color': '#666666',
                    'size': 'sm',
                    'flex': 4
                  }
                ]
              },
              {
                'type': 'box',
                'layout': 'baseline',
                'spacing': 'sm',
                'contents': [
                  {
                    'type': 'text',
                    'text': 'Seats',
                    'color': '#aaaaaa',
                    'size': 'sm',
                    'flex': 1
                  },
                  {
                    'type': 'text',
                    'text': 'HUBBA',
                    'wrap': true,
                    'color': '#666666',
                    'size': 'sm',
                    'flex': 4
                  }
                ]
              }
            ]
          },
          {
            'type': 'box',
            'layout': 'vertical',
            'margin': 'xxl',
            'contents': [
              {
                'type': 'spacer'
              },
              {
                'type': 'image',
                'url': ticketUrl,
                'aspectMode': 'cover',
                'size': 'xl'
              },
              {
                'type': 'text',
                'text': 'You can enter the event by using this code instead of a ticket',
                'color': '#aaaaaa',
                'wrap': true,
                'margin': 'xxl',
                'size': 'xs'
              }
            ]
          }
        ]
      }
    }
  }

  const ticketTemplate = (event, ticketUrl) => {
    return {
      'type': 'flex',
      'altText': 'Here is your ticket',
      'contents': lineTicketBubbleFormatter(event, ticketUrl)
    }
  }

  return {
    listEvents,
    ticketTemplate,
    confirmTemplate,
    welcomeTemplate,
    providerName: 'line'
  }
}