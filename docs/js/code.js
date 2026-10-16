// Editor/visualizzatore di codice basato su CodeMirror 5.
import { S } from './state.js';

export function mountCode(el, { value = '', mime = 'text/plain', readOnly = true, wrap = S.settings.wrap, placeholder = '' } = {}) {
  const CM = window.CodeMirror;
  const cm = CM(el, {
    value,
    mode: mime,
    theme: 'glass',
    lineNumbers: true,
    readOnly,
    lineWrapping: wrap,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    autoCloseBrackets: !readOnly,
    matchBrackets: true,
    inputStyle: 'contenteditable',
    spellcheck: false,
    autocorrect: false,
    autocapitalize: false,
    viewportMargin: 40,
    placeholder,
    extraKeys: {
      Tab: (c) => (c.somethingSelected() ? c.indentSelection('add') : c.replaceSelection('    ')),
      'Shift-Tab': (c) => c.indentSelection('subtract')
    }
  });
  cm.setSize('100%', '100%');
  requestAnimationFrame(() => cm.refresh());
  return cm;
}

export function newDoc(text, mime) {
  return window.CodeMirror.Doc(text || '', mime || 'text/plain');
}

export function setEditable(cm, editable) {
  cm.setOption('readOnly', !editable);
  cm.setOption('autoCloseBrackets', editable);
}
