import firebaseConfig from './firebaseConfig'
import { StopWatch } from './utils/StopWatch'

const debug = require('debug')('catcat:default')
debug(`functions started: ${process.version}`)

let stopWatch = StopWatch.create('Bootstraping').start()

import { linkApi, ozApi } from './api'
import { initMessagingProvider } from './messaging'
import { wrapApi } from './utils/wrapApi'

const messagingProvider = initMessagingProvider(firebaseConfig)

const link = wrapApi(linkApi(firebaseConfig))
const oz = wrapApi(ozApi(messagingProvider, firebaseConfig))

export {
  link,
  oz
}

stopWatch.end().clear()
stopWatch = null