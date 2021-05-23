export const deepFreezer = function (value) {
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      value.forEach(deepFreezer)
    } else {
      for (let key in value) {
        deepFreezer(value[key]);
      }
    }
  }
  return Object.freeze(value);
}

export default deepFreezer;