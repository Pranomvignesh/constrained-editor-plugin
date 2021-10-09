require.config({ paths: { vs: '../node_modules/monaco-editor/dev/vs' } });
require(['vs/editor/editor.main'], function () {
  const container = document.getElementById('container')
  const editorInstance = monaco.editor.create(container, {
    value: [
      'const utils = {};',
      'function addKeysToUtils(){',
      '',
      '}',
      'addKeysToUtils();'
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
      range: [1, 7, 1, 12], // Range of Util Variable name
      label: 'utilName',
      validate: function (currentlyTypedValue, newRange, info) {
        // console.log({ currentlyTypedValue });
        const noSpaceAndSpecialChars = /^[a-z0-9A-Z]*$/;
        return noSpaceAndSpecialChars.test(currentlyTypedValue);
      }
    },
    {
      range: [3, 1, 3, 1], // Range of Function definition
      allowMultiline: true,
      label: 'funcDefinition'
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
      // console.table(values);
    }, 0);
  })

  // Demo Purpose
  container.addEventListener('keydown', function (event) {
    console.log('Pressed Key: ', event.key);
  });
});