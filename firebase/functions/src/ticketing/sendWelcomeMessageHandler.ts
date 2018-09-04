const welcomeMessage = (languageCode, formatter) => languageCode === 'th'
  ? formatter.welcomeTemplate('ดีจ้า มีอะไรให้ช่วยมั๊ย?', 'มีงานอีเว้นท์อะไรบ้าง', 'ไม่เป็นไร')
  : formatter.welcomeTemplate('Hi there! We\'re tickets agent. You can try type "event" for listing an events.', 'Event', 'Nothing')

const welcomeBackMessage = (languageCode, formatter) => languageCode === 'th'
  ? formatter.welcomeTemplate('เป็นไงบ้าง เหงาป่าว? หาอะไรทำมั๊ย', 'มีงานอีเว้นท์อะไรบ้าง', 'เปล่า')
  : formatter.welcomeTemplate('Welcome back, how can I help you today?', 'Event', 'Nothing')


export default (messagingProvider, messageFormatterProvider) => async ({ requestSource, from, languageCode }, isNewSession = false) => {
  console.log(`send greeting message tp ${from}`)
  const messageSender = messagingProvider.get(requestSource)
  const formatter = messageFormatterProvider.get(requestSource)
  const message = isNewSession ? welcomeBackMessage(languageCode, formatter) : welcomeMessage(languageCode, formatter)

  return messageSender
    && messageSender.sendCustomMessages(from, message)
}