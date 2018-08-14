export interface IMessageFormatter {
  listEvents: (events: any[]) => object
  ticketTemplate: (event: any, ticketUrl: string) => object
  confirmTemplate: (pictureUrl: string, displayName: string, ownerProvider: string, eventTitle: string, tx: string) => object
  welcomeTemplate: (message: string, ...options: string[]) => object
  providerName: string
}