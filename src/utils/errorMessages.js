export const MISSING_KEY = function (key, object) {
  object = typeof object === 'string' ? object : JSON.stringify(object, null, 4)
  return key + " is a required key in the object.\nStringified Object for reference :\n" + object
}
export const TYPE_MUST_BE = function (type, key, additional) {
  return 'The value for the ' + key + ' should be of type ' + (Array.isArray(type) ? type.join(' | ') : type) + '. ' + (additional || '')
}
export const INVALID_VALUE = function (key, object) {
  return 'Value for ' + key + ' is invalid, Source object : ' + JSON.stringify(object, null, 2)
}
export const VALUE_EXISTS = function (type, object) {
  return type + ' already exists' + (object && ' in ' + object) + '. Please try another name'
}
const errorMessages = {
  MISSING_KEY,
  TYPE_MUST_BE,
  INVALID_VALUE,
  VALUE_EXISTS
};
export default errorMessages;