describe('Restrict Edit Area', function () {
  var editorInstance, model, instanceOfRestrictor, monacoInstance;
  beforeAll(function (done) {
    require.config({ paths: { vs: '../node_modules/monaco-editor/min/vs' } });
    require(['vs/editor/editor.main'], function () {
      monacoInstance = monaco;
      editorInstance = monaco.editor.create(document.getElementById('container'), {
        value: [
          'function sample () {',
          '  console.log("Hello world!");',
          '  // Type something here',
          '}',
        ].join('\n'),
        language: 'javascript'
      });
      model = editorInstance.getModel();
      const constructorsToInject = {
        range: monaco.Range
      }
      /**
       * Configuration for the Restricted Editor : Starts Here
       */
      instanceOfRestrictor = restrictor(constructorsToInject);
      instanceOfRestrictor.initializeIn(editorInstance);
      instanceOfRestrictor.addRestrictionsTo(model, [
        /**
         * range : [ startLine, startColumn, endLine, endColumn ]
        */
        {
          range: [2, 16, 2, 28], // Range of Hello world! String
          label: 'valueInConsoleLog'
        }, {
          range: [1, 18, 1, 18], // Range of Arguments for Sample Function
          label: 'argsOfSampleFn'
        }, {
          range: [3, 1, 3, 25], // Range of // Type something here
          label: 'contentOfSampleFn',
          allowMultiline: true
        }
      ]);
      const domNode = editorInstance.getDomNode();
      domNode.addEventListener('mousedown', function () {
        console.log(editorInstance.getPosition());
      })
      done();
    });
  })
  describe('API Check', function () {
    const listOfAPIsInInstance = [
      'initializeIn',
      'addRestrictionsTo',
      'removeRestrictionsIn',
      'destroyInstanceFrom'
    ]
    listOfAPIsInInstance.forEach(function (api) {
      it('Does instance has : ' + api, function () {
        expect(instanceOfRestrictor[api]).toBeDefined();
      })
    })
    const listOfAPIsInNewModel = [
      'editInReadOnlyArea',
      'getValueInEditableRange',
      'disposeRestrictions'
    ]
    listOfAPIsInNewModel.forEach(function (api) {
      it('Does restricted model has : ' + api, function () {
        expect(model[api]).toBeDefined();
      })
    })
  })
  describe('Base Case Check', function () {
    it('Check whether ranges return proper value initially', function () {
      const expected = {
        valueInConsoleLog: 'Hello world!',
        argsOfSampleFn: '',
        contentOfSampleFn: '  // Type something here'
      }
      expect(expected).toEqual(model.getValueInEditableRange());
    })
  })
  describe('Value Updation Check', function () {
    describe('Update Value inside Editable Area', function () {
      const defaultValueForValueInConsoleLog = 'Hello world!';
      const testCasesForValueInConsoleLog = [
        {
          range: [2, 16, 2, 16],
          text: 'Addition In Start-',
          expectedValue: 'Addition In Start-' + defaultValueForValueInConsoleLog
        },
        {
          range: [2, 22, 2, 22],
          text: '-Addition In Mid-',
          expectedValue: 'Hello -Addition In Mid-world!'
        },
        {
          range: [2, 29, 2, 29],
          text: '-Addition In End',
          expectedValue: defaultValueForValueInConsoleLog + '-Addition In End'
        }
      ]
      it('Update Value In Range "valueInConsoleLog"', function () {
        testCasesForValueInConsoleLog.forEach(function (testCase) {
          let range = testCase.range;
          testCase.range = new monaco.Range(range[0], range[1], range[2], range[3]);
          range = testCase.range;
          editorInstance.setPosition({
            lineNumber: range.startLineNumber,
            column: range.startColumn
          });
          const domNode = editorInstance.getDomNode();
          domNode.dispatchEvent(new Event('keydown'));
          model.applyEdits([
            { forceMoveMarkers: true, ...testCase }
          ]);
          const { valueInConsoleLog } = model.getValueInEditableRange()
          expect(function () {
            const result = testCase.expectedValue === valueInConsoleLog;
            const currentRanges = model._getCurrentRanges();
            model.applyEdits([
              {
                forceMoveMarkers: true,
                range: currentRanges.valueInConsoleLog,
                text: defaultValueForValueInConsoleLog
              }
            ]);
            return result;
          }).toBeTruthy();
        })
      })
    })
  })
})