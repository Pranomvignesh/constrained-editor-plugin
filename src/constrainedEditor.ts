import * as monaco_editor_namespace from "monaco-editor";

/*
This file is the typescript version of the original src/constrainedEditor.js file from: https://github.com/Pranomvignesh/constrained-editor-plugin
*/

import validators from "./utils/validators";
import { TypeMustBe } from "./utils/definedErrors";
import constrainedModel, { ConstrainedModel, RestrictionArgs } from "./constrainedModel";

type StandAloneCodeEditor =
  monaco_editor_namespace.editor.IStandaloneCodeEditor;
type TextModel = monaco_editor_namespace.editor.ITextModel;
type ExtendEditorInstance = StandAloneCodeEditor & {
  _isInDevMode: boolean;
  _devModeAction: monaco_editor_namespace.editor.IEditorContribution;
};

export type Manipulator = {
  _listener: typeof listenerFn;
  _editorInstance: ExtendEditorInstance;
  _uriRestrictionMap: {
    [uri: string]: TextModel;
  };
  _injectedResources: typeof monaco_editor_namespace;
  _onChangeModelDisposable?: monaco_editor_namespace.IDisposable;
};

export type ManipulatorAPI = Manipulator & {
  initializeIn: (editorInstance: StandAloneCodeEditor) => boolean;
  addRestrictionsTo: (model: TextModel, ranges: RestrictionArgs[]) => ConstrainedModel;
  removeRestrictionsIn: (model: TextModel) => any;
  disposeConstrainer: () => boolean;
  toggleDevMode: () => void;
};

export type ConstrainedMonaco = ManipulatorAPI;

/**
 *
 * @param {Object} editorInstance This should be the monaco editor instance.
 * @description This is the listener function to check whether the cursor is at checkpoints
 * (i.e) the point where editable and non editable portions meet
 */
const listenerFn = function (editorInstance: ExtendEditorInstance) {
  const model = editorInstance.getModel() as ConstrainedModel;
  if (model._isCursorAtCheckPoint) {
    const selections =
      editorInstance.getSelections() as monaco_editor_namespace.Selection[];
    const positions = selections.map(function (selection) {
      return {
        lineNumber: selection.positionLineNumber,
        column: selection.positionColumn,
      };
    });
    model._isCursorAtCheckPoint(positions);
    model._currentCursorPositions = selections;
  }
};

