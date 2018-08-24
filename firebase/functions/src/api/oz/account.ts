// import { Request, Response, RequestHandler, Router } from 'express'
// import * as request from 'request'

// export const apiPath = '/account'



// export default (ticketingSystem): RequestHandler => {

//   const router = Router()

//   const getAccountInfoRequestHandler = (req: Request, res: Response) => {
//     const accountId = req.params.accountId

//     return ticketingSystem.getStellarAccountInfo(accountId)
//   }

//   router.use('/:accountId', getAccountInfoRequestHandler)
//   return router
// }