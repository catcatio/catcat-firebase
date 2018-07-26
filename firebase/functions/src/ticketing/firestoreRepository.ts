const firestoreRepoFactory = (firestore, collectionName) => {
  const db = firestore
  const collection = db.collection(collectionName)

  const put = (key, value) => {
    return collection.doc(key).set(value)
  }

  const get = (key) => {
    const startTime = Date.now()
    return collection.doc(key).get()
      .then(doc => {
        console.log(`firebase get: ${Date.now() - startTime}`)
        if (!doc.exists) {
          return null
        } else {
          return doc.data()
        }
      })
  }

  const update = (key, value) => {
    return collection.doc(key).update(value)
  }

  const has = (key) => {
    return get(key).then(data => {
      return !data
    })
  }

  const del = (key) => {
    return collection.doc(key).delete()
  }

  const keys = () => {
    return collection.select().get().then(x => x.docs.map(d => d.id))
  }

  const all = () => {
    return collection.get().then(x => x.docs.map(d => d.data())).catch(err => console.log(err))
  }

  const query = async (field, value) => {
    return collection.where(field, '==', value).get()
      .then(sanpshot => {
        return sanpshot.docs.map(doc => doc.data())
      })
      .catch(err => {
        console.log('Error getting documents', err)
        return null
      })
  }

  const close = () => {
    // do nothing
  }

  return {
    put,
    get,
    update,
    del,
    close,
    has,
    keys,
    query,
    all
  }
}

export default firestoreRepoFactory