export function constrainedEditor(monaco: typeof monaco_editor_namespace) {
  /**
   * Injected Dependencies
   */
  if (monaco === undefined) {
    throw new Error(
      [
        "Please pass the monaco global variable into function as",
        "(eg:)constrainedEditor({ range : monaco.range });",
      ].join("\n")
    );
  }

  const _uriRestrictionMap: { [key: string]: ConstrainedModel } = {};
  const { isInstanceValid, isModelValid, isRangesValid } =
    validators.initWith(monaco);
  /**
   *
   * @param {Object} editorInstance This should be the monaco editor instance
   * @returns {Boolean}
   */
  const initInEditorInstance = function (editorInstance: StandAloneCodeEditor) {
    if (isInstanceValid(editorInstance)) {
      let domNode = editorInstance.getDomNode();
      manipulator._listener = listenerFn.bind(API, editorInstance as ExtendEditorInstance);
      manipulator._editorInstance = editorInstance as ExtendEditorInstance;
      manipulator._editorInstance._isInDevMode = false; //@ts-ignore
      domNode.addEventListener("keydown", manipulator._listener, true);
      manipulator._onChangeModelDisposable = editorInstance.onDidChangeModel(
        function () {
          // domNode - refers old dom node
          domNode && //@ts-ignore
            domNode.removeEventListener("keydown", manipulator._listener, true);
          const newDomNode = editorInstance.getDomNode(); // Gets Current dom node
          newDomNode && //@ts-ignore
            newDomNode.addEventListener("keydown", manipulator._listener, true);
          domNode = newDomNode;
        }
      );
      return true;
    } else {
      throw new Error(
        TypeMustBe(
          "ICodeEditor",
          "editorInstance",
          "This type interface can be found in monaco editor documentation"
        )
      );
    }
  };
  /**
   *
   * @param {Object} model This should be the monaco editor model instance. Refer https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.itextmodel.html
   * @param {*} ranges This should be the array of range objects. Refer constrained editor plugin documentation
   * @returns model
   */
  const addRestrictionsTo = function (
    model: TextModel,
    ranges: RestrictionArgs[],
  ): ConstrainedModel {
    if (isModelValid(model)) {
      if (isRangesValid(ranges)) {
        const modelToConstrain = constrainedModel(
          model as ConstrainedModel,
          ranges,
          monaco,
        );
        _uriRestrictionMap[modelToConstrain.uri.toString()] = modelToConstrain;
        return modelToConstrain;
      } else {
        throw new Error(
          TypeMustBe(
            "Array<RangeRestrictionObject>",
            "ranges",
            "Please refer constrained editor documentation for proper structure"
          )
        );
      }
    } else {
      throw new Error(
        TypeMustBe(
          "ICodeEditor",
          "editorInstance",
          "This type interface can be found in monaco editor documentation"
        )
      );
    }
  };
  /**
   *
   * @param {Object} model This should be the monaco editor model instance. Refer https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.itextmodel.html
   * @returns {Boolean} True if the restrictions are removed
   */
  const removeRestrictionsIn = function (model: TextModel) {
    if (isModelValid(model)) {
      const uri = model.uri.toString();
      const restrictedModel = _uriRestrictionMap[uri];
      if (restrictedModel) {
        return restrictedModel.disposeRestrictions();
      } else {
        console.warn("Current Model is not a restricted Model");
        return false;
      }
    } else {
      throw new Error(
        TypeMustBe(
          "ICodeEditor",
          "editorInstance",
          "This type interface can be found in monaco editor documentation"
        )
      );
    }
  };
  /**
   *
   * @returns {Boolean} True if the constrainer is disposed
   */
  const disposeConstrainer = function () {
    if (manipulator._editorInstance) {
      const instance = manipulator._editorInstance;
      const domNode = instance.getDomNode(); //@ts-ignore
      domNode && domNode.removeEventListener("keydown", manipulator._listener);
      manipulator._onChangeModelDisposable &&
        manipulator._onChangeModelDisposable.dispose(); //@ts-ignore
      delete manipulator._listener; //@ts-ignore
      delete manipulator._editorInstance._isInDevMode; //@ts-ignore
      delete manipulator._editorInstance._devModeAction; //@ts-ignore
      delete manipulator._editorInstance;
      delete manipulator._onChangeModelDisposable;
      for (let key in _uriRestrictionMap) {
        delete _uriRestrictionMap[key];
      }
      return true;
    }
    return false;
  };
  /**
   * @description This function used to make the developer to find the ranges of selected portions
   */
  const toggleDevMode = function () {
    if (manipulator._editorInstance._isInDevMode) {
      manipulator._editorInstance._isInDevMode = false;
      manipulator._editorInstance._devModeAction.dispose(); //@ts-ignore
      delete manipulator._editorInstance._devModeAction;
    } else {
      manipulator._editorInstance._isInDevMode = true;
      manipulator._editorInstance._devModeAction =
        manipulator._editorInstance.addAction({
          id: "showRange",
          label: "Show Range in console",
          contextMenuGroupId: "navigation",
          contextMenuOrder: 1.5,
          run: function (editor: StandAloneCodeEditor) {
            const selections =
              editor.getSelections() as monaco_editor_namespace.Selection[];
            const ranges = selections
              .reduce(function (
                acc: string[],
                { startLineNumber, endLineNumber, startColumn, endColumn }
              ) {
                acc.push(
                  "range : " +
                    JSON.stringify([
                      startLineNumber,
                      startColumn,
                      endLineNumber,
                      endColumn,
                    ])
                );
                return acc;
              },
              [])
              .join("\n");
            console.log(
              `Selected Ranges : \n` + JSON.stringify(ranges, null, 2)
            );
          },
        });
    }
  };
  /**
   * Main Function starts here
   */
  // @internal
  //@ts-ignore
  const manipulator = {
    /**
     * These variables should not be modified by external code
     * This has to be used for debugging and testing
     */
    //@ts-ignore
    _listener: null,
    _editorInstance: null,
    _uriRestrictionMap: _uriRestrictionMap,
    _injectedResources: monaco,
  } as Manipulator;

  const API: ConstrainedMonaco = Object.create(manipulator);
  const exposedMethods = {
    /**
     * These functions are exposed to the user
     * These functions should be protected from editing
     */
    initializeIn: initInEditorInstance,
    addRestrictionsTo: addRestrictionsTo,
    removeRestrictionsIn: removeRestrictionsIn,
    disposeConstrainer: disposeConstrainer,
    toggleDevMode: toggleDevMode,
  };
  for (let methodName in exposedMethods) {
    Object.defineProperty(API, methodName, {
      enumerable: false,
      writable: false,
      configurable: false,
      value: exposedMethods[methodName as keyof typeof exposedMethods],
    });
  }
  return Object.freeze(API);
}

export default constrainedEditor;
