export const validators = {
    initWith: function (monaco) {
        var dummyDiv = document.createElement('div');
        var dummyEditorInstance = monaco.editor.create(dummyDiv);
        var editorInstanceConstructorName = dummyEditorInstance.constructor.name;
        var editorModelConstructor = dummyEditorInstance.getModel();
        var editorModelConstructorName = editorModelConstructor.constructor.name;
        var instanceCheck = function (valueToValidate) {
            return valueToValidate.constructor.name === editorInstanceConstructorName;
        };
        var modelCheck = function (valueToValidate) {
            return valueToValidate.constructor.name === editorModelConstructorName;
        };
        // const rangesCheck = function (ranges: Restriction[]) {
        var rangesCheck = function (ranges) {
            if (Array.isArray(ranges)) {
                return ranges.every(function (rangeObj) {
                    if (typeof rangeObj === 'object' && rangeObj.constructor.name === 'Object') {
                        if (!rangeObj.hasOwnProperty('range'))
                            return false;
                        if (!Array.isArray(rangeObj.range))
                            return false;
                        if (rangeObj.range.length !== 4)
                            return false;
                        if (!(rangeObj.range.every(function (num) { return num > 0 && parseInt(num) === num; })))
                            return false;
                        if (rangeObj.hasOwnProperty('allowMultiline')) {
                            if (typeof rangeObj.allowMultiline !== 'boolean')
                                return false;
                        }
                        if (rangeObj.hasOwnProperty('label')) {
                            if (typeof rangeObj.label !== 'string')
                                return false;
                        }
                        if (rangeObj.hasOwnProperty('validate')) {
                            if (typeof rangeObj.validate !== 'function')
                                return false;
                        }
                        return true;
                    }
                    return false;
                });
            }
            return false;
        };
        return {
            isInstanceValid: instanceCheck,
            isModelValid: modelCheck,
            isRangesValid: rangesCheck
        };
    }
};
export default validators;
