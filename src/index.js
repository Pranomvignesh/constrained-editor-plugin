import checkType from './utils/checkType.js';
import { TYPE_MUST_BE } from "./utils/errorMessages.js";
import restrictEditArea from "./utils/restrictEditArea.js";
export default function restrictedEditor (_injectedConstructors) {
  /**
   * Custom Type Declarations 
   */
  const type = checkType();
  type.$extend.number('positiveNumber', {
    positive: true
  })
  type.$extend.array('rangeArray', {
    size: 4,
    every: type.positiveNumber
  })
  type.$extend.object('editableRange', {
    required: {
      range: type.rangeArray
    },
    allowable: {
      allowMultiline: type.boolean
    }
  })
  type.$extend.array('editableRanges', {
    every: type.editableRange
  })
  type.$extend.object('requiredConstructors', {
    required: {
      range: type.function
    }
  })

  /**
   * Validation For Constructors
   */
  if (!type.requiredConstructors(_injectedConstructors)) {
    throw new Error(`
    monaco.range is required for creating a instance of restrictedEditor.
    Please pass the constructor of monaco.range
    (eg:)
      restrictedEditor({ range : monaco.range });
    `);
  }

  /**
   * API Validator Functions
   */
  const isModelValid = function (model, callback) {
    if (!type.object(model)) {
      throw new Error(
        TYPE_MUST_BE(
          'ITextModel',
          'model',
          'The type interface can be found in monaco-editor api documentation'
        )
      );
    }
    return callback(model);
  }
  const isInstanceValid = function (instance, callback) {
    if (
      !type.object(instance) ||
      !type.function(instance.getDomNode)
    ) {
      throw new Error(
        TYPE_MUST_BE(
          'ICodeEditor',
          'editorInstance',
          'The type interface can be found in monaco-editor api documentation'
        )
      );
    }
    return callback(instance);
  }

  /**
   * List of Handlers for the API 
   */
  const _uriRestrictionMap = {};
  const listenerFn = function (instance) {
    const model = instance.getModel();
    if (model._isCursorAtCheckPoint) {
      const selections = instance.getSelections();
      const positions = selections.map(function (selection) {
        return {
          lineNumber: selection.positionLineNumber,
          column: selection.positionColumn
        }
      });
      model._isCursorAtCheckPoint(positions);
      model._currentCursorPositions = selections;
    }
  }
  const init = function (editorInstance) {
    return isInstanceValid(editorInstance, function (instance) {
      const domNode = instance.getDomNode();
      manipulator._listener = listenerFn.bind(API, instance);
      manipulator._editorInstance = editorInstance;
      domNode.addEventListener('keydown', manipulator._listener, true);
      return true;
    });
  }
  const addRestrictions = function (model, ranges) {
    return isModelValid(model, function (model) {
      if (type.editableRanges(ranges)) {
        const restrictedModel = restrictEditArea(model, ranges, _injectedConstructors.range,manipulator._editorInstance);
        _uriRestrictionMap[restrictedModel.uri.toString()] = restrictedModel;
        return restrictedModel;
      } else {
        throw new Error('Ranges Object is Invalid. Please Refer the documentation');
      }
    })
  }
  const destroyInstance = function (editorInstance) {
    return isInstanceValid(editorInstance, function (instance) {
      const domNode = instance.getDomNode();
      domNode.removeEventListener('keydown', manipulator._listener);
      delete manipulator._listener;
      return true;
    });
  }
  const removeRestrictions = function (model) {
    return isModelValid(model, function (model) {
      const uri = model.uri.toString();
      const restrictedModel = _uriRestrictionMap[uri];
      if (restrictedModel) {
        restrictedModel.disposeRestrictions();
      } else {
        console.warn('Current Model is not a restricted Model');
      }
    })
  }
  const updateHighlight = function () {
    const instance = manipulator._editorInstance;
    const model = instance.getModel();
    const restrictedModel = _uriRestrictionMap[model.uri.toString()];
    if(restrictedModel){
      restrictedModel.updateHighlight();
    }
  }

  /**
   * Initialization Code
   */
  const manipulator = {
    /**
     * Internal variables
     * ! These values should not be used
     */
    _listener: null,
    _editorInstance : null,
    _uriRestrictionMap,
    _injectedConstructors
  };
  const API = Object.create(manipulator);
  const methods = {
    /**
     * List of Exposed APIs
     */
    initializeIn: init,
    addRestrictionsTo: addRestrictions,
    removeRestrictionsIn: removeRestrictions,
    destroyInstanceFrom: destroyInstance,
    updateHighlight: updateHighlight
  }
  for (let key in methods) {
    /**
     * Preventing the manipulation of the API
     */
    Object.defineProperty(API, key, {
      value: methods[key],
      writable: false,
      configurable: false,
      enumerable: false
    })
  }
  return Object.freeze(API);
};