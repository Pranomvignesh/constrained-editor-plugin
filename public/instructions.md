# Restrict Editable Area in monaco editor

This tool converts a `simple set of instructions` to a restricted editable area along with the hold of values in the editable area

## Example

```javascript
// This is the instruction
function /*editableArea#funcName=fnName*/(/*editableArea#args=arg1,arg2*/){
/*multiLineEditableArea#actualCode=//Enter your logic here*/
}
```

```javascript
// This is output in editor
function fnName(arg1,arg2){
//Enter your logic here
}
```

Here, `fnName`,`arg1`,`arg2`, and inside the `{}` becomes editable, Rest places will not be editable (again creates an illusion of not editable)

`/* editableArea */` - creates a simple editable area with no fallbackContent

`/* editableArea#id1 */` - creates a simple editable area mapped with id `id1`, so that you will get that edited value alone during the onchange callback

`/* editableArea=fallbackContent */` - creates a simple editable area mapped with a fallback content, which will be populated initially

`/* multiLineEditableArea */` - all the above rules apply to this tag also. Purpose of this tag is to create multiline text which is not possible incase of `editableArea`;
