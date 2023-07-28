/*
This file is the typescript version of the original src/utils/definedErrors.js file from: https://github.com/Pranomvignesh/constrained-editor-plugin
*/

export const TypeMustBe = function (type: Array<any> | string, key: string, additional: string) {
  return 'The value for the ' + key + ' should be of type ' + (Array.isArray(type) ? type.join(' | ') : type) + '. ' + (additional || '')
}
const definedErrors = {
  TypeMustBe : TypeMustBe
};
export default definedErrors;