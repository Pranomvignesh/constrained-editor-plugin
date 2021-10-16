import React from 'react';
import Link from '@docusaurus/Link';
import styles from './AboutComponent.module.css';
import CodeBlock from '@theme/CodeBlock';


export default function AboutComponent() {
  const command = 'npm i constrained-editor-plugin';
  return (
    <>
      <section className={styles.section}>
        <div className={styles.installation}>
          <h2>Installation Command</h2>
          <CodeBlock className="language-shell">{command}</CodeBlock>
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.about}>
          <h2>About this Plugin</h2>
          <p>
            <Link to="https://microsoft.github.io/monaco-editor/">Monaco Editor</Link> is one of the most popular code editors in the market. It is developed by <Link to="https://www.microsoft.com/en-in" >Microsoft.</Link>
            <br />
            The Monaco Editor is the code editor that powers <Link to="https://github.com/Microsoft/vscode">VS Code.</Link>
            Although it is packed with lot of features, it didn't have the feature to constrain the editable area.
            <br />
            This plugin attempts to solve that issue. Check out the issue raised in monaco-editor issues portal <Link to="https://github.com/microsoft/monaco-editor/issues/953">here</Link>
          </p>
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.about}>
          <h2>Special Features</h2>
          <p>
            Editable Ranges are not static and it can automatically grow and shrink depending on the content.
            <br />
            Along with the ranges, the content inside the editable ranges can also be restricted
          </p>
        </div>
      </section>
    </>
  );
}