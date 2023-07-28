import * as monaco_editor_namespace from "monaco-editor";
import { RestrictionArgs } from "../constrainedModel";
type StandAloneCodeEditor = monaco_editor_namespace.editor.IStandaloneCodeEditor;
type TextModel = monaco_editor_namespace.editor.ITextModel;
declare const validators: {
    initWith: (monaco: typeof monaco_editor_namespace) => {
        isInstanceValid: (valueToValidate: StandAloneCodeEditor) => boolean;
        isModelValid: (valueToValidate: TextModel) => boolean;
        isRangesValid: (ranges: RestrictionArgs[]) => boolean;
    };
};
export default validators;
