import { IMessagingClient } from './messagingClient'

export const facebookClient = ({fbUrl, fbAccessToken}): IMessagingClient => {
  const { postJSON } = require('@rabbotio/fetcher')
  const url = `${fbUrl}?access_token=${fbAccessToken}`
  const sendImage = async (recipientId, imageUrl) => {
    const payload = {
      'messaging_type': 'NON_PROMOTIONAL_SUBSCRIPTION',
      'recipient': {
        'id': recipientId
      },
      'message': {
        'attachment': {
          'type': 'image',
          'payload': {
            'is_reusable': true,
            'url': imageUrl
          }
        }
      }
    }
    return postJSON(url, payload).catch(err => console.log(err))
  }

  const sendMessage = (recipientId, text) => {
    const payload = {
      'messaging_type': 'NON_PROMOTIONAL_SUBSCRIPTION',
      'recipient': {
        'id': recipientId
      },
      'message': {
        text
      }
    }
    return postJSON(url, payload).catch(err => console.log(err))
  }

  const sendCustomMessages = (recipientId, message) => {
    const payload = {
      'messaging_type': 'NON_PROMOTIONAL_SUBSCRIPTION',
      'recipient': {
        'id': recipientId
      },
      'message': message
    }
    return postJSON(url, payload).catch(err => console.log(err))
  }

  const getProfile = () => {
    return {}
  }

  return {
    sendImage,
    sendMessage,
    sendCustomMessages,
    getProfile,
    providerName: 'facebook'
  }
}