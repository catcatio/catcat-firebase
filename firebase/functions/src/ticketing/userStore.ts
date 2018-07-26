
import { User } from './User'

const randNum = (min = 100, max = 1000) => {
  return Math.floor(Math.random() * (max - min) + min)
}

const userStoreFactory = (userRepository) => {
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

  const getByPreInit = async (preInit) => {
    const users = await userRepository.query('preInit', preInit)
    return users && users.length > 0 ? User.fromJSON(users[0]) : null
  }

  const clearPreInit = async (userId) => {
    return userRepository.update(userId, {preInit: ''})
  }

  const addMemo = async (userId, memo) => {
    return userRepository.update(userId, {memo})
  }


  const markAsUsed = async (userId) => {
    return userRepository.update(userId, {used: true})
  }


  return {
    setUserCreator,
    getOrCreate,
    get,
    getByUuid,
    getByPreInit,
    clearPreInit,
    addMemo,
    markAsUsed
  }
}

export default userStoreFactory