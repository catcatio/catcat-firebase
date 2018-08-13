export const lineClient = ({ lineBotApi, lineChannelAccessToken }) => {
  const request = require('request')
  const messageApiUrl = `${lineBotApi}/message/push`
  const profileApiUrl = `${lineBotApi}/profile`

  const postJSON = (url, data, opts) => new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: url,
      body: JSON.stringify(data),
      headers: Object.assign({}, opts.headers, { 'Content-Type': 'application/json' }),

    }, (err, response, body) => {
      if (err) {
        reject(err)
        console.log(err)
        return
      }

      if (typeof body === 'string') {
        resolve(JSON.parse(body))
      } else {
        resolve(body)
      }
    })
  })

  const getJSON = (url, data, opts) => new Promise((resolve, reject) => {
    request({
      method: 'GET',
      url: url,
      headers: Object.assign({}, opts.headers, { 'Content-Type': 'application/json' }),

    }, (err, response, body) => {
      if (err) {
        reject(err)
        console.log(err)
        return
      }
      console.log(typeof body)
      if (typeof body === 'string') {
        resolve(JSON.parse(body))
      } else {
        resolve(body)
      }

    })
  })

  const headers = {
    'Authorization': `Bearer ${lineChannelAccessToken}`,
  }

  const sendMessages = (recipientId, ...messages) => {
    const data = {
      'to': recipientId,
      'messages': messages
    }
    return postJSON(messageApiUrl, data, { headers })
  }

  const sendImage = async (recipientId, imageUrl, thumbnailUrl, textMessage = null) => {
    const messages: any[] = [{
      'type': 'image',
      'originalContentUrl': imageUrl,
      'previewImageUrl': thumbnailUrl
    }]

    textMessage && messages.push({
      'type': 'text',
      'text': textMessage
    })

    return sendMessages(recipientId, ...messages).catch(err => console.log(err))
  }

  const sendMessage = (recipientId, text) => {
    const message = {
      'type': 'text',
      'text': text
    }

    return sendMessages(recipientId, message).catch(err => console.log(err))
  }

  const sendCustomMessages = (recipientId, ...messages) => {
    return sendMessages(recipientId, ...messages).catch(err => console.log(err))
  }

  const getProfile = (userId) => {
    return getJSON(`${profileApiUrl}/${userId}`, {}, { headers }).catch(err => console.log(err))
  }

  return {
    sendImage,
    sendMessage,
    sendCustomMessages,
    getProfile
  }
}