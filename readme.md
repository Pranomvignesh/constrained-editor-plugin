# Constrained Editor Plugin <!-- omit in toc -->

A Plugin which adds restrictions to the model of monaco-editor, so that only some parts of the code are editable and rest will become read-only. Please click here for [Demo](https://constrained-editor-plugin.vercel.app/playground) and click here for [Documentation](https://constrained-editor-plugin.vercel.app/)

## Stats <!-- omit in toc -->

<a href="https://github.com/Pranomvignesh/constrained-editor-plugin/issues">
<img  src="https://img.shields.io/github/issues/Pranomvignesh/constrained-editor-plugin?style=for-the-badge"/></a>

<a href="https://github.com/Pranomvignesh/constrained-editor-plugin/stargazers">
<img  src="https://img.shields.io/github/stars/Pranomvignesh/constrained-editor-plugin?style=for-the-badge"></a>


[![CodeQL](https://github.com/Pranomvignesh/constrained-editor-plugin/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/Pranomvignesh/constrained-editor-plugin/actions/workflows/codeql-analysis.yml)

## Table of Contents <!-- omit in toc -->

- [Demo](#demo)
- [How to install using NPM](#how-to-install-using-npm)
- [Problem Statement](#problem-statement)
- [Sample code](#sample-code)
- [Walkthrough of Sample code](#walkthrough-of-sample-code)
- [Potential Applications](#potential-applications)
  - [Coding Tutorial Applications](#coding-tutorial-applications)
  - [Interviewing applications](#interviewing-applications)
- [Contributions and Issues](#contributions-and-issues)
- [License](#license)

## Demo

https://user-images.githubusercontent.com/29809906/140050216-893552e3-f26d-4890-8650-21d83637cf06.mov


## How to install using NPM

```bash
npm i constrained-editor-plugin
```

## Problem Statement

[Monaco Editor](https://microsoft.github.io/monaco-editor/) is one of the most popular code editors in the market. It is developed by [Microsoft](https://www.microsoft.com/en-in).The Monaco Editor is the code editor that powers [VS Code](https://github.com/Microsoft/vscode). Although it is packed with lot of features, it didn't have the feature to constrain the editable area, which is to basically allow editing in only certain parts of the content.

This plugin solves this issue, and will help you add that functionality into your monaco editor instance, without any performance issues.

## Sample code

```javascript
// Include constrainedEditorPlugin.js in your html.
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

## Walkthrough of Sample code

- `constrainedEditor` is the globally available class to create an instance of the `ConstrainedEditor`. This instance has to be created by sending in the `monaco` variable as an argument.

- `constrainedEditor.initializeIn(editorInstance)` is where the constrained editor will add the necessary functions into the editor instance. The Editor returned by the monaco editor during the monaco.editor.create() call should be sent here.
  
- `constrainedEditor.addRestrictionsTo(model,restrictions)` is where the constrained editor will add restrictions to the model. 

> For detailed documentation on available APIs, [click here](https://constrained-editor-plugin.vercel.app/docs/AvailableAPI/constrained-editor-instance-api)

## Potential Applications

### Coding Tutorial Applications

This plugin can be used in applications which teach programming tutorials, where the application can be made in such as way that it allows users to edit in only certain places

### Interviewing applications

This can be used to prevent the candidate to accidentally mess up the boilerplate code given to them.


## Contributions and Issues 

This project is open source and you are welcome to add more features to this plugin.

If your find any issue, please raise it [here](https://github.com/Pranomvignesh/constrained-editor-plugin/issues)

## License
Licensed under the MIT License.
