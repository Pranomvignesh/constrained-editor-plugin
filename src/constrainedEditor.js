"use strict";
/*
This file is the typescript version of the original src/constrainedEditor.js file from: https://github.com/Pranomvignesh/constrained-editor-plugin
*/
var validators_1 = require("./utils/validators");
var definedErrors_1 = require("./utils/definedErrors");
var constrainedModel_1 = require("./constrainedModel");
/**
 *
 * @param {Object} editorInstance This should be the monaco editor instance.
 * @description This is the listener function to check whether the cursor is at checkpoints
 * (i.e) the point where editable and non editable portions meet
 */
var listenerFn = function (editorInstance) {
    var model = editorInstance.getModel();
    if (model._isCursorAtCheckPoint) {
        var selections = editorInstance.getSelections();
        var positions = selections.map(function (selection) {
            return {
                lineNumber: selection.positionLineNumber,
                column: selection.positionColumn,
            };
        });
        model._isCursorAtCheckPoint(positions);
        model._currentCursorPositions = selections;
    }
};
export function constrainedEditor(monaco) {
    /**
     * Injected Dependencies
     */
    if (monaco === undefined) {
        throw new Error([
            "Please pass the monaco global variable into function as",
            "(eg:)constrainedEditor({ range : monaco.range });",
        ].join("\n"));
    }
    var _uriRestrictionMap = {};
    var _a = validators_1.default.initWith(monaco), isInstanceValid = _a.isInstanceValid, isModelValid = _a.isModelValid, isRangesValid = _a.isRangesValid;
    /**
     *
     * @param {Object} editorInstance This should be the monaco editor instance
     * @returns {Boolean}
     */
    var initInEditorInstance = function (editorInstance) {
        if (isInstanceValid(editorInstance)) {
            var domNode_1 = editorInstance.getDomNode();
            manipulator._listener = listenerFn.bind(API, editorInstance);
            manipulator._editorInstance = editorInstance;
            manipulator._editorInstance._isInDevMode = false; //@ts-ignore
            domNode_1.addEventListener("keydown", manipulator._listener, true);
            manipulator._onChangeModelDisposable = editorInstance.onDidChangeModel(function () {
                // domNode - refers old dom node
                domNode_1 && //@ts-ignore
                    domNode_1.removeEventListener("keydown", manipulator._listener, true);
                var newDomNode = editorInstance.getDomNode(); // Gets Current dom node
                newDomNode && //@ts-ignore
                    newDomNode.addEventListener("keydown", manipulator._listener, true);
                domNode_1 = newDomNode;
            });
            return true;
        }
        else {
            throw new Error((0, definedErrors_1.TypeMustBe)("ICodeEditor", "editorInstance", "This type interface can be found in monaco editor documentation"));
        }
    };
    /**
     *
     * @param {Object} model This should be the monaco editor model instance. Refer https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.itextmodel.html
     * @param {*} ranges This should be the array of range objects. Refer constrained editor plugin documentation
     * @returns model
     */
    var addRestrictionsTo = function (model, ranges) {
        if (isModelValid(model)) {
            if (isRangesValid(ranges)) {
                var modelToConstrain = (0, constrainedModel_1.default)(model, ranges, monaco);
                _uriRestrictionMap[modelToConstrain.uri.toString()] = modelToConstrain;
                return modelToConstrain;
            }
            else {
                throw new Error((0, definedErrors_1.TypeMustBe)("Array<RangeRestrictionObject>", "ranges", "Please refer constrained editor documentation for proper structure"));
            }
        }
        else {
            throw new Error((0, definedErrors_1.TypeMustBe)("ICodeEditor", "editorInstance", "This type interface can be found in monaco editor documentation"));
        }
    };
    /**
     *
     * @param {Object} model This should be the monaco editor model instance. Refer https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.itextmodel.html
     * @returns {Boolean} True if the restrictions are removed
     */
    var removeRestrictionsIn = function (model) {
        if (isModelValid(model)) {
            var uri = model.uri.toString();
            var restrictedModel = _uriRestrictionMap[uri];
            if (restrictedModel) {
                return restrictedModel.disposeRestrictions();
            }
            else {
                console.warn("Current Model is not a restricted Model");
                return false;
            }
        }
        else {
            throw new Error((0, definedErrors_1.TypeMustBe)("ICodeEditor", "editorInstance", "This type interface can be found in monaco editor documentation"));
        }
    };
    /**
     *
     * @returns {Boolean} True if the constrainer is disposed
     */
    var disposeConstrainer = function () {
        if (manipulator._editorInstance) {
            var instance = manipulator._editorInstance;
            var domNode = instance.getDomNode(); //@ts-ignore
            domNode && domNode.removeEventListener("keydown", manipulator._listener);
            manipulator._onChangeModelDisposable &&
                manipulator._onChangeModelDisposable.dispose(); //@ts-ignore
            delete manipulator._listener; //@ts-ignore
            delete manipulator._editorInstance._isInDevMode; //@ts-ignore
            delete manipulator._editorInstance._devModeAction; //@ts-ignore
            delete manipulator._editorInstance;
            delete manipulator._onChangeModelDisposable;
            for (var key in _uriRestrictionMap) {
                delete _uriRestrictionMap[key];
            }
            return true;
        }
        return false;
    };
    /**
     * @description This function used to make the developer to find the ranges of selected portions
     */
    var toggleDevMode = function () {
        if (manipulator._editorInstance._isInDevMode) {
            manipulator._editorInstance._isInDevMode = false;
            manipulator._editorInstance._devModeAction.dispose(); //@ts-ignore
            delete manipulator._editorInstance._devModeAction;
        }
        else {
            manipulator._editorInstance._isInDevMode = true;
            manipulator._editorInstance._devModeAction =
                manipulator._editorInstance.addAction({
                    id: "showRange",
                    label: "Show Range in console",
                    contextMenuGroupId: "navigation",
                    contextMenuOrder: 1.5,
                    run: function (editor) {
                        var selections = editor.getSelections();
                        var ranges = selections
                            .reduce(function (acc, _a) {
                            var startLineNumber = _a.startLineNumber, endLineNumber = _a.endLineNumber, startColumn = _a.startColumn, endColumn = _a.endColumn;
                            acc.push("range : " +
                                JSON.stringify([
                                    startLineNumber,
                                    startColumn,
                                    endLineNumber,
                                    endColumn,
                                ]));
                            return acc;
                        }, [])
                            .join("\n");
                        console.log("Selected Ranges : \n" + JSON.stringify(ranges, null, 2));
                    },
                });
        }
    };
    /**
     * Main Function starts here
     */
    // @internal
    //@ts-ignore
    var manipulator = {
        /**
         * These variables should not be modified by external code
         * This has to be used for debugging and testing
         */
        //@ts-ignore
        _listener: null,
        _editorInstance: null,
        _uriRestrictionMap: _uriRestrictionMap,
        _injectedResources: monaco,
    };
    var API = Object.create(manipulator);
    var exposedMethods = {
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
    for (var methodName in exposedMethods) {
        Object.defineProperty(API, methodName, {
            enumerable: false,
            writable: false,
            configurable: false,
            value: exposedMethods[methodName],
        });
    }
    return Object.freeze(API);
}
export default constrainedEditor;
