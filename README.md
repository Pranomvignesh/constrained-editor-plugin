# Restrict the Editable area in the monaco editor <!-- omit in toc -->


This application shows how we can restrict editing of certain places in monaco editor. To see the demo [click here](./index.html);

## Table of Contents <!-- omit in toc -->

- [Actual Code](#actual-code)
- [Why this snippet is needed ?](#why-this-snippet-is-needed-)
- [How this is achieved ?](#how-this-is-achieved-)
- [So, What it does ?](#so-what-it-does-)
- [Pros](#pros)
- [Cons](#cons)
- [Use Cases](#use-cases)
- [Future Ideas](#future-ideas)
- [Might Solve this](#might-solve-this)

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


### Might Solve this 

This might become a solution to this [github issue](https://github.com/Microsoft/monaco-editor/issues/953)

On cover :
<span>Photo by <a href="https://unsplash.com/@baciutudor?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Tudor Baciu</a> on <a href="https://unsplash.com/s/photos/editor?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Unsplash</a></span>