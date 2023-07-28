"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constrainedModel = void 0;
/*
This file is the typescript version of the original src/constrainedModel.js file from: https://github.com/Pranomvignesh/constrained-editor-plugin
*/
var deepClone_js_1 = require("./utils/deepClone.js");
var enums_js_1 = require("./utils/enums.js");
var toggleHighlightOfEditableAreas = function (cssClasses, restrictions, model) {
    if (!model._hasHighlight) {
        var cssClassForSingleLine_1 = cssClasses.cssClassForSingleLine || enums_js_1.default.SINGLE_LINE_HIGHLIGHT_CLASS;
        var cssClassForMultiLine_1 = cssClasses.cssClassForMultiLine || enums_js_1.default.MULTI_LINE_HIGHLIGHT_CLASS;
        var decorations = restrictions.map(function (restriction) {
            var decoration = {
                id: "",
                range: restriction.range,
                options: {
                    className: restriction.allowMultiline
                        ? cssClassForMultiLine_1
                        : cssClassForSingleLine_1,
                },
            };
            if (restriction.label) {
                decoration.hoverMessage = restriction.label;
            }
            return decoration;
        });
        model._oldDecorations = model.deltaDecorations([], decorations);
        model._oldDecorationsSource = decorations.map(function (decoration, index) {
            return Object.assign({}, decoration, {
                id: model._oldDecorations[index],
            });
        });
        model._hasHighlight = true;
    }
    else {
        model.deltaDecorations(model._oldDecorations, []); //@ts-ignore
        delete model._oldDecorations; //@ts-ignore
        delete model._oldDecorationsSource;
        model._hasHighlight = false;
    }
};
var handleUnhandledPromiseRejection = function () {
    console.debug("handler for unhandled promise rejection");
};
var setAllRangesToPrev = function (rangeMap) {
    for (var key in rangeMap) {
        var restriction = rangeMap[key];
        restriction.range = restriction.prevRange;
    }
};
var doesChangeHasMultilineConflict = function (restriction, text) {
    return !restriction.allowMultiline && text.includes("\n");
};
var isChangeInvalidAsPerUser = function (restriction, value, range) {
    return (restriction.validate && //@ts-ignore
        !restriction.validate(value, range, restriction.lastInfo));
};
var sortRangesInAscendingOrder = function (rangeObject1, rangeObject2) {
    var rangeA = rangeObject1.range;
    var rangeB = rangeObject2.range;
    if (rangeA[0] < rangeB[0] ||
        (rangeA[0] === rangeB[0] && rangeA[3] < rangeB[1])) {
        return -1;
    }
    return 1;
};
var sortModelChangesInAscendingOrder = function (change1, change2) {
    var rangeA = change1.range;
    var rangeB = change2.range;
    if (rangeA.startLineNumber < rangeB.startLineNumber ||
        (rangeA.startLineNumber === rangeB.startLineNumber && rangeA.endLineNumber < rangeB.startColumn)) {
        return -1;
    }
    return 1;
};
var normalizeRange = function (range, content) {
    var lines = content.split("\n");
    var noOfLines = lines.length;
    var normalizedRange = [];
    range.forEach(function (value, index) {
        if (value === 0) {
            throw new Error("Range values cannot be zero"); //No I18n
        }
        switch (index) {
            case 0:
                {
                    if (value < 0) {
                        throw new Error("Start Line of Range cannot be negative"); //No I18n
                    }
                    else if (value > noOfLines) {
                        throw new Error("Provided Start Line(" +
                            value +
                            ") is out of bounds. Max Lines in content is " +
                            noOfLines); //No I18n
                    }
                    normalizedRange[index] = value;
                }
                break;
            case 1:
                {
                    var actualStartCol = value;
                    var startLineNo = normalizedRange[0];
                    var maxCols = lines[startLineNo - 1].length;
                    if (actualStartCol < 0) {
                        actualStartCol = maxCols - Math.abs(actualStartCol);
                        if (actualStartCol < 0) {
                            throw new Error("Provided Start Column(" +
                                value +
                                ") is out of bounds. Max Column in line " +
                                startLineNo +
                                " is " +
                                maxCols); //No I18n
                        }
                    }
                    else if (actualStartCol > maxCols + 1) {
                        throw new Error("Provided Start Column(" +
                            value +
                            ") is out of bounds. Max Column in line " +
                            startLineNo +
                            " is " +
                            maxCols); //No I18n
                    }
                    normalizedRange[index] = actualStartCol;
                }
                break;
            case 2:
                {
                    var actualEndLine = value;
                    if (actualEndLine < 0) {
                        actualEndLine = noOfLines - Math.abs(value);
                        if (actualEndLine < 0) {
                            throw new Error("Provided End Line(" +
                                value +
                                ") is out of bounds. Max Lines in content is " +
                                noOfLines); //No I18n
                        }
                        if (actualEndLine < normalizedRange[0]) {
                            console.warn("Provided End Line(" +
                                value +
                                ") is less than the start Line, the Restriction may not behave as expected"); //No I18n
                        }
                    }
                    else if (value > noOfLines) {
                        throw new Error("Provided End Line(" +
                            value +
                            ") is out of bounds. Max Lines in content is " +
                            noOfLines); //No I18n
                    }
                    normalizedRange[index] = actualEndLine;
                }
                break;
            case 3:
                {
                    var actualEndCol = value;
                    var endLineNo = normalizedRange[2];
                    var maxCols = lines[endLineNo - 1].length;
                    if (actualEndCol < 0) {
                        actualEndCol = maxCols - Math.abs(actualEndCol);
                        if (actualEndCol < 0) {
                            throw new Error("Provided End Column(" +
                                value +
                                ") is out of bounds. Max Column in line " +
                                endLineNo +
                                " is " +
                                maxCols); //No I18n
                        }
                    }
                    else if (actualEndCol > maxCols + 1) {
                        throw new Error("Provided Start Column(" +
                            value +
                            ") is out of bounds. Max Column in line " +
                            endLineNo +
                            " is " +
                            maxCols); //No I18n
                    }
                    normalizedRange[index] = actualEndCol;
                }
                break;
        }
    });
    return normalizedRange;
};
var prepareRestrictions = function (restrictionsArgs, model, rangeConstructor) {
    var content = model.getValue();
    var restrictions = restrictionsArgs.map(function (restrictionArg, index) {
        var range = normalizeRange(restrictionArg.range, content);
        var startLine = range[0];
        var startCol = range[1];
        var endLine = range[2];
        var endCol = range[3];
        var restriction = {};
        restriction._originalRange = range.slice();
        restriction.range = new rangeConstructor(startLine, startCol, endLine, endCol);
        restriction.index = index;
        if (!restriction.allowMultiline) {
            restriction.allowMultiline = rangeConstructor.spansMultipleLines(restriction.range);
        }
        if (!restriction.label) {
            restriction.label = "[".concat(startLine, ",").concat(startCol, " -> ").concat(endLine).concat(endCol, "]");
        }
        return restriction;
    });
    return restrictions;
};
var getCurrentEditableRanges = function (restrictions) {
    return restrictions.reduce(function (acc, restriction) {
        acc[restriction.label] = {
            allowMultiline: restriction.allowMultiline || false,
            index: restriction.index,
            range: Object.assign({}, restriction.range),
            originalRange: restriction._originalRange.slice(),
        };
        return acc;
    }, {});
};
var getValueInEditableRanges = function (
// model: TextModel,
model, restrictions) {
    return restrictions.reduce(function (acc, restriction) {
        acc[restriction.label] = model.getValueInRange(restriction.range);
        return acc;
    }, {});
};
var updateValueInEditableRanges = function (object, forceMoveMarkers, restrictions, model) {
    if (typeof object === "object" && !Array.isArray(object)) {
        forceMoveMarkers =
            typeof forceMoveMarkers === "boolean" ? forceMoveMarkers : false;
        var restrictionsMap = restrictions.reduce(function (acc, restriction) {
            if (restriction.label) {
                acc[restriction.label] = restriction;
            }
            return acc;
        }, {});
        for (var label in object) {
            var restriction = restrictionsMap[label];
            if (restriction) {
                var value = object[label];
                if (doesChangeHasMultilineConflict(restriction, value)) {
                    throw new Error("Multiline change is not allowed for " + label);
                }
                var newRange = (0, deepClone_js_1.default)(restriction.range);
                newRange.endLine = newRange.startLine + value.split("\n").length - 1;
                newRange.endColumn = value.split("\n").pop().length;
                if (isChangeInvalidAsPerUser(restriction, value, newRange)) {
                    throw new Error("Change is invalidated by validate function of " + label);
                }
                model.applyEdits([
                    {
                        forceMoveMarkers: !!forceMoveMarkers,
                        range: restriction.range,
                        text: value,
                    },
                ]);
            }
            else {
                console.error("No restriction found for " + label);
            }
        }
    }
    else {
        throw new Error("Value must be an object"); //No I18n
    }
};
var disposeRestrictions = function (model) {
    model._restrictionChangeListener.dispose();
    window.removeEventListener("error", handleUnhandledPromiseRejection); //@ts-ignore
    delete model.editInRestrictedArea; //@ts-ignore
    delete model.disposeRestrictions; //@ts-ignore
    delete model.getValueInEditableRanges; //@ts-ignore
    delete model.updateValueInEditableRanges; //@ts-ignore
    delete model.updateRestrictions; //@ts-ignore
    delete model.getCurrentEditableRanges; //@ts-ignore
    delete model.toggleHighlightOfEditableAreas; //@ts-ignore
    delete model._hasHighlight; //@ts-ignore
    delete model._isRestrictedModel; //@ts-ignore
    delete model._isCursorAtCheckPoint; //@ts-ignore
    delete model._currentCursorPositions; //@ts-ignore
    delete model._editableRangeChangeListener; //@ts-ignore
    delete model._restrictionChangeListener; //@ts-ignore
    delete model._oldDecorations; //@ts-ignore
    delete model._oldDecorationsSource;
    return model;
};
var isCursorAtCheckPoint = function (positions, restrictions, model) {
    positions.some(function (position) {
        var posLineNumber = position.lineNumber;
        var posCol = position.column;
        var length = restrictions.length;
        for (var i = 0; i < length; i++) {
            var range = restrictions[i].range;
            if ((range.startLineNumber === posLineNumber &&
                range.startColumn === posCol) ||
                (range.endLineNumber === posLineNumber && range.endColumn === posCol)) {
                model.pushStackElement();
                return true;
            }
        }
    });
};
var addEditableRangeListener = function (callback, model) {
    if (typeof callback === "function") {
        model._editableRangeChangeListener.push(callback);
    }
};
var triggerChangeListenersWith = function (currentChanges, allChanges, restrictions, model) {
    var currentRanges = getCurrentEditableRanges(restrictions);
    model._editableRangeChangeListener.forEach(function (callback) {
        callback.call(model, currentChanges, allChanges, currentRanges);
    });
};
var doUndo = function (model) {
    return Promise.resolve().then(function () {
        model.editInRestrictedArea = true;
        model.undo();
        model.editInRestrictedArea = false;
        if (model._hasHighlight && model._oldDecorationsSource) {
            // id present in the decorations info will be omitted by monaco
            // So we don't need to remove the old decorations id
            model.deltaDecorations(model._oldDecorations, model._oldDecorationsSource);
            model._oldDecorationsSource.forEach(function (object) {
                object.range = model.getDecorationRange(object.id);
            });
        }
    });
};
var updateRange = function (restriction, range, finalLine, finalColumn, changes, changeIndex, rangeMap, restrictions, model) {
    var oldRangeEndLineNumber = range.endLineNumber;
    var oldRangeEndColumn = range.endColumn;
    restriction.prevRange = range;
    restriction.range = range.setEndPosition(finalLine, finalColumn);
    var length = restrictions.length;
    var changesLength = changes.length;
    var diffInCol = finalColumn - oldRangeEndColumn;
    var diffInRow = finalLine - oldRangeEndLineNumber;
    var cursorPositions = model._currentCursorPositions || [];
    var noOfCursorPositions = cursorPositions.length;
    // if (noOfCursorPositions > 0) {
    if (changesLength !== noOfCursorPositions) {
        changes = changes.filter(function (change) {
            var range = change.range;
            for (var i = 0; i < noOfCursorPositions; i++) {
                var cursorPosition = cursorPositions[i];
                if (range.startLineNumber === cursorPosition.startLineNumber &&
                    range.endLineNumber === cursorPosition.endLineNumber &&
                    range.startColumn === cursorPosition.startColumn &&
                    range.endColumn === cursorPosition.endColumn) {
                    return true;
                }
            }
            return false;
        });
        changesLength = changes.length;
    }
    if (diffInRow !== 0) {
        for (var i = restriction.index + 1; i < length; i++) {
            var nextRestriction = restrictions[i];
            var nextRange = nextRestriction.range;
            if (oldRangeEndLineNumber === nextRange.startLineNumber) {
                //@ts-ignore
                nextRange.startColumn += diffInCol;
            }
            if (oldRangeEndLineNumber === nextRange.endLineNumber) {
                //@ts-ignore
                nextRange.endColumn += diffInCol;
            } //@ts-ignore
            nextRange.startLineNumber += diffInRow; //@ts-ignore
            nextRange.endLineNumber += diffInRow;
            nextRestriction.range = nextRange;
        }
        for (var i = changeIndex + 1; i < changesLength; i++) {
            var nextChange = changes[i];
            var rangeInChange = nextChange.range;
            var rangeAsString = rangeInChange.toString();
            var rangeMapValue = rangeMap[rangeAsString];
            delete rangeMap[rangeAsString];
            if (oldRangeEndLineNumber === rangeInChange.startLineNumber) {
                //@ts-ignore
                rangeInChange.startColumn += diffInCol;
            }
            if (oldRangeEndLineNumber === rangeInChange.endLineNumber) {
                //@ts-ignore
                rangeInChange.endColumn += diffInCol;
            } //@ts-ignore
            rangeInChange.startLineNumber += diffInRow; //@ts-ignore
            rangeInChange.endLineNumber += diffInRow; //@ts-ignore
            nextChange.range = rangeInChange;
            rangeMap[rangeInChange.toString()] = rangeMapValue;
        }
    }
    else {
        // Only Column might have changed
        for (var i = restriction.index + 1; i < length; i++) {
            var nextRestriction = restrictions[i];
            var nextRange = nextRestriction.range;
            if (nextRange.startLineNumber > oldRangeEndLineNumber) {
                break;
            }
            else {
                //@ts-ignore
                nextRange.startColumn += diffInCol; //@ts-ignore
                nextRange.endColumn += diffInCol;
                nextRestriction.range = nextRange;
            }
        }
        for (var i = changeIndex + 1; i < changesLength; i++) {
            // rangeMap
            var nextChange = changes[i];
            var rangeInChange = nextChange.range;
            var rangeAsString = rangeInChange.toString();
            var rangeMapValue = rangeMap[rangeAsString];
            delete rangeMap[rangeAsString];
            if (rangeInChange.startLineNumber > oldRangeEndLineNumber) {
                rangeMap[rangeInChange.toString()] = rangeMapValue;
                break;
            }
            else {
                //@ts-ignore
                rangeInChange.startColumn += diffInCol; //@ts-ignore
                rangeInChange.endColumn += diffInCol; //@ts-ignore
                nextChange.range = rangeInChange;
                rangeMap[rangeInChange.toString()] = rangeMapValue;
            }
        }
    }
};
var getInfoFrom = function (change, editableRange) {
    var info = {};
    var range = change.range;
    // Get State
    if (change.text === "") {
        info.isDeletion = true;
    }
    else if (range.startLineNumber === range.endLineNumber &&
        range.startColumn === range.endColumn) {
        info.isAddition = true;
    }
    else {
        info.isReplacement = true;
    }
    // Get Position Of Range
    info.startLineOfRange =
        range.startLineNumber === editableRange.startLineNumber;
    info.startColumnOfRange = range.startColumn === editableRange.startColumn;
    info.endLineOfRange = range.endLineNumber === editableRange.endLineNumber;
    info.endColumnOfRange = range.endColumn === editableRange.endColumn;
    info.middleLineOfRange = !info.startLineOfRange && !info.endLineOfRange;
    // Editable Range Span
    if (editableRange.startLineNumber === editableRange.endLineNumber) {
        info.rangeIsSingleLine = true;
    }
    else {
        info.rangeIsMultiLine = true;
    }
    return info;
};
var constrainedModel = function (model, //TextModel,
ranges, //Restriction[],
monaco) {
    var rangeConstructor = monaco.Range;
    var restrictionArgs = (0, deepClone_js_1.default)(ranges).sort(sortRangesInAscendingOrder);
    var restrictions = prepareRestrictions(restrictionArgs, model, rangeConstructor);
    var updateRestrictions = function (ranges) {
        var sortedRestrictions = (0, deepClone_js_1.default)(ranges).sort(sortRangesInAscendingOrder);
        restrictions = prepareRestrictions(sortedRestrictions, model, rangeConstructor);
    };
    var manipulatorApi = {
        _isRestrictedModel: true,
        _isRestrictedValueValid: true,
        _editableRangeChangeListener: [],
        _restrictionChangeListener: null,
        _currentCursorPositions: [],
        _isCursorAtCheckPoint: function (positions) { return isCursorAtCheckPoint(positions, restrictions, model); },
    };
    model._hasHighlight = false;
    manipulatorApi._restrictionChangeListener = model.onDidChangeContent(function (contentChangedEvent) {
        var isUndoing = contentChangedEvent.isUndoing;
        model._isRestrictedValueValid = true;
        if (!(isUndoing && model.editInRestrictedArea)) {
            var changes_1 = contentChangedEvent.changes.sort(sortModelChangesInAscendingOrder);
            var rangeMap_1 = {};
            var length_1 = restrictions.length;
            var isAllChangesValid = changes_1.every(function (change) {
                var editedRange = change.range;
                var rangeAsString = editedRange.toString();
                // rangeMap[rangeAsString] = null;
                delete rangeMap_1[rangeAsString]; // To remove the previous value
                for (var i = 0; i < length_1; i++) {
                    var restriction = restrictions[i];
                    var range = restriction.range;
                    if (range.containsRange(editedRange)) {
                        if (doesChangeHasMultilineConflict(restriction, change.text)) {
                            return false;
                        }
                        rangeMap_1[rangeAsString] = restriction;
                        return true;
                    }
                }
                return false;
            });
            if (isAllChangesValid) {
                changes_1.forEach(function (change, changeIndex) {
                    var changedRange = change.range;
                    var restriction = rangeMap_1[changedRange.toString()];
                    var editableRange = restriction.range;
                    var text = change.text || "";
                    /**
                     * Things to check before implementing the change
                     * - A | D | R => Addition | Deletion | Replacement
                     * - MC | SC => MultiLineChange | SingleLineChange
                     * - SOR | MOR | EOR => Change Occured in - Start Of Range | Middle Of Range | End Of Range
                     * - SSL | SML => Editable Range - Spans Single Line | Spans Multiple Line
                     */
                    var noOfLinesAdded = (text.match(/\n/g) || []).length; //@ts-ignore
                    var noOfColsAddedAtLastLine = text.split(/\n/g).pop().length;
                    var lineDiffInRange = changedRange.endLineNumber - changedRange.startLineNumber;
                    var colDiffInRange = changedRange.endColumn - changedRange.startColumn;
                    var finalLine = editableRange.endLineNumber;
                    var finalColumn = editableRange.endColumn;
                    var columnsCarriedToEnd = 0;
                    if (editableRange.endLineNumber === changedRange.startLineNumber ||
                        editableRange.endLineNumber === changedRange.endLineNumber) {
                        columnsCarriedToEnd +=
                            editableRange.endColumn - changedRange.startColumn + 1;
                    }
                    var info = getInfoFrom(change, editableRange);
                    restriction.lastInfo = info;
                    if (info.isAddition || info.isReplacement) {
                        if (info.rangeIsSingleLine) {
                            /**
                             * Only Column Change has occurred , so regardless of the position of the change
                             * Addition of noOfCols is enough
                             */
                            if (noOfLinesAdded === 0) {
                                finalColumn += noOfColsAddedAtLastLine;
                            }
                            else {
                                finalLine += noOfLinesAdded;
                                if (info.startColumnOfRange) {
                                    finalColumn += noOfColsAddedAtLastLine;
                                }
                                else if (info.endColumnOfRange) {
                                    finalColumn = noOfColsAddedAtLastLine + 1;
                                }
                                else {
                                    finalColumn = noOfColsAddedAtLastLine + columnsCarriedToEnd;
                                }
                            }
                        }
                        if (info.rangeIsMultiLine) {
                            // Handling for Start Of Range is not required
                            finalLine += noOfLinesAdded;
                            if (info.endLineOfRange) {
                                if (noOfLinesAdded === 0) {
                                    finalColumn += noOfColsAddedAtLastLine;
                                }
                                else {
                                    finalColumn = columnsCarriedToEnd + noOfColsAddedAtLastLine;
                                }
                            }
                        }
                    }
                    if (info.isDeletion || info.isReplacement) {
                        if (info.rangeIsSingleLine) {
                            finalColumn -= colDiffInRange;
                        }
                        if (info.rangeIsMultiLine) {
                            if (info.endLineOfRange) {
                                finalLine -= lineDiffInRange;
                                finalColumn -= colDiffInRange;
                            }
                            else {
                                finalLine -= lineDiffInRange;
                            }
                        }
                    }
                    updateRange(restriction, editableRange, finalLine, finalColumn, changes_1, changeIndex, rangeMap_1, restrictions, model);
                });
                var values = model.getValueInEditableRanges(restrictions);
                var currentlyEditedRanges = {};
                // const currentlyEditedRanges: IModelContentChange[] = [];
                for (var key in rangeMap_1) {
                    var restriction = rangeMap_1[key];
                    var range = restriction.range;
                    var rangeString = restriction.label || range.toString();
                    var value = values[rangeString];
                    if (isChangeInvalidAsPerUser(restriction, value, range)) {
                        setAllRangesToPrev(rangeMap_1);
                        doUndo(model);
                        return; // Breaks the loop and prevents the triggerChangeListener
                    }
                    currentlyEditedRanges[rangeString] = value;
                }
                if (model._hasHighlight) {
                    model._oldDecorationsSource.forEach(function (object) {
                        object.range = model.getDecorationRange(object.id);
                    });
                }
                triggerChangeListenersWith(currentlyEditedRanges, values, restrictions, model);
            }
            else {
                doUndo(model);
            }
        }
        else if (model.editInRestrictedArea) {
            model._isRestrictedValueValid = false;
        }
    });
    window.onerror = handleUnhandledPromiseRejection;
    var exposedApi = {
        editInRestrictedArea: false,
        getCurrentEditableRanges: function () { return getCurrentEditableRanges(restrictions); },
        getValueInEditableRanges: function () {
            return getValueInEditableRanges(model, restrictions);
        },
        disposeRestrictions: function () { return disposeRestrictions(model); },
        onDidChangeContentInEditableRange: function (callback) { return addEditableRangeListener(callback, model); },
        updateRestrictions: updateRestrictions,
        updateValueInEditableRanges: function (labelValuesDict, forceMoveMarkers) {
            return updateValueInEditableRanges(labelValuesDict, forceMoveMarkers, restrictions, model);
        },
        toggleHighlightOfEditableAreas: function (cssClasses) { return toggleHighlightOfEditableAreas(cssClasses, restrictions, model); },
    };
    for (var funcName in manipulatorApi) {
        Object.defineProperty(model, funcName, {
            enumerable: false,
            configurable: true,
            writable: true,
            value: manipulatorApi[funcName],
        });
    }
    for (var apiName in exposedApi) {
        Object.defineProperty(model, apiName, {
            enumerable: false,
            configurable: true,
            writable: true,
            value: exposedApi[apiName],
        });
    }
    return model;
};
exports.constrainedModel = constrainedModel;
exports.default = exports.constrainedModel;
