export interface IMessageFormatter {
  listEvents: (events: any[], languageCode: string) => object
  ticketTemplate: (event: any, ticketUrl: string) => object
  confirmTemplate: (pictureUrl: string, displayName: string, ownerProvider: string, eventTitle: string, tx: string) => object
  welcomeTemplate: (message: string, ...options: string[]) => object
  confirmResultTemplate: (burnttx: string, firebaseTime: number, stellarTime: number) => object
  balanceInfoTemplate: (balanceInfo: any[]) => object
  providerName: string
}