import { linkApi, ozApi } from './api'
import { facebookClient, lineClient } from './messagingClient'
import { wrapApi } from './utils/wrapApi'
import firebaseConfig from './firebaseConfig'

console.log(`functions started: ${process.version}`)

const line = lineClient(firebaseConfig)
const facebook = facebookClient(firebaseConfig)

const link = wrapApi(linkApi(firebaseConfig))
const oz = wrapApi(ozApi({ line, facebook }, firebaseConfig))

export {
  link,
  oz
}