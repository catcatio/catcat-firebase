require('@rabbotio/noconsole')

import firebaseConfig from './firebaseConfig'
import { HrtimeMarker } from './utils/hrtimeMarker'

let hrMarker = HrtimeMarker.create('bootstraping')
console.log(`functions started: ${process.version}`)

import { linkApi, ozApi } from './api'
import { initMessagingProvider } from './messaging'
import { wrapApi } from './utils/wrapApi'

const messagingProvider = initMessagingProvider(firebaseConfig)

const link = wrapApi(linkApi(firebaseConfig))
const oz = wrapApi(ozApi(messagingProvider, firebaseConfig))

hrMarker.end()
hrMarker = null

export {
  link,
  oz
}
