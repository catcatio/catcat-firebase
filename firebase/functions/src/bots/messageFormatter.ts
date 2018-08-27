export interface IMessageFormatter {
  recommendTemplate: (botId: string, languageCode: string) => object
  providerName: string
}