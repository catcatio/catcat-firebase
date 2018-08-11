import { Request, Response, RequestHandler } from 'express'

const request = require('request')
const im = require('imagemagick-stream')

export const sizeApiHandler = (): RequestHandler => {
  return (req: Request, res: Response) => {
    console.log('start sizeApiHandler')
    const startTime = Date.now()

    res.on('finish', () => {
      console.log(`sizeApiHandler: ${Date.now() - startTime}`)
    })
    res.on('error', (err) => {
      console.log(err)
    })

    const url = req.query.url
    const size = req.query.size || 512
    console.log('sizeApiHandler', url, size)
    const resize = im().resize(`${size}x${size}`).quality(75)

    request.get(url)
      .on('response', (response) => {
        res.header('Content-Type', response.headers['content-type'])
      })
      .pipe(resize)
      .pipe(res)
  }
}