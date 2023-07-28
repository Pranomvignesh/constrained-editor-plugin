import * as monaco_editor_namespace from "monaco-editor";
import enums from "./utils/enums.js";
type TextModel = monaco_editor_namespace.editor.ITextModel;
type Range = monaco_editor_namespace.Range;
export type _EditableRangeChangeListener = (currentChanges: {
    [key: string]: string;
}, allChanges: {
    [key: string]: string;
}, currentRanges: {
    [key: string]: {
        allowMultiline: boolean;
        index: number;
        range: monaco_editor_namespace.Range;
        originalRange: number[];
    };
}) => void;
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
        className: (typeof enums)["MULTI_LINE_HIGHLIGHT_CLASS"] | (typeof enums)["SINGLE_LINE_HIGHLIGHT_CLASS"];
    };
};
type OldDecorationSource = {
    range: Range;
    options: {
        className: string;
    };
    hoverMessage?: string;
    id: string;
};
export type ManipulatorApi = {
    _isRestrictedModel: boolean;
    _isRestrictedValueValid: boolean;
    _editableRangeChangeListener: _EditableRangeChangeListener[];
    _restrictionChangeListener: null | monaco_editor_namespace.IDisposable;
    _isCursorAtCheckPoint: (positions: {
        lineNumber: number;
        column: number;
    }[], restrictions: Restriction[]) => void;
    _currentCursorPositions: [];
};
export type ConstrainedModel = TextModel & {
    _isRestrictedModel: boolean;
    _isRestrictedValueValid: boolean;
    _editableRangeChangeListener: _EditableRangeChangeListener[];
    _isCursorAtCheckPoint: (positions: {
        lineNumber: number;
        column: number;
    }[]) => void;
    _currentCursorPositions: monaco_editor_namespace.Selection[];
    _restrictionChangeListener: monaco_editor_namespace.IDisposable;
    _oldDecorations: string[];
    _oldDecorationsSource: OldDecorationSource[];
    _hasHighlight: boolean;
    editInRestrictedArea: boolean;
    disposeRestrictions: () => ConstrainedModel;
    getValueInEditableRanges: (restrictions: Restriction[]) => {
        [key: string]: string;
    };
    updateValueInEditableRanges: (object: any, forceMoveMarkers: boolean | undefined, restrictions: Restriction[]) => void;
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
export type ValidateCB = (currentlyTypedValue: string, newRange: [startLine: number, startColumn: number, endLine: number, endColumn: number], info: Info) => boolean;
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
export type IModelContentChange = monaco_editor_namespace.editor.IModelContentChange;
export declare const constrainedModel: (model: ConstrainedModel, ranges: RestrictionArgs[], monaco: typeof monaco_editor_namespace) => ConstrainedModel;
export default constrainedModel;
