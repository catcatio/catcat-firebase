
import { User } from './User'
import { firestore } from 'firebase-admin'

const randNum = (min = 100, max = 1000) => {
  return Math.floor(Math.random() * (max - min) + min)
}

const userStoreFactory = (userRepository, tmpUserRepository) => {
  let stellarUserCreator = null

  const setUserCreator = (userCreator) => {
    stellarUserCreator = userCreator
  }

  const getOrCreate = async (userId, preInit = '') => {
    let user = await userRepository.get(userId)
    if (user) {
      return User.fromJSON(user)
    }

    return stellarUserCreator()
      .then(async stellarUser => {
        user = {
          user_id: userId,
          account_id: stellarUser.publicKey,
          uuid: `${Date.now()}${randNum()}`,
          preInit: preInit
        }

        await userRepository.put(userId, user)
        return User.fromJSON(user)
      })
  }

  const get = async (userId) => {
    const user = await userRepository.get(userId)
    return user ? User.fromJSON(user) : null
  }

  const getByUuid = async (uuid) => {
    const users = await userRepository.query('uuid', uuid)
    return users && users.length > 0 ? User.fromJSON(users[0]) : null
  }

  const getUserById = async (userId) => {
    return await userRepository.get(userId)
  }

  const getByRequstSource = async (provider, id) => {
    const lowerProvider = provider.toLowerCase()
    const ret = await userRepository.query(`providers.${lowerProvider}`, id)

    return ret.length > 0 ? ret[0] : null
  }

  const createUserFromTemp = async (provider, id, masterAsset) => {
    console.log('createUserFromTemp')
    const lowerProvider = provider.toLowerCase()
    const ret = await tmpUserRepository.collection.limit(1).get()
      .then(x => x.docs.map(d => d.data()))

    const tmpUser = ret.length > 0 ? ret[0] : null

    if (!tmpUser) return null

    const newUser = Object.assign({
      providers: {
        [lowerProvider]: id
      },
      chains: {
        [masterAsset.getCode()]: `${masterAsset.getIssuer()}`
      },
      bought_tickets: {},
      burnt_tickets: {},
      kept_tickets: {}
    }, tmpUser)

    await userRepository.put(newUser.id, newUser)
      .then(() => tmpUserRepository.collection.doc(tmpUser.id).delete())

    return newUser
  }

  const addMemo = async (userId, memo) => {
    return userRepository.update(userId, {memo})
  }

  const markAsUsed = async (userId) => {
    return userRepository.update(userId, {used: true})
  }

  const updateBoughtTicket = async (userId, event_id, ticket_id) => {
    await userRepository.update(userId, {
      [`bought_tickets.${event_id}.${ticket_id}`]: true
    })
  }

  const updateBurntTicket = async (owner_id, event_id, ticket_id) => {
    await userRepository.update(owner_id, {
      [`bought_tickets.${event_id}.${ticket_id}`]: firestore.FieldValue.delete(),
      [`burnt_tickets.${event_id}.${ticket_id}`]: true
    })
  }


  return {
    setUserCreator,
    getOrCreate,
    get,
    getUserById,
    getByUuid,
    getByRequstSource,
    addMemo,
    markAsUsed,
    createUserFromTemp,
    updateBoughtTicket,
    updateBurntTicket
  }
}

export default userStoreFactory