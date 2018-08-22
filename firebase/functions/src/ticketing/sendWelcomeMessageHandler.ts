export default (messagingProvider, messageFormatterProvider) => async ({ requestSource, from, languageCode }) => {
  console.log(`send greeting message tp ${from}`)
  const messageSender = messagingProvider.get(requestSource)
  const formatter = messageFormatterProvider.get(requestSource)
  const welcomeMessage = languageCode === 'th'
    ? formatter.welcomeTemplate('ดีจ้า มีอะไรให้ช่วยมั๊ย?', 'มีงานอีเว้นท์อะไรบ้าง', 'ไม่เป็นไร')
    : formatter.welcomeTemplate('Hi there, how can I help you?', 'Show Events', 'Nothing')

  return messageSender
    && messageSender.sendCustomMessages(from, welcomeMessage)
}