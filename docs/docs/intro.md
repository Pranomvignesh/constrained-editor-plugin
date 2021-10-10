---
sidebar_position: 1
---

# Documentation

Let's discover **APIs available in the Constrained Editor Plugin**.

## Getting Started

Get started by **installing the constrained-editor-plugin via npm**. Link is available [here](https://www.npmjs.com/package/constrained-editor-plugin).

```shell
npm install constrained-editor-plugin@latest
```

## Dependencies To Load

Include the below files from the node_modules folder into your html file.

```html
<!-- Optional Dependency -->
<link rel="stylesheet" href="./node_modules/constrained-editor-plugin/constrained-editor-plugin.css">
<!-- Required Dependency -->
<script src="./node_modules/constrained-editor-plugin/constrainedEditorPlugin.js" ></script>
```

## Quick Start

Here, is the sample code for creating and using a monaco editor with constrained editor plugin.

```javascript
require.config({ paths: { vs: '../node_modules/monaco-editor/min/vs' } });
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

  // - Configuration for the Constrained Editor : Starts Here
  const constrainedInstance = constrainedEditor(monaco);
  constrainedInstance.initializeIn(editorInstance);
  constrainedInstance.addRestrictionsTo(model, [{
    // range : [ startLine, startColumn, endLine, endColumn ]
    range: [1, 7, 1, 12], // Range of Util Variable name
    label: 'utilName',
    validate: function (currentlyTypedValue, newRange, info) {
      const noSpaceAndSpecialChars = /^[a-z0-9A-Z]*$/;
      return noSpaceAndSpecialChars.test(currentlyTypedValue);
    }
  }, {
    range: [3, 1, 3, 1], // Range of Function definition
    allowMultiline: true,
    label: 'funcDefinition'
  }]);
  // - Configuration for the Constrained Editor : Ends Here
});
```

## Create Instance

Constrained Editor has to be created after loading the monaco editor into the application.

```javascript
require.config({ paths: { vs: '../node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], function () {
  // ...
  const constrainedInstance = constrainedEditor(monaco);
  // ...
});
```
Here `constrainedEditor` is the global variable which has to used to creating an instance of the plugin.

Monaco has to be sent into during the instance creation, This has to be the global monaco variable which will be available after the monaco is loaded in the application.