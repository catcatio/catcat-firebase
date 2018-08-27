require('@rabbotio/noconsole')

import firebaseConfig from './firebaseConfig'
import { HrtimeMarker } from './utils/hrtimeMarker'

let hrMarker = HrtimeMarker.create('bootstraping')
console.log(`functions started: ${process.version}`)

import { linkApi, ozApi } from './api'
import { wrapApi } from './utils/wrapApi'


const link = wrapApi(linkApi(firebaseConfig))
const oz = wrapApi(ozApi(firebaseConfig))

hrMarker.end()
hrMarker = null

export {
  link,
  oz
}
