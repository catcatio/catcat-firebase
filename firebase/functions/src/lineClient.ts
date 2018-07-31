export const lineClient = ({ linemessageapi, linechannelaccesstoken }) => {
  const { postJSON } = require('@rabbotio/fetcher')
  const url = `${linemessageapi}/push`

  const headers = {
    'Authorization': `Bearer ${linechannelaccesstoken}`,
  }

  const sendMessages = (recipientId, ...messages) => {
    const data = {
      "to": recipientId,
      "messages": messages
    }
    return postJSON(url, data, { headers })
  }

  const sendImage = async (recipientId, imageUrl, thumbnailUrl, textMessage = null) => {
    const messages: any[] = [{
      "type": "image",
      "originalContentUrl": imageUrl,
      "previewImageUrl": thumbnailUrl
    }]

    textMessage && messages.push({
      "type": "text",
      "text": textMessage
    })

    return sendMessages(recipientId, ...messages).catch(err => console.log(err))
  }

  const sendMessage = (recipientId, text) => {
    const message = {
      "type": "text",
      "text": text
    }

    return sendMessages(recipientId, message).catch(err => console.log(err))
  }

  const sendCustomMessages = (recipientId, ...messages) => {
    return sendMessages(recipientId, ...messages).catch(err => console.log(err))
  }

  return {
    sendImage,
    sendMessage,
    sendCustomMessages
  }
}