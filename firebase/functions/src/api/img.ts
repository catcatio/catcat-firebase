import * as express from 'express'
// tslint:disable-next-line:no-duplicate-imports
import { Express, Request, Response, RequestHandler } from 'express'
import * as Cors from 'cors'

const request = require('request')
const im = require('imagemagick-stream')

const sizeApiHandler = (): RequestHandler => {
  return (req: Request, res: Response) => {
    const url = req.query.url
    const size = req.query.size || 512
    console.log(url)
    const resize = im().resize(`${size}x${size}`).quality(90);
    request.get(url).pipe(resize).pipe(res)
  }
}

export const imgApi = (): Express => {
  const api = express()
  api.use(Cors({ origin: true }))

  api.get('/size', sizeApiHandler())
  return api
}