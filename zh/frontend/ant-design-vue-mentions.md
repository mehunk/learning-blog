# 如何解决 Ant Design Vue 提及组件的 bug

## 背景

在开发 OKR 应用时，在用户录入具体的目标或者关键结果时，可以提及其他用户，发布后会给被提及的用户发送一条通知。具体的要求是在文本框中，用户先输入了 `@` 字符后，会弹出一个可以提及的用户列表，并且该列表中的内容可以根据用户接下来的输入文字进行筛选。为了快速实现这个功能，我们使用了 Ant Design Vue 的 Mentions 组件。

## 问题

在使用过程中，发现 Mentions 组件有一个 bug，当输入字符是英文字符时功能是正常的，但如果输入的是中文或者日文汉字，会出现字符输入完成后迅速被截断，无法正常使用 IME 的情况。

## 问题分析

```tsx
const handleChange = (val: string) => {
  if (props.value === undefined) {
    value.value = val;
  }
  emit('update:value', val);
  emit('change', val);
  formItemContext.onFieldChange();
};
```

相关代码会导致在使用 IME 时，刚输入完一个英文字符就会强制更新到 Vue 的变量，然后该变量又会更新当前正在输入的 `input` 元素，因此破坏了正在输入的汉字。

## 解决方案

首先，我们需要知道 Mentions 组件的实现原理，它是通过监听 `input` 事件来实现的，但是在中文输入法下，输入一个汉字时，会触发三个事件：

1. `compositionstart`：输入法开始输入
2. `input`：输入法输入完成
3. `compositionend`：输入法输入完成

而在英文输入法下，输入一个字符时，只会触发 `input` 事件。

因此，我们需要在 `compositionstart` 事件和 `compositionend` 事件中，分别设置一个标志位，然后在 `input` 事件中，判断这个标志位是否为 `true`，如果是，则不触发 `input` 事件。

```js
// ant-input-directive.js
function onCompositionStart(e) {
  e.target.composing = true;
}

function onCompositionEnd(e) {
  // prevent triggering an input event for no reason
  if (!e.target.composing) return;
  e.target.composing = false;
  trigger(e.target, 'input');
}

function trigger(el, type) {
  const e = document.createEvent('HTMLEvents');
  e.initEvent(type, true, true);
  el.dispatchEvent(e);
}

export function addEventListener(el, event, handler, options) {
  el.addEventListener(event, handler, options);
}
const antInput = {
  created(el, binding) {
    if (!binding.modifiers || !binding.modifiers.lazy) {
      addEventListener(el, 'compositionstart', onCompositionStart);
      addEventListener(el, 'compositionend', onCompositionEnd);
      // Safari < 10.2 & UIWebView doesn't fire compositionend when
      // switching focus before confirming composition choice
      // this also fixes the issue where some browsers e.g. iOS Chrome
      // fires "change" instead of "input" on autocomplete.
      addEventListener(el, 'change', onCompositionEnd);
    }
  },
};

export default antInput;
```

```tsx
// Mentions.tsx
const onKeyUp = (event: KeyboardEvent) => {
  // ...
  if ((target as any).composing) {
    return;
  }
  // ...
}
```
