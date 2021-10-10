import React from 'react';
import clsx from 'clsx';
import styles from './PlaygroundComponent.module.css';
import * as monaco from 'monaco-editor';
import * as constrainedEditorPlugin from 'constrained-editor-plugin';

export default class PlaygroundComponent extends React.Component {
  constructor(props) {
    super(props);
    this.monacoContainer = React.createRef();
  }
  componentWillMount() {
    window.MonacoEnvironment = {
      getWorkerUrl: function (_moduleId, label) {
        if (label === 'json') {
          return './json.worker.bundle.js';
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
          return './css.worker.bundle.js';
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
          return './html.worker.bundle.js';
        }
        if (label === 'typescript' || label === 'javascript') {
          return './ts.worker.bundle.js';
        }
        return './editor.worker.bundle.js';
      }
    };
  }
  componentDidMount() {
    const editorInstance = monaco.editor.create(this.monacoContainer.current, {
      value: [
        'const utils = {};',
        'function addKeysToUtils(){',
        '',
        '}',
        'addKeysToUtils();'
      ].join('\n'),
      language: 'javascript'
    });
    console.log(constrainedEditorPlugin);
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
            <p>Toggle Highlight</p>
            <p>Current Values</p>
          </div>
        </div>
      </section>
    );
  }
}