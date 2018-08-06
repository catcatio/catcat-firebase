import * as express from 'express'
// tslint:disable-next-line:no-duplicate-imports
import { Express, Request, Response, RequestHandler } from 'express'
import * as Cors from 'cors'
import { database } from 'firebase-admin'

const apiHandler = (db: database.Database): RequestHandler => (req: Request, res: Response) => {
  const sendOKAt = (data: any, error?: any) =>
    res.status(200).send({
      data,
      error,
      at: new Date().toISOString()
    })

  const willLink = async (provider, id, publicKey) => {
    const ref = db.ref(`/${provider}`)
    await ref.child(id).set(publicKey)
    return { id }
  }

  return (): any => {
    const { provider, id, publicKey } = req.body
    if (!provider) return sendOKAt(null, 'Required : provider')
    if (!id) return sendOKAt(null, 'Required : id')
    if (!publicKey) return sendOKAt(null, 'Required : publicKey')

    willLink(provider, id, publicKey)
      .then(payload => sendOKAt(payload))
      .catch(err => sendOKAt(null, err))
  }
}

export const linkApi = (db: database.Database): Express => {
  const api = express()
  api.use(Cors({ origin: true }))
  api.post('/', apiHandler(db))
  return api
}