---
description: This page contains the actual code which I have used to do this
---

# Actual Code

### Snippet which generates the regex

{% code title="restrict\_editable\_area.js" %}
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
{% endcode %}

