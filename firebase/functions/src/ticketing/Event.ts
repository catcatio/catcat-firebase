import { Keypair, Asset } from 'stellar-sdk'

export class Event {
  _code: any
  _limit: any
  _startDate: any
  _endDate: any
  _title: any
  _description: any
  _coverImage: any
  _venue: any
  _host: any
  _email: any
  _uuid: any
  _url: any
  _subtitle: any
  _constriaint: any
  _issuer: any
  _distributor: any
  url: any
  subtitle: any

  constructor({
    code,
    limit,
    startDate,
    endDate,
    title,
    description,
    coverImage,
    venue,
    host,
    email,
    uuid,
    url,
    subtitle,
    constraint,
    issuer,
    distributor }) {

    this._code = code
    this._limit = limit

    this._startDate = startDate
    this._endDate = endDate
    this._title = title
    this._description = description
    this._coverImage = coverImage
    this._venue = venue
    this._host = host
    this._email = email
    this._uuid = uuid
    this._url = url
    this._subtitle = subtitle
    this._constriaint = constraint

    this._issuer = issuer
    this._distributor = distributor
  }

  get code() {
    return this._code
  }

  get limit() {
    return this._limit
  }

  get issuer() {
    return Keypair.fromPublicKey(this._issuer)
  }

  get distributor() {
    return Keypair.fromPublicKey(this._distributor)
  }

  get asset() {
    return new Asset(this.code, this.issuer.publicKey())
  }

  toJSON() {
    return {
      code: this._code,
      limit: this._limit,
      startDate: this._startDate,
      endDate: this._endDate,
      title: this._title,
      description: this._description,
      coverImage: this._coverImage,
      venue: this._venue,
      host: this._host,
      email: this._email,
      uuid: this._uuid,
      url: this.url,
      subtitle: this.subtitle,
      constraint: this._constriaint,

      issuer: this._issuer,
      distributor: this._distributor
    }
  }

  static fromJSON(event) {
    return new Event(event)
  }
}

module.exports = { Event }