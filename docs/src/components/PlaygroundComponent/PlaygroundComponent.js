import React, { useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import clsx from 'clsx';
import styles from './PlaygroundComponent.module.css';
import CodeBlock from '@theme/CodeBlock';

class ActualPlaygroundComponent extends React.Component {
  constructor(props) {
    super(props);
    this.monaco = require('monaco-editor');
    this.constrainedEditor = require('constrained-editor-plugin');
    this.monacoContainer = React.createRef();
    this.state = {
      values: {}
    };
  }
  componentWillMount() {
    const baseDir = '/node_modules/monaco-editor/esm/vs/';
    window.MonacoEnvironment = {
      getWorkerUrl: function (_moduleId, label) {
        if (label === 'json') {
          return baseDir + 'language/json/json.worker.js';
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
          return baseDir + 'language/css/css.worker.js';
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
          return baseDir + 'language/html/html.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
          return baseDir + 'language/typescript/ts.worker.js';
        }
        return baseDir + 'editor/editor.worker.js';
      }
    };
  }
  componentDidMount() {
    this.editorInstance = this.monaco.editor.create(this.monacoContainer.current, {
      value: [
        'const utils = {};',
        'function addKeysToUtils(){',
        '// Enter the content for the function here',
        '}',
        'addKeysToUtils();'
      ].join('\n'),
      language: 'javascript'
    });
    this.constrainedInstance = this.constrainedEditor.default(this.monaco);
    this.constrainedInstance.initializeIn(this.editorInstance);
    this.model = this.editorInstance.getModel();
    this.model = this.constrainedInstance.addRestrictionsTo(this.model, [
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
        range: [3, 1, 3, 43], // Range of Function definition
        allowMultiline: true,
        label: 'funcDefinition'
      }
    ]);
    this.model.onDidChangeContentInEditableRange(function (currentlyEdited, allEdited, ranges) {
      this.setState({
        values: allEdited
      })
    }.bind(this));
    this.setState({
      values: this.model.getValueInEditableRanges()
    })
    window.onresize = function () {
      this.editorInstance.layout()
    }.bind(this);
  }

  showEditableArea() {
    this.model.toggleHighlightOfEditableAreas();
  }
  toggleDevMode(){
    this.constrainedInstance.toggleDevMode();
  }
  render() {
    return (
      <section className={styles.section}>
        <h1>Playground</h1>
        <div className={styles.container}>
          <div ref={this.monacoContainer} className={clsx('monaco', styles.editor)}>
          </div>
          <div className={styles.switches}>
            <h2>Toolkit</h2>
            <div className={styles.highlightAreas}>
              <label>Highlight Editable Areas</label>
              <input type="checkbox" onClick={() => this.showEditableArea.call(this)} />
            </div>
            <div className={styles.highlightAreas}>
              <label>Toggle Dev Mode</label>
              <input type="checkbox" onClick={() => this.toggleDevMode.call(this)} />
            </div>
            <hr />
            <div>
              <h2>Values in Editable Ranges</h2>
              <div className={styles.currentValues}>
                {Object.keys(this.state.values).map(label => (
                  <div className={styles.rangeContainer}>
                    <div><b><i>Label : </i></b>
                      {label}
                    </div>
                    <div><b><i>Value : </i></b>
                      {/* <pre><code>{this.state.values[label]}</code></pre> */}
                      <CodeBlock className="language-js" >{this.state.values[label]}</CodeBlock>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section >
    )
  }
}

export default class PlaygroundComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      values: {}
    };
  }
  // componentWillMount() {
  //   const baseDir = '/node_modules/monaco-editor/esm/vs/';
  //   window.MonacoEnvironment = {
  //     getWorkerUrl: function (_moduleId, label) {
  //       if (label === 'json') {
  //         return baseDir + 'language/json/json.worker.js';
  //       }
  //       if (label === 'css' || label === 'scss' || label === 'less') {
  //         return baseDir + 'language/css/css.worker.js';
  //       }
  //       if (label === 'html' || label === 'handlebars' || label === 'razor') {
  //         return baseDir + 'language/html/html.worker.js';
  //       }
  //       if (label === 'typescript' || label === 'javascript') {
  //         return baseDir + 'language/typescript/ts.worker.js';
  //       }
  //       return baseDir + 'editor/editor.worker.js';
  //     }
  //   };
  // }
  // componentDidMount() {
  //   this.editorInstance = monaco.editor.create(this.monacoContainer.current, {
  //     value: [
  //       'const utils = {};',
  //       'function addKeysToUtils(){',
  //       '// Enter the content for the function here',
  //       '}',
  //       'addKeysToUtils();'
  //     ].join('\n'),
  //     language: 'javascript'
  //   });
  //   const constrainedInstance = constrainedEditor(monaco);
  //   constrainedInstance.initializeIn(this.editorInstance);
  //   this.model = this.editorInstance.getModel();
  //   this.model = constrainedInstance.addRestrictionsTo(this.model, [
  //     {
  //       range: [1, 7, 1, 12], // Range of Util Variable name
  //       label: 'utilName',
  //       validate: function (currentlyTypedValue, newRange, info) {
  //         // console.log({ currentlyTypedValue });
  //         const noSpaceAndSpecialChars = /^[a-z0-9A-Z]*$/;
  //         return noSpaceAndSpecialChars.test(currentlyTypedValue);
  //       }
  //     },
  //     {
  //       range: [3, 1, 3, 43], // Range of Function definition
  //       allowMultiline: true,
  //       label: 'funcDefinition'
  //     }
  //   ]);
  //   this.model.onDidChangeContentInEditableRange(function (currentlyEdited, allEdited, ranges) {
  //     this.setState({
  //       values: allEdited
  //     })
  //   }.bind(this));
  //   this.setState({
  //     values: this.model.getValueInEditableRanges()
  //   })
  //   window.onresize = function () {
  //     this.editorInstance.layout()
  //   }.bind(this);
  // }

  showEditableArea() {
    this.model.toggleHighlightOfEditableAreas();
  }

  render() {
    return (
      <BrowserOnly>
        {function () {
          // console.log(monaco, constrainedEditor);
          // console.log(this);
          // console.log(this.monacoContainer);
          // const baseDir = '/node_modules/monaco-editor/esm/vs/';
          // window.MonacoEnvironment = {
          //   getWorkerUrl: function (_moduleId, label) {
          //     if (label === 'json') {
          //       return baseDir + 'language/json/json.worker.js';
          //     }
          //     if (label === 'css' || label === 'scss' || label === 'less') {
          //       return baseDir + 'language/css/css.worker.js';
          //     }
          //     if (label === 'html' || label === 'handlebars' || label === 'razor') {
          //       return baseDir + 'language/html/html.worker.js';
          //     }
          //     if (label === 'typescript' || label === 'javascript') {
          //       return baseDir + 'language/typescript/ts.worker.js';
          //     }
          //     return baseDir + 'editor/editor.worker.js';
          //   }
          // };
          // this.editorInstance = monaco.editor.create(this.monacoContainer.current, {
          //   value: [
          //     'const utils = {};',
          //     'function addKeysToUtils(){',
          //     '// Enter the content for the function here',
          //     '}',
          //     'addKeysToUtils();'
          //   ].join('\n'),
          //   language: 'javascript'
          // });
          // const constrainedInstance = constrainedEditor(monaco);
          // constrainedInstance.initializeIn(this.editorInstance);
          // this.model = this.editorInstance.getModel();
          // this.model = constrainedInstance.addRestrictionsTo(this.model, [
          //   {
          //     range: [1, 7, 1, 12], // Range of Util Variable name
          //     label: 'utilName',
          //     validate: function (currentlyTypedValue, newRange, info) {
          //       // console.log({ currentlyTypedValue });
          //       const noSpaceAndSpecialChars = /^[a-z0-9A-Z]*$/;
          //       return noSpaceAndSpecialChars.test(currentlyTypedValue);
          //     }
          //   },
          //   {
          //     range: [3, 1, 3, 43], // Range of Function definition
          //     allowMultiline: true,
          //     label: 'funcDefinition'
          //   }
          // ]);
          // this.model.onDidChangeContentInEditableRange(function (currentlyEdited, allEdited, ranges) {
          //   this.setState({
          //     values: allEdited
          //   })
          // }.bind(this));
          // this.setState({
          //   values: this.model.getValueInEditableRanges()
          // })
          // window.onresize = function () {
          //   this.editorInstance.layout()
          // }.bind(this);
          return <ActualPlaygroundComponent></ActualPlaygroundComponent>
          // return (
          //   <section className={styles.section}>
          //     <h1>Playground</h1>
          //     <div className={styles.container}>
          //       <div ref={this.monacoContainer} className={clsx('monaco', styles.editor)}>
          //       </div>
          //       <div className={styles.switches}>
          //         <h2>Toolkit</h2>
          //         <div className={styles.highlightAreas}>
          //           <label>Highlight Editable Areas</label>
          //           <input type="checkbox" onClick={() => this.showEditableArea.call(this)} />
          //         </div>
          //         <hr />
          //         <div>
          //           <h2>Values in Editable Ranges</h2>
          //           <div className={styles.currentValues}>
          //             {Object.keys(this.state.values).map(label => (
          //               <div className={styles.rangeContainer}>
          //                 <div><b><i>Label :</i></b>
          //                   {label}
          //                 </div>
          //                 <div><b><i>Value :</i></b>
          //                   {/* <pre><code>{this.state.values[label]}</code></pre> */}
          //                   <CodeBlock title="/src/myComponent" className="language-js" >{this.state.values[label]}</CodeBlock>
          //                 </div>
          //               </div>
          //             ))}
          //           </div>
          //         </div>
          //       </div>
          //     </div>
          //   </section >
          // )
        }.bind(this)}
      </BrowserOnly>
    );
  }
}