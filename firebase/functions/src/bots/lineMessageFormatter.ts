import { IMessageFormatter } from './messageFormatter'
import { FlexMessageBuilder, FlexComponentBuilder } from '../messaging/lineMessageBuilder'

const recommendTemplate = (botId: string, languageCode: string): object => {
  const lineTemplate = new FlexMessageBuilder()
  const template = lineTemplate.flexMessage(languageCode === 'th' ? 'แนะนำเพื่อน' : 'Recommend')
    .addBubble()
    .addHeader()
    .addComponents(
      FlexComponentBuilder.flexBox()
        .setLayout('horizontal')
        .addContents(FlexComponentBuilder.flexText()
          .setText(languageCode === 'th' ? 'แนะนำเพื่อน' : 'Recommend')
          .setWeight('bold')
          .setSize('sm')
          .build())
        .build()
    )
    .addBody()
    .setStyleBackgroundColor('#EFEFEF')
    .setStyleSeparator(true)
    .setStyleSeparatorColor('#DDDDDD')
    .setLayout('vertical')
    .setSpacing('md')
    .addComponents(
      FlexComponentBuilder.flexText()
        .setText(languageCode === 'th' ? 'ถ้าอยากแนะนำ CatCat ให้เพื่อนๆ ก็กดปุ่ม "แนะนำ" ด้านล่างไปได้เลยจ้า' : 'To let others know about CatCat, just press \"Share\" button below!')
        .setWrap(true)
        .setSize('sm')
        .build()
    )
    .addFooter()
    .setStyleSeparator(true)
    .setStyleSeparatorColor('#DDDDDD')
    .setLayout('vertical')
    .setSpacing('md')
    .addComponents(
      FlexComponentBuilder.flexButton()
        .setStyle('secondary')
        .setColor('#b0bec5')
        .setAction({
          'type': 'uri',
          'label': languageCode === 'th' ? 'แนะนำ' : 'Recommend',
          'uri': `line://nv/recommendOA/${botId}`
        })
        .build(),
    )

  return template.build()
}

export default (): IMessageFormatter => {
  return {
    providerName: 'line',
    recommendTemplate
  }
}

