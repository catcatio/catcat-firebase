export default (sessionsRepository) => async ({ session, from }) => {
  if (!session || !from) {
    return false
  }

  const expiredTime = 86400000 // 24 hrs
  const lastSession = await sessionsRepository.get(from)
  const isNew = !lastSession || !lastSession.lastAccess || ((Date.now() - lastSession.lastAccess) > expiredTime)
  sessionsRepository.put(from, { session, lastAccess: Date.now() })
  return isNew
}