# Table of contents <!-- omit in toc -->

- [Intro](#intro)
- [What's new?](#whats-new)
- [Demo - click here](#demo---click-here)
- [Instructions](#instructions)
  - [Fallback Content](#fallback-content)
  - [ID](#id)
- [Under the hood](#under-the-hood)
  - [Future ideas](#future-ideas)

## Intro

This post is continuation of the previous post, which you can see here
{% post https://dev.to/pranomvignesh/restrict-editable-area-in-monaco-editor-4hac %}

## What's new?

This time granular editing is made possible by giving set of instructions to the script, which then creates a regex in runtime to validate the output

Process is simple; if regex is matched , output will be left as such, if not then content will be set to its previous state (undo operation)

## Demo - [click here](https://monaco-editor-restrict-editable-area.vercel.app/)

![Demo of Playground](https://dev-to-uploads.s3.amazonaws.com/i/ilsfii9hbffze6oowtf3.gif)

## Instructions

There are 2 types of instructions that can provided to the script
- editableArea - space defined to edit a portion of single line
- multiLineEditableArea  - space defined to edit multiple lines

### Fallback Content

This content can be given as so that when the output is rendered default content will be present in place of the editable area comment

eg : `/* editableArea=fallbackContent */`

### ID

This id can be used to reference the output and whenever the editor content changes, a mapping object is generated

eg : `/* editableArea#id */`

This fallback content and id is applicable for both single line and multiline editable

Thus, places other than the editable area are not allowed to be edited by the user

## Under the hood

```javascript
function restrictEditArea (value) {
    const editable = (() => {
        const regexObjects = {};
        const labels = [];
        const generateRegexUsing = (label, consumeSpace = false) => new RegExp((consumeSpace?"\\^\\s*":"")+"\\/\\*\\s*(" + label + ")(#([^#]+?))?\\s*(=\\s*(.+?))?\\s*\\*\\/"+(consumeSpace?"\\s*\\$"+"\\"+"\\n":""), "g")
        return {
            add: (name, label, regexReplacer, { consumeSpace } = {}) => {
                regexObjects[name] = {
                    valueRegex : generateRegexUsing(label),
                    regex: generateRegexUsing(label, consumeSpace),
                    idIndex: 3,
                    fallbackContentIndex: 5,
                    regexReplacer: regexReplacer
                }
                labels.indexOf(label) === -1 && labels.push(label);
                return regexObjects[name];
            },
            getAll: () => regexObjects,
            getIdReplacerRegex: () => generateRegexUsing(labels.join('|'))
        }
    })();
    editable.add('singleLine', 'editableArea', '(.*?)')
    editable.add('multiLine', 'multiLineEditableArea', '(^.*?$\\n)*', { consumeSpace: true })
    const generateRegexFromValue = (string, {
        singleLine,
        multiLine
    }, idReplacer) => {
        let valueToSet = string;
        let regexString = string;
        let map = {};
        let matchCount = 0;
        const regexFor = {
            brackets: /(\(|\)|\{|\}|\[|\])/g,
            newLine: /\n/g,
            blankSpace: /\s/g
        }
        valueToSet = valueToSet.replace(singleLine.valueRegex, "$" + singleLine.fallbackContentIndex)
        valueToSet = valueToSet.replace(multiLine.valueRegex, "$" + multiLine.fallbackContentIndex)
        regexString = regexString.replace(regexFor.brackets, '\\$1'); //! This order matters
        regexString = '^'+regexString.split(regexFor.newLine).join('$\\n^')+'$';
        regexString = regexString.replace(singleLine.regex, singleLine.regexReplacer)
        regexString = regexString.replace(multiLine.regex, multiLine.regexReplacer)
        string.replace(idReplacer, function (...matches) {
            map[matchCount++] = matches[3];
        })
        return {
            valueToSet: valueToSet,
            regexForValidation: new RegExp(regexString, 'm'),
            map: map
        }
    }
    return generateRegexFromValue(value, editable.getAll(), editable.getIdReplacerRegex())
}
```

This can be a workaround to solve this issue
{% github https://github.com/microsoft/monaco-editor/issues/953 %}

### Future ideas

Will try to publish this as an npm package so that it will be accessible for everyone
