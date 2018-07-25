export const facebookClient = ({fburl, fbaccesstoken}) => {
  const { postJSON } = require('@rabbotio/fetcher')
  const url = `${fburl}?access_token=${fbaccesstoken}`
  const sendImageToFacebook = async (recipientId, imageUrl, message = '') => {
    const payload = {
      "messaging_type": "NON_PROMOTIONAL_SUBSCRIPTION",
      "recipient": {
        "id": recipientId
      },
      "message": {
        "attachment": {
          "type": "image",
          "payload": {
            "is_reusable": true,
            "url": imageUrl
          }
        }
      }
    }
    return postJSON(url, payload).catch(err => console.log(err))
  }

  const sendMessage = (recipientId, text) => {
    const payload = {
      "messaging_type": "NON_PROMOTIONAL_SUBSCRIPTION",
      "recipient": {
        "id": recipientId
      },
      "message": {
        text
      }
    }
    return postJSON(url, payload).catch(err => console.log(err))
  }

  return {
    sendImageToFacebook,
    sendMessage
  }
}