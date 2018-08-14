import { FlexMessage, FlexImage, FlexBubble, FlexCarousel, FlexComponent, FlexBox, Action } from '@line/bot-sdk'

export class FlexMessageBuilder {
  private _templateType: 'bubble' | 'carousel'
  private _currentBubble: FlexBubble
  private _flexMessage: FlexMessage
  private _currentFlexBox: FlexBox
  private _currentFlexComponents: FlexComponent[]
  private _currentFlexComponent: FlexComponent

  public flexMessage(altText: string): FlexMessageBuilder {
    this._flexMessage = {
      type: 'flex',
      altText,
      contents: null
    }
    return this
  }

  public addCarousel(): FlexMessageBuilder {
    this._templateType = 'carousel'

    this._flexMessage.contents = {
      type: 'carousel',
      contents: []
    }
    return this
  }

  public addBubble(): FlexMessageBuilder {
    this._currentBubble = {
      type: 'bubble'
    }
    if (this._templateType === 'carousel') {
      (this._flexMessage.contents as FlexCarousel).contents.push(this._currentBubble)
    } else {
      this._templateType = 'bubble'
      this._flexMessage.contents = this._currentBubble
    }
    return this
  }

  public addHeader(): FlexMessageBuilder {
    this._currentFlexComponents = []
    this._currentFlexBox = {
      type: 'box',
      layout: 'vertical',
      contents: this._currentFlexComponents
    }

    this._currentBubble.header = this._currentFlexBox
    return this
  }

  public addHero(flexImage: FlexImage): FlexMessageBuilder {
    this._currentBubble.hero = flexImage
    return this
  }

  public addBody(): FlexMessageBuilder {
    this._currentFlexComponents = []
    this._currentFlexBox = {
      type: 'box',
      layout: 'vertical',
      contents: this._currentFlexComponents
    }

    this._currentBubble.body = this._currentFlexBox
    return this
  }

  public addFooter(): FlexMessageBuilder {
    this._currentFlexComponents = []
    this._currentFlexBox = {
      type: 'box',
      layout: 'vertical',
      contents: this._currentFlexComponents
    }

    this._currentBubble.footer = this._currentFlexBox
    return this
  }

  public addComponents(...components: FlexComponent[]): FlexMessageBuilder {
    this._currentFlexComponent = components[components.length - 1]
    this._currentFlexComponents.push(...components)
    return this
  }

  public setLayout(layout: 'horizontal' | 'vertical' | 'baseline'): FlexMessageBuilder {
    this._currentFlexBox.layout = layout
    return this
  }

  public setSpacing(spacing: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'): FlexMessageBuilder {
    this._currentFlexBox.spacing = spacing
    return this
  }

  public setMargin(margin: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'): FlexMessageBuilder {
    this._currentFlexBox.margin = margin
    return this
  }

  public setActon(action: Action<{ label: string }>): FlexMessageBuilder {
    this._currentFlexBox.action = action
    return this
  }

  public setFlex(flex: number): FlexMessageBuilder {
    this._currentFlexBox.flex = flex
    return this
  }

  public build(): FlexMessage {
    return this._flexMessage
  }
}

export class FlexComponentBuilder {
  private _flexComponent: FlexComponent

  private constructor(type: 'box' | 'button' | 'filler' | 'icon' | 'image' | 'separator' | 'spacer' | 'text') {
    this._flexComponent = {
      type
    } as FlexComponent

    return this
  }

  public setLayout(layout?: 'horizontal' | 'vertical' | 'baseline'): FlexComponentBuilder {
    this._flexComponent['layout'] = layout

    return this
  }

  public setFlex(flex?: number): FlexComponentBuilder {
    this._flexComponent['flex'] = flex

    return this
  }

  public setSpacing(spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'): FlexComponentBuilder {
    this._flexComponent['spacing'] = spacing

    return this
  }

  public setMargin(margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'): FlexComponentBuilder {
    this._flexComponent['margin'] = margin

    return this
  }

  public setAction(action?: Action): FlexComponentBuilder {
    this._flexComponent['action'] = action

    return this
  }

  public setHeight(height?: 'sm' | 'md'): FlexComponentBuilder {
    this._flexComponent['height'] = height

    return this
  }

  public setStyle(style?: 'link' | 'primary' | 'secondary'): FlexComponentBuilder {
    this._flexComponent['style'] = style

    return this
  }

  public setColor(color?: string): FlexComponentBuilder {
    this._flexComponent['color'] = color

    return this
  }

  public setGravity(gravity?: 'top' | 'bottom' | 'center'): FlexComponentBuilder {
    this._flexComponent['gravity'] = gravity

    return this
  }

  public setSize(size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | '3xl' | '4xl' | '5xl' | 'full'): FlexComponentBuilder {
    this._flexComponent['size'] = size

    return this
  }

  public setUrl(url: string): FlexComponentBuilder {
    this._flexComponent['url'] = url

    return this
  }

  public setAspectRatio(aspectRatio: '1:1' | '1.51:1' | '1.91:1' | '4:3' | '16:9' | '20:13' | '2:1' | '3:1' | '3:4' | '9:16' | '1:2' | '1:3'): FlexComponentBuilder {
    this._flexComponent['aspectRatio'] = aspectRatio

    return this
  }

  public setAlign(align?: 'start' | 'end' | 'center'): FlexComponentBuilder {
    this._flexComponent['align'] = align

    return this
  }

  public setAspectMode(aspectMode?: 'cover' | 'fit'): FlexComponentBuilder {
    this._flexComponent['aspectMode'] = aspectMode

    return this
  }

  public setBackgroundColor(backgroundColor?: string): FlexComponentBuilder {
    this._flexComponent['backgroundColor'] = backgroundColor

    return this
  }

  public setWrap(wrap?: boolean): FlexComponentBuilder {
    this._flexComponent['wrap'] = wrap

    return this
  }

  public setMaxLines(maxLines?: number): FlexComponentBuilder {
    this._flexComponent['maxLines'] = maxLines

    return this
  }

  public setWeight(weight?: 'regular' | 'bold'): FlexComponentBuilder {
    this._flexComponent['weight'] = weight

    return this
  }

  public setGarvity(gravity?: 'top' | 'bottom' | 'center'): FlexComponentBuilder {
    this._flexComponent['gravity'] = gravity

    return this
  }

  public setText(text?: string): FlexComponentBuilder {
    this._flexComponent['text'] = text

    return this
  }

  public addContents(...flexComponents: FlexComponent[]): FlexComponentBuilder {
    if (!this._flexComponent['contents']) {
      this._flexComponent['contents'] = []
    }

    this._flexComponent['contents'].push(...flexComponents)

    return this
  }

  public build(): FlexComponent {
    return this._flexComponent
  }

  public static flexBox() {
    return new FlexComponentBuilder('box')
  }

  public static flexButton() {
    return new FlexComponentBuilder('button')
  }

  public static flexFiller() {
    return new FlexComponentBuilder('filler')
  }

  public static flexIcon() {
    return new FlexComponentBuilder('icon')
  }

  public static flexImage() {
    return new FlexComponentBuilder('image')
  }

  public static flexSeparator() {
    return new FlexComponentBuilder('separator')
  }

  public static flexSpacer() {
    return new FlexComponentBuilder('spacer')
  }
  public static flexText() {
    return new FlexComponentBuilder('text')
  }
}
