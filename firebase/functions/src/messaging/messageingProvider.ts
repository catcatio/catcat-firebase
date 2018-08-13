import { facebookClient } from './facebookClient'
import { lineClient } from './lineClient'
import { IMessagingClient } from './messagingClient'

export const initMessagingProvider = (firebaseConfig): IMessageingProvider => {
  const line = lineClient(firebaseConfig)
  const facebook = facebookClient(firebaseConfig)

  const fromString = (provider: string): IMessagingClient => {
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

  const fromObject = (ownerProviders: object): IMessagingClient => {
    return ownerProviders.hasOwnProperty(line.providerName)
      ? line
      : ownerProviders.hasOwnProperty(facebook.providerName)
        ? facebook :
        null
  }

  const get = (provider: string | object): IMessagingClient => {
    return typeof provider === 'string'
      ? fromString(provider)
      : fromObject(provider)
  }

  return {
    get
  }
}

export interface IMessageingProvider {
  get(string): IMessagingClient
}