export interface IMessageFormatter {
  listEvents: (events: any[], bookedEvent: any[], languageCode: string) => object
  ticketTemplate: (event: any, ticketUrl: string) => object
  confirmTemplate: (pictureUrl: string, displayName: string, ownerProvider: string, eventTitle: string, tx: string) => object
  welcomeTemplate: (message: string, ...options: string[]) => object
  confirmResultTemplate: (burnttx: string, firebaseTime: number, stellarTime: number) => object
  balanceInfoTemplate: (balanceInfo: any[], languageCode: string) => object
  inviteTemplate: (eventId: string, userId: string, eventTitle: string, ticketRemaing: number, languageCode: string) => object
  providerName: string,
}