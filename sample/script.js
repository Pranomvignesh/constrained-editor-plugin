require.config({ paths: { vs: '../node_modules/monaco-editor/dev/vs' } });

require(['vs/editor/editor.main'], function () {
  const editorInstance = monaco.editor.create(document.getElementById('container'), {
    value: [
      '123'
    ].join('\n'),
    language: 'javascript'
  });
  const model = editorInstance.getModel();
  /**
   * Configuration for the Restricted Editor : Starts Here
   */
  const instanceOfConstrainedEditor = constrainedEditor(monaco);
  instanceOfConstrainedEditor.initializeIn(editorInstance);
  instanceOfConstrainedEditor.addRestrictionsTo(model, [
    /**
     * range : [ startLine, startColumn, endLine, endColumn ]
    */
    {
      range: [1, 1, 1, 4], // Range of Hello world! String
      allowMultiline: true,
      label: 'nums'
    }
  ]);
  /**
    * Configuration for the Restricted Editor : Ends Here
    */
  model.onDidChangeContent(function () {
    /**
     * This settimeout is added this example purpose, but this may be a better practice
     * As Restricted Editor also hooks the onDidChangeContent callback, 
     * if we add settimeout, it will make sure the values modifications 
     * done by the restricted editor are finished
     */
    setTimeout(function () {
      const values = model.getValueInEditableRanges()
      console.table(values);
    }, 0);
  })

});