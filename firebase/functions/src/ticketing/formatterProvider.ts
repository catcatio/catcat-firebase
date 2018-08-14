import { facebookMessageFormatter } from './facebookFormatter'
import { lineMessageFormatter } from './lineFormatter'
import { IMessageFormatter } from './messageFormatter'
import { IFirebaseConfig } from '../firebaseConfig'

export const initMessageFormatterProvider = (firebaseConfig: IFirebaseConfig): IMessageFormatterProvider => {
  const line = lineMessageFormatter(firebaseConfig)
  const facebook = facebookMessageFormatter(firebaseConfig)

  const fromString = (provider: string): IMessageFormatter => {
    const lcProvider = (provider || '').toLowerCase()
    switch (lcProvider) {
      case line.providerName:
        return line

      case facebook.providerName:
        return facebook

      default:
        return null
    }
  }

  const fromObject = (ownerProviders: object): IMessageFormatter => {
    if (!ownerProviders) {
      return null
    }

    return ownerProviders.hasOwnProperty(line.providerName)
      ? line
      : ownerProviders.hasOwnProperty(facebook.providerName)
        ? facebook :
        null
  }

  const get = (provider: string | object): IMessageFormatter => {
    return typeof provider === 'string'
      ? fromString(provider)
      : fromObject(provider)
  }

  return {
    get
  }
}


export interface IMessageFormatterProvider {
  get: (provider: string | object) => IMessageFormatter
}


