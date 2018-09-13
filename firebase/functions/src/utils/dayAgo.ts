import * as dayjs from 'dayjs'
const relativeTime = require('dayjs/plugin/relativeTime')
const th = require('dayjs/locale/th')
dayjs.extend(relativeTime)

export const fromString = (day: string, languageCode = '') => {
  const opt: any = languageCode === 'th' ? { locale: th } : {}
  return (dayjs(day, opt) as any).fromNow()
}

export const from = (day: dayjs.Dayjs) => {
  return (day as any).fromNow()
}
