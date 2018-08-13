import { Response } from 'express'

export const sendDialogflowTextMessage = (res: Response, text: string, retCode: number = 200) => {
  return res.status(retCode).send({
    'dialogflow': {
      'text': {
        text
      }
    }
  })
}