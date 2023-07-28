
export const TypeMustBe = function (type, key, additional) {
    return 'The value for the ' + key + ' should be of type ' + (Array.isArray(type) ? type.join(' | ') : type) + '. ' + (additional || '');
};
export const definedErrors = {
    TypeMustBe: exports.TypeMustBe
};
export default definedErrors;
