import * as monaco_editor_namespace from "monaco-editor";

/*
This file is the typescript version of the original src/constrainedModel.js file from: https://github.com/Pranomvignesh/constrained-editor-plugin
*/

import deepClone from "./utils/deepClone.js";
import enums from "./utils/enums.js";

type TextModel = monaco_editor_namespace.editor.ITextModel;
type Range = monaco_editor_namespace.Range;

export type _EditableRangeChangeListener = (
  currentChanges: { [key: string]: string },
  allChanges: { [key: string]: string },
  currentRanges: {
    [key: string]: {
      allowMultiline: boolean;
      index: number;
      range: monaco_editor_namespace.Range;
      originalRange: number[];
    };
  }
) => void;

export type Info = {
  isDeletion: boolean;
  isAddition: boolean;
  isReplacement: boolean;
  startLineOfRange: boolean;
  startColumnOfRange: boolean;
  endLineOfRange: boolean;
  endColumnOfRange: boolean;
  middleLineOfRange: boolean;
  rangeIsSingleLine: boolean;
  rangeIsMultiLine: boolean;
};

export type Decoration = monaco_editor_namespace.editor.IModelDecoration & {
  hoverMessage?: string;
  options: {
    className:
      | (typeof enums)["MULTI_LINE_HIGHLIGHT_CLASS"]
      | (typeof enums)["SINGLE_LINE_HIGHLIGHT_CLASS"];
  };
};

type OldDecorationSource = {
  range: Range;
  options: { className: string };
  hoverMessage?: string;
  id: string;
};

export type ManipulatorApi = {
  _isRestrictedModel: boolean;
  _isRestrictedValueValid: boolean;
  _editableRangeChangeListener: _EditableRangeChangeListener[];
  _restrictionChangeListener: null | monaco_editor_namespace.IDisposable;
  _isCursorAtCheckPoint: (
    positions: {
      lineNumber: number;
      column: number;
    }[],
    restrictions: Restriction[]
  ) => void;
  _currentCursorPositions: [];
};

export type ConstrainedModel = TextModel & {
  _isRestrictedModel: boolean;
  _isRestrictedValueValid: boolean;
  _editableRangeChangeListener: _EditableRangeChangeListener[];
  _isCursorAtCheckPoint: (
    positions: { lineNumber: number; column: number }[]
    // restrictions: Restriction[]
  ) => void;
  _currentCursorPositions: monaco_editor_namespace.Selection[];
  _restrictionChangeListener: monaco_editor_namespace.IDisposable;
  _oldDecorations: string[];
  _oldDecorationsSource: OldDecorationSource[]; // monaco_editor_namespace.editor.IModelDecoration[];
  _hasHighlight: boolean;
  editInRestrictedArea: boolean;
  disposeRestrictions: () => ConstrainedModel;
  getValueInEditableRanges: (restrictions: Restriction[]) => {
    [key: string]: string;
  };
  updateValueInEditableRanges: (
    object: any,
    forceMoveMarkers: boolean | undefined,
    restrictions: Restriction[]
  ) => void;
  // updateRestrictions: (ranges: RestrictionArgs[]) => void;
  updateRestrictions: () => void;
  getCurrentEditableRanges: (restrictions: Restriction[]) => {
    [key: string]: {
      allowMultiline: boolean;
      index: number;
      range: Range;
      originalRange: number[];
    };
  };
  toggleHighlightOfEditableAreas: (restrictions: Restriction[]) => void;
  undo: () => void;
  pushStackElement: Function;
  applyEdits: Function;
  onDidChangeContent: Function;
  onDidChangeDecorations: Function;
  onDidChangeCursorPosition: Function;
  onDidChangeModelDecorations: Function;
  onDidChangeModelLanguage: Function;
  onDidChangeModelOptions: Function;
  onDidChangeModelLanguageConfiguration: Function;
  onDidChangeModelContent: Function;
};

export type ValidateCB = (
  currentlyTypedValue: string,
  newRange: [startLine: number, startColumn: number, endLine: number, endColumn: number],
  info: Info
) => boolean;

export type RestrictionArgs = {
  range: [startLine: number, startColumn: number, endLine: number, endColumn: number];
  label?: string;
  validate?: ValidateCB;
  allowMultiline?: boolean;
};

export type Restriction = {
  range: Range;
  allowMultiline?: boolean;
  label: string;
  validate?: ValidateCB;
  index: number;
  _originalRange: number[];
  prevRange: Range;
  lastInfo: Info;
};

