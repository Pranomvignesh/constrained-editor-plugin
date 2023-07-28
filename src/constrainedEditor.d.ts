import * as monaco_editor_namespace from "monaco-editor";
import { ConstrainedModel, RestrictionArgs } from "./constrainedModel";
type StandAloneCodeEditor = monaco_editor_namespace.editor.IStandaloneCodeEditor;
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
declare const listenerFn: (editorInstance: ExtendEditorInstance) => void;
export declare function constrainedEditor(monaco: typeof monaco_editor_namespace): Readonly<ManipulatorAPI>;
export default constrainedEditor;
