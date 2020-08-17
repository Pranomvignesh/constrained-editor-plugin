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
const isInBetween = function(value,lowerLimit,upperLimit){
    return lowerLimit <= value && value <= upperLimit;
}
const isRestrictedPlaceModified = (changes) => changes.some(({ range }) => restrictedLines.includes(range))

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
}