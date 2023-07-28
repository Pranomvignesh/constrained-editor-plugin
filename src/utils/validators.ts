import * as monaco_editor_namespace from "monaco-editor";

/*
This file is the typescript version of the original src/utils/validators.js file from: https://github.com/Pranomvignesh/constrained-editor-plugin
*/

import { RestrictionArgs } from "../constrainedModel";
type StandAloneCodeEditor =
  monaco_editor_namespace.editor.IStandaloneCodeEditor;
type TextModel = monaco_editor_namespace.editor.ITextModel;

const validators = {
  initWith: function (monaco: typeof monaco_editor_namespace) {
    const dummyDiv = document.createElement('div');
    const dummyEditorInstance = monaco.editor.create(dummyDiv) as StandAloneCodeEditor;
    const editorInstanceConstructorName = dummyEditorInstance.constructor.name;
    const editorModelConstructor = dummyEditorInstance.getModel() as TextModel;
    const editorModelConstructorName = editorModelConstructor.constructor.name;
    const instanceCheck = function (valueToValidate: StandAloneCodeEditor) {
      return valueToValidate.constructor.name === editorInstanceConstructorName;
    }
    const modelCheck = function (valueToValidate: TextModel) {
      return valueToValidate.constructor.name === editorModelConstructorName;
    }
    // const rangesCheck = function (ranges: Restriction[]) {
    const rangesCheck = function (ranges: RestrictionArgs[]) {
      if (Array.isArray(ranges)) {
        return ranges.every(function (rangeObj) {
          if (typeof rangeObj === 'object' && rangeObj.constructor.name === 'Object') {
            if (!rangeObj.hasOwnProperty('range')) return false;
            if (!Array.isArray(rangeObj.range)) return false;
            if (rangeObj.range.length !== 4) return false;
            if (!(rangeObj.range.every(num => num > 0 && parseInt(num) === num))) return false;
            if (rangeObj.hasOwnProperty('allowMultiline')) {
              if (typeof rangeObj.allowMultiline !== 'boolean') return false;
            }
            if (rangeObj.hasOwnProperty('label')) {
              if (typeof rangeObj.label !== 'string') return false;
            }
            if (rangeObj.hasOwnProperty('validate')) {
              if (typeof rangeObj.validate !== 'function') return false;
            }
            return true;
          }
          return false;
        });
      }
      return false;
    }
    return {
      isInstanceValid: instanceCheck,
      isModelValid: modelCheck,
      isRangesValid: rangesCheck
    }
  }
}
export default validators;