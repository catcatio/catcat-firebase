export interface IMessagingClient {
  sendImage,
  sendMessage,
  sendCustomMessages,
  getProfile,
  providerName: string
}