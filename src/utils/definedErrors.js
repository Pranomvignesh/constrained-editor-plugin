"use strict";
/*
This file is the typescript version of the original src/utils/definedErrors.js file from: https://github.com/Pranomvignesh/constrained-editor-plugin
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeMustBe = void 0;
var TypeMustBe = function (type, key, additional) {
    return 'The value for the ' + key + ' should be of type ' + (Array.isArray(type) ? type.join(' | ') : type) + '. ' + (additional || '');
};
exports.TypeMustBe = TypeMustBe;
var definedErrors = {
    TypeMustBe: exports.TypeMustBe
};
exports.default = definedErrors;
