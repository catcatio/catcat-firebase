import { Request, Response, RequestHandler, Router } from 'express'

export const apiPath = '/v1/event'

export default (ticketingSystem): RequestHandler => {

  const router = Router()

  router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now())
    next()
  })

  router.use('/afterEvent/:eventId/:userId?', async (req: Request, res: Response) => {
    return (req.params.userId
      ? ticketingSystem.processAfterEvent(req.params)
      : ticketingSystem.setupAfterEvent(req.params)
    )
      .then(() => res.sendStatus(200))
  })

  return router
}