require.config({
    paths: {
        vs: "./monaco-editor/min/vs"
    }
})
require(["vs/editor/editor.main"], initEditor)
// const startPhrase = `// Start of editable area`
// const endPhrase = `// End of editable area`
// const editableArea = ((startPhrase,endPhrase) => {
//     return {
//         includes : function(changes,model){
//             const fullRange = model.getFullModelRange();
//             let { range : startRange } = model.findMatches(startPhrase,fullRange).shift() || {};
//             let { range : endRange } = model.findMatches(endPhrase,fullRange).pop() || {};
//             const {
//                 startLineNumber,
//                 endLineNumber,
//                 startColumn,
//                 endColumn
//             } = fullRange;
//             const isEmpty = text => text === ''; // ? refers to backspace and delete
//             const isEnter = text => /\n/.test(text);
//             if(startRange && endRange){
//                 startRange = startRange.setStartPosition(startLineNumber,startColumn);
//                 endRange = endRange.setEndPosition(endLineNumber,endColumn);
//                 return changes
//                         .every(({ text,range }) => {
//                             const specialCases = () => {
//                                 /*
//                                  ? This is done for my use case
//                                  ? This allows enter at the end of the start Range and 
//                                  ? This allows the enter and backspace on the start of the end Range
//                                  ? This is an optional case
//                                  */
//                                 return ( 
//                                     ( isEnter(text) || range.startLineNumber > startRange.endLineNumber) &&
//                                     ( isEnter(text) || isEmpty(text) || range.endLineNumber < endRange.startLineNumber)
//                                 );
//                             }
//                             return  !startRange.strictContainsRange(range) && 
//                                     !endRange.strictContainsRange(range) && 
//                                     specialCases();
                                    
//                         })
//             }
//             return false;
//         }
//     }
// })(startPhrase,endPhrase);

function restrictEditArea(value){  
    const editable = (() => {
        const regexObjects = {};
        const labels = [];
        const generateRegexUsing = (label) => new RegExp("\\/\\*\\s*("+label+")(#([^#]+?))?\\s*(=\\s*(.+?))?\\s*\\*\\/","g")
        return {
            add : (name,label,regexReplacer) => {
                regexObjects[name] = {
                    regex : generateRegexUsing(label),
                    idIndex : 3,
                    fallbackContentIndex : 5,
                    regexReplacer : regexReplacer
                }
                labels.indexOf(label) === -1 && labels.push(label);
                return regexObjects[name];
            },
            getAll : () => regexObjects,
            getIdReplacerRegex : () => generateRegexUsing(labels.join('|'))
        }
    })();
    editable.add('singleLine','editableArea','(.*?)')
    editable.add('multiLine','multiLineEditableArea','(^(.*?)$\\n)*')
    const generateRegexFromValue = (string,{
        singleLine,
        multiLine
    },idReplacer) => {
        let valueToSet = string;
        let regexString = string;
        let map = {};
        let matchCount = 0;
        const regexFor = {
            brackets : /(\(|\)|\{|\}|\[|\])/g,
            newLine  : /\n/g
        }
        valueToSet  = valueToSet.replace(singleLine.regex,"$"+singleLine.fallbackContentIndex)
        valueToSet  = valueToSet.replace(multiLine.regex,"$"+multiLine.fallbackContentIndex)
        regexString = regexString.replace(regexFor.brackets,'\\$1'); //! This order matters
        regexString = regexString.replace(regexFor.newLine,'$\\n^'); //! This order matters
        regexString = regexString.replace(singleLine.regex,singleLine.regexReplacer)
        regexString = regexString.replace(multiLine.regex,multiLine.regexReplacer)
        string.replace(idReplacer,function(...matches){
            map[++matchCount] = matches[3];
        })
        return {
            valueToSet : valueToSet,
            regexForValidation : new RegExp('^'+regexString+'$','m'),
            map : map
        }
    }
    return generateRegexFromValue(value,editable.getAll(),editable.getIdReplacerRegex())
}

function initEditor(){
    const value = `Lyte.Component.registerHelper("/*editableArea#helperName=HelperName*/",function(/*editableArea#args*/){
    /*multiLineEditableArea#content*/
    })`
    const { valueToSet, regexForValidation, map } = restrictEditArea(value)
    const sampleJs = valueToSet;
    const jsModel = monaco.editor.createModel(sampleJs,"javascript");
    const editorDiv = document.querySelector('.editorDiv');
    const jsContainer = monaco.editor.create(editorDiv);
    jsContainer.setModel(jsModel);
    jsModel.onDidChangeContentFast(({ isUndoing }) => {
        if(!isUndoing){
            const doUndo = () => Promise.resolve().then(() => jsContainer.trigger('someIdString','undo'))
            const modelValue = jsModel.getValue();
            if(!regexForValidation.test(modelValue)){
                doUndo();
            }else{
                const [completeMatch,...otherMatches] = regexForValidation.exec(modelValue);
                if(completeMatch !== modelValue){
                    doUndo();
                }
            }
        }
    })
}