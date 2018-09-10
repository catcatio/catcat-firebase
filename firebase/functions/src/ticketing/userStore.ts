import { firestore } from 'firebase-admin'

const userStoreFactory = (userRepository, tmpUserRepository, providersRepository) => {
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

    const providerInfo = {
      id: `${provider.toLowerCase()}_${id}`,
      userId: newUser.id
    }
    // fire and forgot
    providersRepository.put(providerInfo.id, providerInfo)

    return newUser
  }

  const addMemo = async (userId, memo) => {
    return userRepository.update(userId, { memo })
  }

  const markAsUsed = async (userId) => {
    return userRepository.update(userId, { used: true })
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

  const updateUserEmail = async (userId, email) => {
    await userRepository.update(userId, {
      ['providers.email']: email
    })
  }

  return {
    getUserById,
    getByRequstSource,
    addMemo,
    markAsUsed,
    createUserFromTemp,
    updateBoughtTicket,
    updateBurntTicket,
    updateUserEmail
  }
}

export default userStoreFactory