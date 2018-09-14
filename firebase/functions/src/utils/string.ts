export const replaceAll = (target, search, replacement) => {
  return target.replace(new RegExp(search, 'g'), replacement)
}
