export default function restrictEditArea (model, ranges, rangeConstructor, instance) {
  const restrictions = ranges.slice();
  const sortRangesInAscendingOrder = function (rangeObject1, rangeObject2) {
    const rangeA = rangeObject1.range;
    const rangeB = rangeObject2.range;
    if (
      rangeA[0] < rangeB[0] ||
      (rangeA[0] === rangeB[0] && rangeA[3] < rangeB[1])
    ) {
      return 1;
    }
  }
  restrictions.forEach(function (restriction, index) {
    const range = restriction.range;
    const startLine = range[0];
    const startCol = range[1];
    const endLine = range[2];
    const endCol = range[3];
    restriction._originalRange = range.slice();
    restriction.range = new rangeConstructor(startLine, startCol, endLine, endCol);
    restriction.index = index;
    if (!restriction.allowMultiline) {
      restriction.allowMultiline = rangeConstructor.spansMultipleLines(restriction.range)
    }
    if (!restriction.label) {
      restriction.label = `[${startLine},${startCol} -> ${endLine}${endCol}]`;
    }
  });
  model._restrictedModel = true;
  model.editInReadOnlyArea = false;
  model._isCursorAtCheckPoint = function (positions) {
    positions.some(function (position) {
      const posLineNumber = position.lineNumber;
      const posCol = position.column;
      const length = restrictions.length;
      for (let i = 0; i < length; i++) {
        const range = restrictions[i].range;
        if (
          (range.startLineNumber === posLineNumber && range.startColumn === posCol) ||
          (range.endLineNumber === posLineNumber && range.endColumn === posCol)
        ) {
          model.pushStackElement();
          return true;
        }
      }
    });
  };
  model._restrictionChangeListener = model.onDidChangeContent(function (contentChangedEvent) {
    const isUndoing = contentChangedEvent.isUndoing;
    if (!(isUndoing && model.editInReadOnlyArea)) {
      const doUndo = function () {
        return Promise.resolve().then(function () {
          model.editInReadOnlyArea = true;
          model.undo();
          model.editInReadOnlyArea = false;
        });
      };
      const updateRange = function (restriction, range, finalLine, finalColumn, changes, changeIndex) {
        let oldRangeEndLineNumber = range.endLineNumber;
        let oldRangeEndColumn = range.endColumn;
        restriction.range = range.setEndPosition(finalLine, finalColumn);
        const length = restrictions.length;
        let changesLength = changes.length;
        const diffInCol = finalColumn - oldRangeEndColumn;
        const diffInRow = finalLine - oldRangeEndLineNumber;

        const cursorPositions = model._currentCursorPositions;
        const noOfCursorPositions = cursorPositions.length;
        if (changesLength !== noOfCursorPositions) {
          changes = changes.filter(function (change) {
            const range = change.range;
            for (let i = 0; i < noOfCursorPositions; i++) {
              const cursorPosition = cursorPositions[i];
              if (
                (range.startLineNumber === cursorPosition.startLineNumber) &&
                (range.endLineNumber === cursorPosition.endLineNumber) &&
                (range.startColumn === cursorPosition.startColumn) &&
                (range.endColumn === cursorPosition.endColumn)
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
            const nextRange = nextRestriction.range;
            if (oldRangeEndLineNumber === nextRange.startLineNumber) {
              nextRange.startColumn += diffInCol;
            }
            if (oldRangeEndLineNumber === nextRange.endLineNumber) {
              nextRange.endColumn += diffInCol;
            }
            nextRange.startLineNumber += diffInRow;
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
              rangeInChange.startColumn += diffInCol;
            }
            if (oldRangeEndLineNumber === rangeInChange.endLineNumber) {
              rangeInChange.endColumn += diffInCol;
            }
            rangeInChange.startLineNumber += diffInRow;
            rangeInChange.endLineNumber += diffInRow;
            nextChange.range = rangeInChange;
            rangeMap[rangeInChange.toString()] = rangeMapValue;
          }
        } else {
          // Only Column might have changed
          for (let i = restriction.index + 1; i < length; i++) {
            const nextRestriction = restrictions[i];
            const nextRange = nextRestriction.range;
            if (nextRange.startLineNumber > oldRangeEndLineNumber) {
              break;
            } else {
              nextRange.startColumn += diffInCol;
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
              rangeInChange.startColumn += diffInCol;
              rangeInChange.endColumn += diffInCol;
              nextChange.range = rangeInChange;
              rangeMap[rangeInChange.toString()] = rangeMapValue;
            }
          }
        }
      }
      const changes = contentChangedEvent.changes.sort(sortRangesInAscendingOrder);
      const rangeMap = {};
      const length = restrictions.length;
      const isAllChangesValid = changes.every(function (change) {
        const editedRange = change.range;
        const rangeAsString = editedRange.toString();
        rangeMap[rangeAsString] = null;
        for (let i = 0; i < length; i++) {
          const restriction = restrictions[i];
          const range = restriction.range;
          if (range.containsRange(editedRange)) {
            if (!restriction.allowMultiline && change.text.includes('\n')) {
              return false;
            }
            rangeMap[rangeAsString] = restriction;
            return true;
          }
        }
        return false;
      })
      const getInfoFrom = function (change, editableRange) {
        const info = {};
        const range = change.range;
        // Get State
        if (change.text === '') {
          info.isDeletion = true;
        } else if (
          (range.startLineNumber === range.endLineNumber) &&
          (range.startColumn === range.endColumn)
        ) {
          info.isAddition = true;
        } else {
          info.isReplacement = true;
        }
        // Get Position Of Range
        info.startLineOfRange = range.startLineNumber === editableRange.startLineNumber;
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
      }
      if (isAllChangesValid) {
        changes.forEach(function (change, changeIndex) {
          const changedRange = change.range;
          const restriction = rangeMap[changedRange.toString()];
          const editableRange = restriction.range;
          const text = change.text || '';
          /**
           * Things to check before implementing the change
           * - A | D | R => Addition | Deletion | Replacement
           * - MC | SC => MultiLineChange | SingleLineChange
           * - SOR | MOR | EOR => Change Occured in - Start Of Range | Middle Of Range | End Of Range
           * - SSL | SML => Editable Range - Spans Single Line | Spans Multiple Line
           */
          const noOfLinesAdded = (text.match(/\n/g) || []).length;
          const noOfColsAddedAtLastLine = text.split(/\n/g).pop().length;

          const lineDiffInRange = changedRange.endLineNumber - changedRange.startLineNumber;
          const colDiffInRange = changedRange.endColumn - changedRange.startColumn;

          let finalLine = editableRange.endLineNumber;
          let finalColumn = editableRange.endColumn;

          let columnsCarriedToEnd = 0;
          if (
            (editableRange.endLineNumber === changedRange.startLineNumber) ||
            (editableRange.endLineNumber === changedRange.endLineNumber)
          ) {
            columnsCarriedToEnd += (editableRange.endColumn - changedRange.startColumn) + 1;
          }

          const info = getInfoFrom(change, editableRange);
          if (info.isAddition || info.isReplacement) {
            if (info.rangeIsSingleLine) {
              /**
               * Only Column Change has occured , so regardless of the position of the change
               * Addition of noOfCols is enough
               */
              if (noOfLinesAdded === 0) {
                finalColumn += noOfColsAddedAtLastLine;
              } else {
                finalLine += noOfLinesAdded;
                if (info.startColumnOfRange) {
                  finalColumn += noOfColsAddedAtLastLine
                } else if (info.endColumnOfRange) {
                  finalColumn = (noOfColsAddedAtLastLine + 1)
                } else {
                  finalColumn = (noOfColsAddedAtLastLine + columnsCarriedToEnd)
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
                  finalColumn = (columnsCarriedToEnd + noOfColsAddedAtLastLine);
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
          updateRange(restriction, editableRange, finalLine, finalColumn, changes, changeIndex);
        })
      } else {
        doUndo();
      }
    }
    // model._updateHighlight();
  });
  model._getCurrentRanges = function () {
    return restrictions.reduce(function (acc, restriction) {
      acc[restriction.label] = restriction.range;
      return acc;
    }, {});
  }
  model.getValueInEditableRange = function () {
    return restrictions.reduce(function (acc, restriction) {
      acc[restriction.label] = model.getValueInRange(restriction.range);
      return acc;
    }, {});
  }
  model.disposeRestrictions = function () {
    delete model._restrictedModel;
    delete model.editInReadOnlyArea;
    delete model._isCursorAtCheckPoint;
    delete model._currentCursorPositions;
    delete model._getCurrentRanges;
    model._restrictionChangeListener.dispose();
    delete model._restrictionChangeListener;
    delete model.disposeRestrictions;
    delete model.getValueInEditableRange;
    return model;
  }
  return model;
}