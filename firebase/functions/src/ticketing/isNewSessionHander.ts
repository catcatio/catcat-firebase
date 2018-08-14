export default (sessionsRepository) => async ({ session, from }) => {
  if (!session || !from) {
    return false
  }

  const lastSession = await sessionsRepository.get(from)
  if (!lastSession || lastSession.session !== session) {
    await sessionsRepository.put(from, { session })
    return true
  }
  return false
}