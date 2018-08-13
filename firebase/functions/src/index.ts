import { linkApi, ozApi } from './api'
import { initMessagingProvider } from './messaging'
import { wrapApi } from './utils/wrapApi'
import firebaseConfig from './firebaseConfig'

console.log(`functions started: ${process.version}`)

const messagingProvider = initMessagingProvider(firebaseConfig)

const link = wrapApi(linkApi(firebaseConfig))
const oz = wrapApi(ozApi(messagingProvider, firebaseConfig))

export {
  link,
  oz
}