---
description: >-
  This tool converts a simple set of instructions to a restricted editable area
  along with the hold of values in the editable area
---

# What this does ?

## Sample Instruction

{% code title="Input Instruction String" %}
```javascript
function /*editableArea#funcName=fnName*/ ( /*editableArea#args=arg1,arg2*/ ) {
    /*multiLineEditableArea#actualCode=//Enter your logic here*/
}
```
{% endcode %}

The above instruction string is sent to the script, which then `creates a regex` in runtime to validate the output

{% code title="Output Script String" %}
```bash
function fnName(arg1,arg2){
    //Enter your logic here
}
```
{% endcode %}

{% hint style="info" %}
The Process is simple; if the output matches the regex, it will be left \(or\) the changes will get erased via undo operation 
{% endhint %}

### [Click here](https://monaco-editor-restrict-editable-area.vercel.app/) to see the demo

![Working Example of editable area restriction](https://res.cloudinary.com/practicaldev/image/fetch/s--Vz-yql2P--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_66%2Cw_880/https://dev-to-uploads.s3.amazonaws.com/i/ilsfii9hbffze6oowtf3.gif)

### Types of Instructions

There are 2 types of instructions that can provided to the script

* **editableArea** - space defined to edit a portion of single line
* **multiLineEditableArea** - space defined to edit multiple lines

#### Fallback Content

This content can be given as so that when the output is rendered default content will be present in place of the editable area comment

eg : `/* editableArea=fallbackContent */`

#### ID

This id can be used to reference the output and whenever the editor content changes, a mapping object is generated

eg : `/* editableArea#id */`

This fallback content and id is applicable for both single line and multiline editable

Thus, places other than the editable area are not allowed to be edited by the user



