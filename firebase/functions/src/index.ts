import { config } from 'firebase-functions'
import * as admin from 'firebase-admin'

import { linkApi, ozApi } from './api'
import { facebookClient } from './facebookClient'
import { lineClient } from './lineClient'
import { wrapApi } from './utils/wrapApi'

console.log(`functions started: ${process.version}`)

admin.initializeApp(config().firebase)

const database = null // admin.database()
const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })

const firebaseConfig = require('./firebaseConfig')(firestore, database)
const line = lineClient(firebaseConfig)
const facebook = facebookClient(firebaseConfig)

const link = wrapApi(linkApi(firebaseConfig))
const oz = wrapApi(ozApi({ line, facebook }, firebaseConfig))

export {
  link,
  oz
}