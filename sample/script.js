require.config({ paths: { vs: '../node_modules/monaco-editor/min/vs' } });

require(['vs/editor/editor.main'], function () {
  const editorInstance = monaco.editor.create(document.getElementById('container'), {
    value: [
      '123'
    ].join('\n'),
    language: 'javascript'
  });
  const model = editorInstance.getModel();
  const constructorsToInject = {
    range: monaco.Range
  }
  /**
   * Configuration for the Restricted Editor : Starts Here
   */
  const instanceOfRestrictor = restrictor(constructorsToInject);
  instanceOfRestrictor.initializeIn(editorInstance);
  // instanceOfRestrictor.addRestrictionsTo(model, [
  //   /**
  //    * range : [ startLine, startColumn, endLine, endColumn ]
  //   */
  //   {
  //     range: [2, 16, 2, 28], // Range of Hello world! String
  //     label: 'valueInConsoleLog'
  //   }, {
  //     range: [1, 18, 1, 18], // Range of Arguments for Sample Function
  //     label: 'argsOfSampleFn'
  //   }, {
  //     range: [3, 1, 3, 25], // Range of // Type something here
  //     label: 'contentOfSampleFn',
  //     allowMultiline: true
  //   }
  // ]);
  instanceOfRestrictor.addRestrictionsTo(model, [
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
      const values = model.getValueInEditableRange()
      // console.table(values);
    }, 0);
  })

});