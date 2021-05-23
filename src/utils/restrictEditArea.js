export default function restrictEditArea (model, ranges, rangeConstructor) {
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
  model._internalUndo = false;
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
    if (!(isUndoing && model._internalUndo)) {
      const doUndo = function () {
        return Promise.resolve().then(function () {
          model._internalUndo = true;
          model.undo();
          model._internalUndo = false;
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

      if (isAllChangesValid) {
        changes.forEach(function (change, changeIndex) {
          const editedRange = change.range;
          const rangeAsString = editedRange.toString();
          const restriction = rangeMap[rangeAsString];
          const range = restriction.range;
          if (restriction.allowMultiline) {
            const lineDiffInRange = editedRange.endLineNumber - editedRange.startLineNumber;
            let finalLine = range.endLineNumber;
            let finalColumn = range.endColumn;
            let text = change.text || '';
            if (text !== '') {
              finalLine -= lineDiffInRange;
              if (lineDiffInRange > 0 && editedRange.endLineNumber === range.endLineNumber) {
                finalColumn = editedRange.startColumn + range.endColumn - editedRange.endColumn;
              }
              const match = text.match(/\n/g);
              let noOfLinesAdded = match ? match.length : 0;
              let noOfColumnAdded = text.split(/\n/g).pop().length;
              finalLine += noOfLinesAdded;
              if (editedRange.endLineNumber === range.endLineNumber) {
                if (noOfLinesAdded > 0) {
                  finalColumn = 0;
                }
                finalColumn += (noOfColumnAdded + 1);
              }
              if (range.startLineNumber < range.endLineNumber || range.startColumn < range.endColumn) {
                finalLine -= lineDiffInRange;
                if (editedRange.endLineNumber === range.endLineNumber) {
                  finalColumn = editedRange.startColumn + range.endColumn - editedRange.endColumn;
                }
              }
            } else {
              if (range.startLineNumber < range.endLineNumber || range.startColumn < range.endColumn) {
                finalLine -= lineDiffInRange;
                if (editedRange.endLineNumber === range.endLineNumber) {
                  const diffInColumn = range.endColumn - editedRange.endColumn;
                  finalColumn = editedRange.startColumn + (diffInColumn === 0 ? 0 : diffInColumn);
                }
              }
            }
            updateRange(restriction, range, finalLine, finalColumn, changes, changeIndex);
          } else {
            const changesToAddToColumn = (change.rangeLength * -1) + change.text.length;
            let finalLine = range.endLineNumber;
            let finalColumn = range.endColumn + changesToAddToColumn;
            updateRange(restriction, range, finalLine, finalColumn, changes, changeIndex);
          }
        });
      } else {
        doUndo();
      }
    }
  });
  model.getValueInEditableRange = function () {
    return restrictions.reduce(function (acc, restriction) {
      acc[restriction.label] = model.getValueInRange(restriction.range);
      return acc;
    }, {});
  }
  model.disposeRestrictions = function () {
    delete model._restrictedModel;
    delete model._internalUndo;
    delete model._isCursorAtCheckPoint;
    delete model._currentCursorPositions;
    model._restrictionChangeListener.dispose();
    delete model._restrictionChangeListener;
    delete model.disposeRestrictions;
    delete model.getValueInEditableRange;
    return model;
  }
  return model;
}