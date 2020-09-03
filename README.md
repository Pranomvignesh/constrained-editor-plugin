# Restrict the Editable area in the monaco editor <!-- omit in toc -->


This application shows how we can restrict editing of certain places in monaco editor. To see the demo of Phase 1 [click here](https://restrict-editarea-monaco-editor.vercel.app/). For Phase 2 [click here](https://monaco-editor-restrict-editable-area.vercel.app/)


This might become a solution to this [github issue](https://github.com/Microsoft/monaco-editor/issues/953)


## Table of Contents <!-- omit in toc -->

- [Phase 1](#phase-1)
  - [Actual Code](#actual-code)
  - [Why this snippet is needed ?](#why-this-snippet-is-needed-)
  - [How this is achieved ?](#how-this-is-achieved-)
  - [So, What it does ?](#so-what-it-does-)
  - [Pros](#pros)
  - [Cons](#cons)
  - [Use Cases](#use-cases)
  - [Future Ideas](#future-ideas)
- [Phase 2](#phase-2)
  - [Intro](#intro)
  - [What's new?](#whats-new)
  - [Demo - click here](#demo---click-here)
  - [Instructions](#instructions)
  - [Fallback Content](#fallback-content)
  - [ID](#id)
  - [Under the hood](#under-the-hood)
  - [Future ideas](#future-ideas-1)

## Phase 1

### Actual Code

```js
require.config({
    paths: {
        vs: "./node_modules/monaco-editor/dev/vs"
    }
})
require(["vs/editor/editor.main"], initEditor)
const startPhrase = `// Start of editable area`
const endPhrase = `// End of editable area`
const editableArea = ((startPhrase,endPhrase) => {
    return {
        includes : function(changes,model){
            const fullRange = model.getFullModelRange();
            let { range : startRange } = model.findMatches(startPhrase,fullRange).shift() || {};
            let { range : endRange } = model.findMatches(endPhrase,fullRange).pop() || {};
            const {
                startLineNumber,
                endLineNumber,
                startColumn,
                endColumn
            } = fullRange;
            const isEmpty = text => text === ''; // ? refers to backspace and delete
            const isEnter = text => /\n/.test(text);
            if(startRange && endRange){
                startRange = startRange.setStartPosition(startLineNumber,startColumn);
                endRange = endRange.setEndPosition(endLineNumber,endColumn);
                return changes
                        .every(({ text,range }) => {
                            const specialCases = () => {
                                /*
                                 ? This is done for my use case
                                 ? This allows enter at the end of the start Range and 
                                 ? This allows the enter and backspace on the start of the end Range
                                 ? This is an optional case
                                 */
                                return (
                                    ( isEnter(text) || range.startLineNumber > startRange.endLineNumber) &&
                                    ( isEnter(text) || isEmpty(text) || range.endLineNumber < endRange.startLineNumber)
                                );
                            }
                            return  !startRange.strictContainsRange(range) &&
                                    !endRange.strictContainsRange(range) &&
                                    specialCases();
                        })
            }
            return false;
        }
    }
})(startPhrase,endPhrase);
function initEditor(){
    const sampleJs = `
/**
 * This place cannot be edited
 */
// Start of editable area
function editable(){
    console.log('This part can be edited and all stuff can be done here')
}

// End of editable area
/**
 * This place cannot be edited
 */`
    const jsModel = monaco.editor.createModel(sampleJs,"javascript");
    const editorDiv = document.querySelector('.editorDiv');
    const jsContainer = monaco.editor.create(editorDiv);
    jsContainer.setModel(jsModel);
    jsModel.onDidChangeContentFast(({ changes,isUndoing }) => {
        if(!isUndoing){
            if(!editableArea.includes(changes,jsModel)){
                /*
                 * This Promise.resolve() sends the code to the micro task queue
                 * And it gets called before the event queue ( micro task queue has more priority than event queue)
                 * Thus, Promise.resolve() will be better than a setTimeout(fn,0) here
                 * If we do it synchronously, it affects some of monaco editor's functions
                 */
                Promise.resolve().then(() => jsContainer.trigger('someIdString','undo'))
            }
        }
    })
}****
```

### Why this snippet is needed ?

Monaco editor is one of the best online javascript editors, But recently `setEditableRange` functionality was removed from it. Refer [this](https://github.com/microsoft/monaco-editor/issues/874).

This snippets tries to establish the restriction in editable area

### How this is achieved ?

- This snippet needs the start and end phrases, to which the editable restriction has to be implemented
- The `onDidChangeContentFast` hooks is watched for the changes and if that change is not happening in the allowed area the `undo` will be triggered, which nullifies the content which is typed/pasted
- Promise.resolve() - is used to move the `undoing` function to the microtask queue , by this monaco editor is allowed to do its stuff and once it gets completed, this `undoing` function gets triggered
- The area above the start phrase and end phrase will be restricted
  
> **Note** : Microtask queue is having more priority than Event queue, thus Promise.resolve becomes a better option than setTimeout(fn,0) in this scenario

### So, What it does ?

By this, we can create an `illusion`like, nothing is allowed to type in the restricted area, but what actually happens is all the typed values are getting undo once it is getting typed in the restricted area

### Pros

- Advantage of using this snippet is `there will not be any UI lag while undoing`, Previously when using setTimeout, the undoing operation will be visible to the user
- Autocompletion suggestions from the restricted area will be available

### Cons

- This requires starting and ending phrase
- I haven't tested this code with large amount of pasting of texts, So it may break at that stage. This will work fine for typing

### Use Cases

- If you are trying to design an online coding interview platform using monaco editor and you wish to allow the canditates to edit only certain places, This can be used

### Future Ideas

- I will try to increase the no of editable areas, so we can get more control over the editable and restricted areas

## Phase 2

### Intro

This post is continuation of the previous post, which you can see here
{% post https://dev.to/pranomvignesh/restrict-editable-area-in-monaco-editor-4hac %}

### What's new?

This time `granular editing` is made possible by giving set of instructions to the script, which then `creates a regex` in runtime to validate the output

Process is simple; if regex is matched , output will be left as such, if not then content will be set to its previous state (undo operation)

### Demo - [click here](https://monaco-editor-restrict-editable-area.vercel.app/)

![Demo of Playground](https://dev-to-uploads.s3.amazonaws.com/i/ilsfii9hbffze6oowtf3.gif)

### Instructions

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

### Under the hood

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

### Future ideas

Will try to publish this as an `npm package` so that it will be accessible for everyone