export type IRange = monaco_editor_namespace.IRange;
export type IModelContentChange =
  monaco_editor_namespace.editor.IModelContentChange;

const toggleHighlightOfEditableAreas = function (
  cssClasses: { cssClassForSingleLine?: string; cssClassForMultiLine?: string },
  restrictions: Restriction[],
  model: ConstrainedModel
) {
  if (!model._hasHighlight) {
    const cssClassForSingleLine =
      cssClasses.cssClassForSingleLine || enums.SINGLE_LINE_HIGHLIGHT_CLASS;
    const cssClassForMultiLine =
      cssClasses.cssClassForMultiLine || enums.MULTI_LINE_HIGHLIGHT_CLASS;
    const decorations: OldDecorationSource[] = restrictions.map(function (
      restriction
    ) {
      const decoration: OldDecorationSource = {
        id: "",
        range: restriction.range,
        options: {
          className: restriction.allowMultiline
            ? cssClassForMultiLine
            : cssClassForSingleLine,
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
  } else {
    model.deltaDecorations(model._oldDecorations, []); //@ts-ignore
    delete model._oldDecorations; //@ts-ignore
    delete model._oldDecorationsSource;
    model._hasHighlight = false;
  }
};
const handleUnhandledPromiseRejection = function () {
  console.debug("handler for unhandled promise rejection");
};
const setAllRangesToPrev = function (rangeMap: { [key: string]: Restriction }) {
  for (let key in rangeMap) {
    const restriction = rangeMap[key];
    restriction.range = restriction.prevRange;
  }
};
const doesChangeHasMultilineConflict = function (
  restriction: Restriction,
  text: string
) {
  return !restriction.allowMultiline && text.includes("\n");
};
const isChangeInvalidAsPerUser = function (
  restriction: Restriction,
  value: string,
  range: Range
) {
  return (
    restriction.validate && //@ts-ignore
    !restriction.validate(value, range, restriction.lastInfo as Info)
  );
};

const sortRangesInAscendingOrder = function (
  rangeObject1: RestrictionArgs,
  rangeObject2: RestrictionArgs
) {
  const rangeA = rangeObject1.range;
  const rangeB = rangeObject2.range;
  if (
    rangeA[0] < rangeB[0] ||
    (rangeA[0] === rangeB[0] && rangeA[3] < rangeB[1])
  ) {
    return -1;
  }
  return 1;
};
const sortModelChangesInAscendingOrder = function (
  change1: IModelContentChange,
  change2: IModelContentChange
) {
  const rangeA = change1.range;
  const rangeB = change2.range;
  if (rangeA.startLineNumber < rangeB.startLineNumber ||
    (rangeA.startLineNumber === rangeB.startLineNumber && rangeA.endLineNumber < rangeB.startColumn)) {
    return -1
  }
  return 1;
};

const normalizeRange = function (range: number[], content: string) {
  const lines = content.split("\n");
  const noOfLines = lines.length;
  const normalizedRange: number[] = [];
  range.forEach(function (value, index) {
    if (value === 0) {
      throw new Error("Range values cannot be zero"); //No I18n
    }
    switch (index) {
      case 0:
        {
          if (value < 0) {
            throw new Error("Start Line of Range cannot be negative"); //No I18n
          } else if (value > noOfLines) {
            throw new Error(
              "Provided Start Line(" +
                value +
                ") is out of bounds. Max Lines in content is " +
                noOfLines
            ); //No I18n
          }
          normalizedRange[index] = value;
        }
        break;
      case 1:
        {
          let actualStartCol = value;
          const startLineNo = normalizedRange[0];
          const maxCols = lines[startLineNo - 1].length;
          if (actualStartCol < 0) {
            actualStartCol = maxCols - Math.abs(actualStartCol);
            if (actualStartCol < 0) {
              throw new Error(
                "Provided Start Column(" +
                  value +
                  ") is out of bounds. Max Column in line " +
                  startLineNo +
                  " is " +
                  maxCols
              ); //No I18n
            }
          } else if (actualStartCol > maxCols + 1) {
            throw new Error(
              "Provided Start Column(" +
                value +
                ") is out of bounds. Max Column in line " +
                startLineNo +
                " is " +
                maxCols
            ); //No I18n
          }
          normalizedRange[index] = actualStartCol;
        }
        break;
      case 2:
        {
          let actualEndLine = value;
          if (actualEndLine < 0) {
            actualEndLine = noOfLines - Math.abs(value);
            if (actualEndLine < 0) {
              throw new Error(
                "Provided End Line(" +
                  value +
                  ") is out of bounds. Max Lines in content is " +
                  noOfLines
              ); //No I18n
            }
            if (actualEndLine < normalizedRange[0]) {
              console.warn(
                "Provided End Line(" +
                  value +
                  ") is less than the start Line, the Restriction may not behave as expected"
              ); //No I18n
            }
          } else if (value > noOfLines) {
            throw new Error(
              "Provided End Line(" +
                value +
                ") is out of bounds. Max Lines in content is " +
                noOfLines
            ); //No I18n
          }
          normalizedRange[index] = actualEndLine;
        }
        break;
      case 3:
        {
          let actualEndCol = value;
          const endLineNo = normalizedRange[2];
          const maxCols = lines[endLineNo - 1].length;
          if (actualEndCol < 0) {
            actualEndCol = maxCols - Math.abs(actualEndCol);
            if (actualEndCol < 0) {
              throw new Error(
                "Provided End Column(" +
                  value +
                  ") is out of bounds. Max Column in line " +
                  endLineNo +
                  " is " +
                  maxCols
              ); //No I18n
            }
          } else if (actualEndCol > maxCols + 1) {
            throw new Error(
              "Provided Start Column(" +
                value +
                ") is out of bounds. Max Column in line " +
                endLineNo +
                " is " +
                maxCols
            ); //No I18n
          }
          normalizedRange[index] = actualEndCol;
        }
        break;
    }
  });
  return normalizedRange;
};

const prepareRestrictions = function (
  restrictionsArgs: RestrictionArgs[],
  model: TextModel,
  rangeConstructor: typeof monaco_editor_namespace.Range
) {
  const content = model.getValue();
  const restrictions = restrictionsArgs.map(function (restrictionArg, index) {
    const range = normalizeRange(restrictionArg.range, content);
    const startLine = range[0];
    const startCol = range[1];
    const endLine = range[2];
    const endCol = range[3];
    const restriction = {} as Restriction;
    restriction._originalRange = range.slice();
    restriction.range = new rangeConstructor(
      startLine,
      startCol,
      endLine,
      endCol
    );
    restriction.index = index;
    if (!restriction.allowMultiline) {
      restriction.allowMultiline = rangeConstructor.spansMultipleLines(
        restriction.range
      );
    }
    if (!restriction.label) {
      restriction.label = `[${startLine},${startCol} -> ${endLine}${endCol}]`;
    }
    return restriction;
  });
  return restrictions;
};

const getCurrentEditableRanges = function (restrictions: Restriction[]) {
  return restrictions.reduce(
    function (acc, restriction) {
      acc[restriction.label] = {
        allowMultiline: restriction.allowMultiline || false,
        index: restriction.index as number,
        range: Object.assign({}, restriction.range as Range),
        originalRange: restriction._originalRange.slice(),
      };
      return acc;
    },
    {} as {
      [key: string]: {
        allowMultiline: boolean;
        index: number;
        range: Range;
        originalRange: number[];
      };
    }
  );
};
const getValueInEditableRanges = function (
  // model: TextModel,
  model: ConstrainedModel,
  restrictions: Restriction[]
) {
  return restrictions.reduce(function (acc, restriction) {
    acc[restriction.label] = model.getValueInRange(restriction.range as Range);
    return acc;
  }, {} as { [key: string]: string });
};
const updateValueInEditableRanges = function (
  object: any,
  forceMoveMarkers: boolean | undefined,
  restrictions: Restriction[],
  model: ConstrainedModel
) {
  if (typeof object === "object" && !Array.isArray(object)) {
    forceMoveMarkers =
      typeof forceMoveMarkers === "boolean" ? forceMoveMarkers : false;
    const restrictionsMap: { [key: string]: Restriction } = restrictions.reduce(
      function (acc, restriction) {
        if (restriction.label) {
          acc[restriction.label] = restriction;
        }
        return acc;
      },
      {} as { [key: string]: Restriction }
    );
    for (let label in object) {
      const restriction = restrictionsMap[label];
      if (restriction) {
        const value = object[label];
        if (doesChangeHasMultilineConflict(restriction, value)) {
          throw new Error("Multiline change is not allowed for " + label);
        }
        const newRange = deepClone(restriction.range);
        newRange.endLine = newRange.startLine + value.split("\n").length - 1;
        newRange.endColumn = value.split("\n").pop().length;
        if (isChangeInvalidAsPerUser(restriction, value, newRange)) {
          throw new Error(
            "Change is invalidated by validate function of " + label
          );
        }
        model.applyEdits([
          {
            forceMoveMarkers: !!forceMoveMarkers,
            range: restriction.range as Range,
            text: value,
          },
        ]);
      } else {
        console.error("No restriction found for " + label);
      }
    }
  } else {
    throw new Error("Value must be an object"); //No I18n
  }
};

const disposeRestrictions = function (model: ConstrainedModel) {
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
const isCursorAtCheckPoint = function (
  positions: { lineNumber: number; column: number }[],
  restrictions: Restriction[],
  model: ConstrainedModel
) {
  positions.some(function (position) {
    const posLineNumber = position.lineNumber;
    const posCol = position.column;
    const length = restrictions.length;
    for (let i = 0; i < length; i++) {
      const range = restrictions[i].range;
      if (
        (range.startLineNumber === posLineNumber &&
          range.startColumn === posCol) ||
        (range.endLineNumber === posLineNumber && range.endColumn === posCol)
      ) {
        model.pushStackElement();
        return true;
      }
    }
  });
};
const addEditableRangeListener = function (
  callback: _EditableRangeChangeListener,
  model: ConstrainedModel
) {
  if (typeof callback === "function") {
    model._editableRangeChangeListener.push(callback);
  }
};
const triggerChangeListenersWith = function (
  currentChanges: { [key: string]: string },
  allChanges: { [key: string]: string },
  restrictions: Restriction[],
  model: ConstrainedModel
) {
  const currentRanges = getCurrentEditableRanges(restrictions);
  model._editableRangeChangeListener.forEach(function (callback) {
    callback.call(model, currentChanges, allChanges, currentRanges);
  });
};
const doUndo = function (model: ConstrainedModel) {
  return Promise.resolve().then(function () {
    model.editInRestrictedArea = true;
    model.undo();
    model.editInRestrictedArea = false;
    if (model._hasHighlight && model._oldDecorationsSource) {
      // id present in the decorations info will be omitted by monaco
      // So we don't need to remove the old decorations id
      model.deltaDecorations(
        model._oldDecorations,
        model._oldDecorationsSource
      );
      model._oldDecorationsSource.forEach(function (object) {
        object.range = model.getDecorationRange(object.id) as Range;
      });
    }
  });
};
const updateRange = function (
  restriction: Restriction,
  range: Range,
  finalLine: number,
  finalColumn: number,
  changes: monaco_editor_namespace.editor.IModelContentChange[],
  changeIndex: number,
  rangeMap: { [key: string]: Restriction },
  restrictions: Restriction[],
  model: ConstrainedModel
) {
  let oldRangeEndLineNumber = range.endLineNumber;
  let oldRangeEndColumn = range.endColumn;
  restriction.prevRange = range;
  restriction.range = range.setEndPosition(finalLine, finalColumn);
  const length = restrictions.length;
  let changesLength = changes.length;
  const diffInCol = finalColumn - oldRangeEndColumn;
  const diffInRow = finalLine - oldRangeEndLineNumber;

  const cursorPositions = model._currentCursorPositions || [];
  const noOfCursorPositions = cursorPositions.length;
  // if (noOfCursorPositions > 0) {
  if (changesLength !== noOfCursorPositions) {
    changes = changes.filter(function (change) {
      const range = change.range;
      for (let i = 0; i < noOfCursorPositions; i++) {
        const cursorPosition = cursorPositions[i];
        if (
          range.startLineNumber === cursorPosition.startLineNumber &&
          range.endLineNumber === cursorPosition.endLineNumber &&
          range.startColumn === cursorPosition.startColumn &&
          range.endColumn === cursorPosition.endColumn
        ) {
          return true;
        }
      }
      return false;
    });
    changesLength = changes.length;
  }
  if (diffInRow !== 0) {
    for (let i = restriction.index + 1; i < length; i++) {
      const nextRestriction = restrictions[i];
      const nextRange = nextRestriction.range as Range;
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
    for (let i = changeIndex + 1; i < changesLength; i++) {
      const nextChange = changes[i];
      const rangeInChange = nextChange.range;
      const rangeAsString = rangeInChange.toString();
      const rangeMapValue = rangeMap[rangeAsString];
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
  } else {
    // Only Column might have changed
    for (let i = (restriction.index as number) + 1; i < length; i++) {
      const nextRestriction = restrictions[i];
      const nextRange = nextRestriction.range as Range;
      if (nextRange.startLineNumber > oldRangeEndLineNumber) {
        break;
      } else {
        //@ts-ignore
        nextRange.startColumn += diffInCol; //@ts-ignore
        nextRange.endColumn += diffInCol;
        nextRestriction.range = nextRange;
      }
    }
    for (let i = changeIndex + 1; i < changesLength; i++) {
      // rangeMap
      const nextChange = changes[i];
      const rangeInChange = nextChange.range;
      const rangeAsString = rangeInChange.toString();
      const rangeMapValue = rangeMap[rangeAsString];
      delete rangeMap[rangeAsString];
      if (rangeInChange.startLineNumber > oldRangeEndLineNumber) {
        rangeMap[rangeInChange.toString()] = rangeMapValue;
        break;
      } else {
        //@ts-ignore
        rangeInChange.startColumn += diffInCol; //@ts-ignore
        rangeInChange.endColumn += diffInCol; //@ts-ignore
        nextChange.range = rangeInChange;
        rangeMap[rangeInChange.toString()] = rangeMapValue;
      }
    }
  }
};

const getInfoFrom = function (
  change: monaco_editor_namespace.editor.IModelContentChange,
  editableRange: Range
) {
  const info = {} as Info;
  const range = change.range;
  // Get State
  if (change.text === "") {
    info.isDeletion = true;
  } else if (
    range.startLineNumber === range.endLineNumber &&
    range.startColumn === range.endColumn
  ) {
    info.isAddition = true;
  } else {
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
  } else {
    info.rangeIsMultiLine = true;
  }
  return info;
};

export const constrainedModel = function (
  model: ConstrainedModel, //TextModel,
  ranges: RestrictionArgs[], //Restriction[],
  monaco: typeof monaco_editor_namespace
): ConstrainedModel {
  const rangeConstructor = monaco.Range;

  let restrictionArgs: RestrictionArgs[] = deepClone(ranges).sort(
    sortRangesInAscendingOrder
  );

  let restrictions = prepareRestrictions(
    restrictionArgs,
    model,
    rangeConstructor
  );

  const updateRestrictions = function (ranges: RestrictionArgs[]) {
    const sortedRestrictions: RestrictionArgs[] = deepClone(ranges).sort(
      sortRangesInAscendingOrder
    );
    restrictions = prepareRestrictions(
      sortedRestrictions,
      model,
      rangeConstructor
    );
  };

  const manipulatorApi: ManipulatorApi = {
    _isRestrictedModel: true,
    _isRestrictedValueValid: true,
    _editableRangeChangeListener: [],
    _restrictionChangeListener: null,
    _currentCursorPositions: [],
    _isCursorAtCheckPoint: (
      positions: { lineNumber: number; column: number }[]
    ) => isCursorAtCheckPoint(positions, restrictions, model),
  };

  model._hasHighlight = false;

  manipulatorApi._restrictionChangeListener = model.onDidChangeContent(
    function (contentChangedEvent) {
      const isUndoing = contentChangedEvent.isUndoing;
      model._isRestrictedValueValid = true;
      if (!(isUndoing && model.editInRestrictedArea)) {
        const changes = contentChangedEvent.changes.sort(
          sortModelChangesInAscendingOrder
        );
        const rangeMap: { [key: string]: Restriction } = {};
        const length = restrictions.length;
        const isAllChangesValid = changes.every(function (change) {
          const editedRange = change.range;
          const rangeAsString = editedRange.toString();
          // rangeMap[rangeAsString] = null;
          delete rangeMap[rangeAsString]; // To remove the previous value
          for (let i = 0; i < length; i++) {
            const restriction = restrictions[i];
            const range = restriction.range;
            if (range.containsRange(editedRange)) {
              if (doesChangeHasMultilineConflict(restriction, change.text)) {
                return false;
              }
              rangeMap[rangeAsString] = restriction;
              return true;
            }
          }
          return false;
        });
        if (isAllChangesValid) {
          changes.forEach(function (change, changeIndex) {
            const changedRange = change.range;
            const restriction = rangeMap[changedRange.toString()];
            const editableRange = restriction.range;
            const text = change.text || "";
            /**
             * Things to check before implementing the change
             * - A | D | R => Addition | Deletion | Replacement
             * - MC | SC => MultiLineChange | SingleLineChange
             * - SOR | MOR | EOR => Change Occured in - Start Of Range | Middle Of Range | End Of Range
             * - SSL | SML => Editable Range - Spans Single Line | Spans Multiple Line
             */
            const noOfLinesAdded = (text.match(/\n/g) || []).length; //@ts-ignore
            const noOfColsAddedAtLastLine = text.split(/\n/g).pop().length;

            const lineDiffInRange =
              changedRange.endLineNumber - changedRange.startLineNumber;
            const colDiffInRange =
              changedRange.endColumn - changedRange.startColumn;

            let finalLine = editableRange.endLineNumber;
            let finalColumn = editableRange.endColumn;

            let columnsCarriedToEnd = 0;
            if (
              editableRange.endLineNumber === changedRange.startLineNumber ||
              editableRange.endLineNumber === changedRange.endLineNumber
            ) {
              columnsCarriedToEnd +=
                editableRange.endColumn - changedRange.startColumn + 1;
            }

            const info = getInfoFrom(change, editableRange);
            restriction.lastInfo = info;
            if (info.isAddition || info.isReplacement) {
              if (info.rangeIsSingleLine) {
                /**
                 * Only Column Change has occurred , so regardless of the position of the change
                 * Addition of noOfCols is enough
                 */
                if (noOfLinesAdded === 0) {
                  finalColumn += noOfColsAddedAtLastLine;
                } else {
                  finalLine += noOfLinesAdded;
                  if (info.startColumnOfRange) {
                    finalColumn += noOfColsAddedAtLastLine;
                  } else if (info.endColumnOfRange) {
                    finalColumn = noOfColsAddedAtLastLine + 1;
                  } else {
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
                  } else {
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
                } else {
                  finalLine -= lineDiffInRange;
                }
              }
            }
            updateRange(
              restriction,
              editableRange,
              finalLine,
              finalColumn,
              changes,
              changeIndex,
              rangeMap,
              restrictions,
              model
            );
          });
          const values = model.getValueInEditableRanges(restrictions);
          const currentlyEditedRanges: { [key: string]: string } = {};
          // const currentlyEditedRanges: IModelContentChange[] = [];
          for (let key in rangeMap) {
            const restriction = rangeMap[key];
            const range = restriction.range;
            const rangeString = restriction.label || range.toString();
            const value = values[rangeString];
            if (isChangeInvalidAsPerUser(restriction, value, range)) {
              setAllRangesToPrev(rangeMap);
              doUndo(model);
              return; // Breaks the loop and prevents the triggerChangeListener
            }
            currentlyEditedRanges[rangeString] = value;
          }
          if (model._hasHighlight) {
            model._oldDecorationsSource.forEach(function (object) {
              object.range = model.getDecorationRange(object.id) as Range;
            });
          }
          triggerChangeListenersWith(
            currentlyEditedRanges,
            values,
            restrictions,
            model
          );
        } else {
          doUndo(model);
        }
      } else if (model.editInRestrictedArea) {
        model._isRestrictedValueValid = false;
      }
    }
  );
  window.onerror = handleUnhandledPromiseRejection;
  const exposedApi = {
    editInRestrictedArea: false,
    getCurrentEditableRanges: () => getCurrentEditableRanges(restrictions),
    getValueInEditableRanges: () =>
      getValueInEditableRanges(model, restrictions),
    disposeRestrictions: () => disposeRestrictions(model),
    onDidChangeContentInEditableRange: (
      callback: _EditableRangeChangeListener
    ) => addEditableRangeListener(callback, model),
    updateRestrictions,
    updateValueInEditableRanges: (
      labelValuesDict: { [label: string]: string },
      forceMoveMarkers: boolean
    ) =>
      updateValueInEditableRanges(
        labelValuesDict,
        forceMoveMarkers,
        restrictions,
        model
      ),
    toggleHighlightOfEditableAreas: (cssClasses: {
      cssClassForSingleLine?: string;
      cssClassForMultiLine?: string;
    }) => toggleHighlightOfEditableAreas(cssClasses, restrictions, model),
  };
  for (let funcName in manipulatorApi) {
    Object.defineProperty(model, funcName, {
      enumerable: false,
      configurable: true,
      writable: true,
      value: manipulatorApi[funcName as keyof typeof manipulatorApi],
    });
  }
  for (let apiName in exposedApi) {
    Object.defineProperty(model, apiName, {
      enumerable: false,
      configurable: true,
      writable: true,
      value: exposedApi[apiName as keyof typeof exposedApi],
    });
  }
  return model;
};
export default constrainedModel;
