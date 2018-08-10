const { Keypair } = require('stellar-sdk')

class User {
  _userId: any
  account_id: any
  _uuid: string
  _preInit: string
  constructor({user_id, account_id, uuid = '', preInit = ''}) {
    this._userId = user_id
    this.account_id = account_id
    this._uuid = uuid
    this._preInit = preInit
  }

  get keypair() {
    return Keypair.fromPublicKey(this.account_id)
  }

  get uuid() {
    return this._uuid
  }

  get userId() {
    return this._userId
  }

  get preInit() {
    return this._preInit
  }

  set preInit(value) {
    this._preInit = value
  }

  toJSON() {
    return {
      user_id: this._userId,
      account_id: this.account_id,
      uuid: this._uuid,
      preInit: this._preInit
    }
  }

  static fromJSON(user) {
    return new User(user)
  }
}

export { User }
