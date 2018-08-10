import { Request, Response, RequestHandler } from 'express'

const request = require('request')
const im = require('imagemagick-stream')

export const sizeApiHandler = (): RequestHandler => {
  return (req: Request, res: Response) => {
    const startTime = Date.now()

    res.on('finish', () => {
      console.log(`sizeApiHandler: ${Date.now() - startTime}`)
    })

    const url = req.query.url
    const size = req.query.size || 512
    console.log(url, size)
    const resize = im().resize(`${size}x${size}`).quality(90)
    request.get(url).pipe(resize).pipe(res)
  }
}