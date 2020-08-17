require.config({
    paths: {
        vs: "./node_modules/monaco-editor/dev/vs"
    }
})

require(["vs/editor/editor.main"], initEditor)
function initEditor(){
    const sampleJs = `const func = function(){
        console.log('somevalue');
    }
    `
    const jsModel = monaco.editor.createModel(sampleJs,"javascript");
    const editorDiv = document.querySelector('.editorDiv');
    const jsContainer = monaco.editor.create(editorDiv,{
        wordWrap : 'on'
    })
    jsContainer.setModel(jsModel);
}