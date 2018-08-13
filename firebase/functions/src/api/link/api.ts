import { Request, Response, RequestHandler } from 'express'
import { database as firebase } from 'firebase-admin'

export const apiPath = '/'

export default (db: firebase.Database): RequestHandler => (req: Request, res: Response) => {
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