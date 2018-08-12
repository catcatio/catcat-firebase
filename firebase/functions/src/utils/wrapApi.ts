import { Request, Response, https } from 'firebase-functions'

export const wrapApi = (api: (request: Request, response: Response) => any) =>
  https.onRequest((request: Request, response: Response) => {
    if (!request.path) {
      request.url = `/${request.url}` // prepend '/' to keep query params if any
    }
    return api(request, response)
  })
