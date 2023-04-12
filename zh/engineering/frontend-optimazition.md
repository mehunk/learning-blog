# 前端的项目构建性能优化和页面性能优化

## 简介

当我们说前端性能优化的时候，指的可能是不同场景的性能优化。前端涉及性能优化的场景主要有：

- 项目构建性能优化
- 页面性能优化
  - 加载时性能优化
  - 运行时性能优化

构建性能主要指构建速度，优化方法和打包工具直接相关，主要思路是缓存 + 并行。

页面性能主要指页面加载速度和流畅度，很明显页面性能指标都是从用户体验角度出发的， 页面性能优化目标是尽可能快地展示出页面内容，尽可能快地使功能可用，减少页面卡顿，提升用户体验。

性能优化应该从这几个方面来掌握：

- 评价指标
- 瓶颈分析（方法及工具）
- 优化方法

性能优化的步骤通常是：

- 设立指标
- 瓶颈分析
- 针对性能瓶颈优化
- 监控指标，观察优化效果
- 继续优化

## 浏览器渲染流程

浏览器渲染流程是前端性能优化的基础，了解浏览器渲染流程可以帮助我们更好地分析性能瓶颈，更好地优化。

从输入url到看到界面的过程，可以分为以下几个步骤：

1. 检查缓存
2. DNS 解析
3. 发送 HTTP 请求
4. 将响应数据提交给渲染进程处理
5. 构建 DOM 树
6. 样式计算
7. 布局
8. 分层
9. 绘制
10. 分块
11. 栅格化
12. 合成

## 项目构建性能优化

### 加载阶段

加载阶段可以划分为两个大的阶段，URL请求阶段和渲染阶段。上述从URL请求到看到界面的过程简述了整个过程。下面详细说明过程中的细节。

#### 整体过程

##### URL请求阶段

从上一部分内容可以知道，URL 请求阶段主要有缓存、DNS 检查、发送 HTTP 请求，这个阶段通常是服务器的响应时间占用大部分时间。对于静态资源，服务器的响应时间一般不会成为瓶颈；对于服务端渲染则需要进行缓存等优化处理。

针对这个阶段，有一些常用优化手段。

- 使用 http DNS
- 减少重定向
- 静态资源服务器 gzip
- 静态资源使用
- 服务器升级带宽
- 升级服务器配置
- 数据库优化（对于服务端渲染的页面）
- 缓存动态网页（对于服务端渲染的页面）
- 还有可能是服务器被攻击导致缓慢，更换高防服务器
- 善用缓存

##### 渲染阶段

从上述“从输入url到看到界面的过程”，我们知道渲染阶段有解析 HTML 构建 DOM、样式计算、布局、分层、绘制、分块、栅格化、合成这几个步骤。这其中耗时较长的，最容易造成瓶颈的是构建 DOM、样式计算这 2 个步骤。
下面我们详细说明构建 DOM、样式计算这 2 个步骤。
在这两个步骤中，存在几个关键的操作：解析 HTML 构建 DOM、下载 CSS、解析 CSS、下载 JavaScript、解析并执行 JavaScript。
这两个步骤的更详细的操作流程是

- 预解析 HTML，预加载 link 和 script 外链。 现代浏览器对外链加载做了优化，会在渲染进程接收到 HTML 数据字节流时候就开始预解析HTML，预解析会找到 HTML 中的外链并交给下载进程提前加载。
- 解析 HTML，构建 DOM。
- 遇到 style 标签或者 link 外链加载好后，解析 CSS，构建 CSSOM。 
- 遇到 script 标签，停止解析HTML，等待外链 CSS 加载并解析完成、内联 CSS 解析完成后，再执行 JavaScript。执行完 JavaScrip 再开始解析HTML。如果外链的script标签有defer/async属性，则该script标签的下载和执行时候不会停止解析HTML。若存在defer属性，JavaScript会等DOMContentLoaded事件触发后再开始执行；若存在async属性，JavaScript会等下载完再执行。动态创建的标签也会在下载完成后再执行。

这里需要注意

通常HTML会解析完成再渲染，除非内容非常多（例如几千个节点的列表），当节点很多时候，html解析一部分后就会开始渲染。
这和等待时间没有关系，比如使用一个100000循环的Javascript代码 block住html解析，html还是会等解析完再渲染。
另外，动态创建的标签，执行顺序和创建并挂载的顺序不一定相同。

从上面操作流程可以得到各操作阻塞的总结

- css解析会阻塞渲染。因为构造渲染树需要CSSOM，因此CSS解析完成是后续工作的先决条件。
- css下载会阻塞js执行，不会阻塞html解析。
- js下载和执行会阻塞html。
- 在执行 JavaScript 脚本之前，会先加载并解析页面中的CSS样式（包括link标签和style标签）（如果存在）。也就是说 CSS 在部分情况下也会阻塞 DOM 的生成。
- defer的js会异步下载执行，不阻塞HTML解析。
- async的js会异步下载，下载完执行，即下载不阻塞HTML解析，但执行阻塞HTML解析。

由于解析HTML、加载CSS、解析CSS、加载JavaScript、解析并执行JavaScript之间会有相互阻塞，因此为了尽快到达构造渲染树的阶段，有两个原则：

- 尽量避免阻塞
- 缩短阻塞时间

从上面对关键资源阻塞规律的总结可以知道，CSS的下载和解析对于首次构建布局树是必要的步骤，没有办法避免。JavaScript的下载、解析和执行则不应该阻塞HTML解析，为什么呢？首先，如果JavaScript没有操作DOM，那么首次构建布局树不需要JavaScript；如果JavaScript操作了DOM，也应该在整个HTML解析完，基本的DOM树构建好了之后再开始执行JavaScript操作DOM。

因此样式资源放在head标签中，这样并不会造成不必要的阻塞，并且代码会更规整；JavaScript应该放在body底部或者加上defer/async属性或者动态创建script标签（动态创建的script标签外链会异步加载）避免JavaScript的下载执行阻塞HTML的解析。

如何缩短阻塞时间呢？有2个原则：尽可能少、尽可能早。

资源量尽可能少（压缩、雪碧图、按需加载）、请求次数尽可能少（打包）、让无依赖关系的资源尽可能早加载而不是等待排队（域名打散、分包，即并行）、请求链路尽可能少（CDN）

尽可能早解析DNS（DNS预解析）

#### 加载阶段性能优化

下面列举常见的加载阶段性能优化方法，这些优化方法都是根据“尽可能少”、“尽可能早”的原则实现的优化手段。

1. 减少需要请求的资源尺寸：资源压缩、删除冗余代码和其他资源，或者使用尺寸更小的资源

- 代码压缩，包括js/css/html都应该压缩。
- 服务器开启gzip。
- iconfont代替图片。
- 使用webp图片，在质量相同的情况下，WebP 格式图像的体积要比 JPEG 格式图像小 40%。
- 删除无用代码（摇树js和css、删除console.log）。
- 模块按需加载（antd、lodash、moment等常用的第三方库，不用的模块不打包进项目）

2. 减少请求数量

- 合并请求，由于每次请求时候，实际传输的内容只占整个请求过程的较少一部分时间，因此合并内容让多个请求变成一个可以节约请求中建立连接、排队等待等耗时。
- 雪碧图，图片合成，避免每个图片都要发一次请求。
- 内联较小的js css、图片（转成base64）等资源，避免再发一次请求获取资源。

3. 缓存

- 使用强缓存，文件名加hash后缀，这样只要文件内容不变，就会读缓存内容。
- 文件分包，更好地利用缓存，不常改变的资源分离出来。
- 使用cdn，注意要避免html被cdn缓存，可以在cdn服务配置不缓存html资源，也可以把html部署在自己的服务器。

4. 并行请求

- 域名打散（针对http1）。
- 使用http2。（当然http2还有二进制等好处）。

5. 按需加载

- dns预解析，使用< link rel="dns-prefetch"href="//my.domain">对域名做预解析，后续资源加载时候会跳过dns预解析的阶段，直接使用dns的结果。
- 资源预加载，首屏完成后，可以采取某种机制预加载二屏资源。

6. 预加载

- dns预解析，使用< link rel="dns-prefetch"href="//my.domain">对域名做预解析，后续资源加载时候会跳过dns预解析的阶段，直接使用dns的结果。
- 资源预加载，首屏完成后，可以采取某种机制预加载二屏资源。

7. 注意事项

- 异步加载js（async、defer、放到body底部、动态创建script标签）。
- 不使用CSS @import，CSS的@import会造成额外的请求 用代替@import 。
- 避免空的src和href 留意具有这两个属性的标签如link，script，img，iframe等；

8. 服务端渲染和预渲染。

主流框架都支持SSR，并有开箱即用的框架，服务端渲染有优异的首屏性能，并且对SEO更友好。

预渲染目的提升首屏性能，预渲染就是在构建阶段，启用无头浏览器，加载项目的路由，并渲染出首屏页面（也可以配置其他路由），然后生成静态页面，输出到指定的目录。

#### 指标

对于加载阶段，一个常用指标是 TTFB，Time To First Byte，首字节响应时间，指从发送请求到收到首个字节。大多数服务器的 TTFB 时间都在 100ms 以内，这个时间就是我们优化时候可以追求的时间。
这里的 TTFB 指的是HTML资源的 TTFB，因为浏览器收到HTML时候才会开始构建DOM，进入渲染阶段。

使用performance API计算方法

```js
performance.timing.responseStart - performance.timing.requestStart
```

对于渲染阶段，主要的指标是首屏和白屏。
白屏时间 = 地址栏输入网址后回车 - 浏览器出现第一个元素
首屏时间 = 地址栏输入网址后回车 - 浏览器第一屏渲染完成
实际上浏览器没有API返回白屏和首屏时间，我们需要用其他API近似计算。
网上有些文章提到在HTML中加script标签计算白屏和首屏

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>白屏</title>
  <script type="text/javascript">
    // 不兼容performance.timing 的浏览器，如IE8
    window.pageStartTime = Date.now();
  </script>
  <!-- 页面 CSS 资源 -->
  <link rel="stylesheet" href="common.css">
  <link rel="stylesheet" href="page.css">
  <script type="text/javascript">
    // 白屏时间 结束点
    window.firstPaint = Date.now();
  </script>
</head>
<body>
  <!-- 页面内容 -->
</body>
</html>
```

白屏时间 = firstPaint - performance.timing.navigationStart || pageStartTime

这些方法在没有performance API的时代很常用，但是它们有较大的问题。这些方法一方面容易受其他script标签位置影响，比如如果在body前部有个耗时长的script标签，那么body的渲染将会被延后，渲染之前将一直是白屏。因此这样计算白屏并不准确。另一方面这些方法代码侵入性较强，不通用。

也有使用performance.timing.domloading事件作为白屏结束时间点。这也不准确，因为该事件表示渲染引擎开始解析HTML，如果有script执行block，渲染同样会延后。

目前计算白屏和首屏比较常用的方法是：

白屏结束时间 = FP事件触发时间
首屏结束时间 = FCP事件触发时间

业界（Core Web Vitals）新的标准更关注最大内容的渲染时间LCP（largest contentful paint），认为LCP能够更好地衡量用户关注的主要内容的加载速度。

#### 瓶颈分析

对于TTFB指标，如果是客户端渲染，那么通常服务器响应时间不会成为网页加载性能的瓶颈，因为静态资源服务器在网络请求时候使用的资源很小，不会有很大压力。如果是服务端渲染网页，就需要服务器做好并发优化、数据库优化、缓存策略等工作，并做好监控以保证响应时间不会过长影响页面加载。

对于白屏和首屏，评估网页性能瓶颈需要区分客户端渲染和服务端渲染。

客户端渲染一般只有一个root节点用于js挂载dom。因此应该尽早加载用于操作DOM生成首屏DOM树的JavaScript代码。服务端渲染项目返回给浏览器的是处理好的完整HTML，解析完HTML、load完依赖资源就可以开始渲染了，因此服务端渲染应该更关注如何避免HTML解析被阻塞。
客户端渲染主要关注压缩文件、按需加载。服务端渲染复杂一些，需要考虑避免关键渲染路径上的阻塞。
加载阶段瓶颈分析可以使用现成的网页性能测试工具，如

- [WebPageTest](https://www.webpagetest.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

这些网页性能测试工具都会从各个维度对网页性能打分，并给出优化建议。

也可以使用chrome的performance和network工具观察网页加载渲染行为，从而找出性能瓶颈。
使用performance工具关注主要的事件（FCP），看触发之前有哪些操作是不必要的或者过长的（如是否加载了不必要的资源、资源加载事件是否过长，资源是否过大等）。

加载阶段：network查看是否关键资源尽快下载完、是否有过大的文件而未压缩、是否有并行下载过多的情况。

#### 监控

监控通常使用performance API采集关键事件点上报，根据上面对指标的介绍可以总结上报的主要指标如下

```js
const ttfb = performance.timing.responseStart - performance.timing.requestStart;

// FP
const fp = performance.getEntries('paint').filter(entry => entry.name == 'first-paint')[0].startTime;

// FCP
const fcp = performance.getEntries('paint').filter(entry => entry.name == 'first-contentful-paint')[0].startTime;

// Onload Event
const l = performance.timing.loadEventEnd - performance.timing.navigationStart;
```

数据上报之后，通常使用fp数据表示白屏时间，使用fcp/Max(fcp, l)时间表示首屏时间。一般会通过95分位/98分位的数据来评估网页性能。

### 运行阶段

#### 渲染过程

##### 首次加载的渲染过程

在上面已经讨论过，渲染过程的关键操作是

- html转成dom
- 计算style
- 生成布局树
- 分层，生成分层树
- 主线程给每个图层生成绘制列表，交给合成线程处理
- 合成线程将图层分块
- 合成线程在光栅化线程池中将图块转成位图
- 合成线程发送绘制图块的命令drawquad给浏览器进程
- 浏览器根据命令绘制，并显示在显示器上

##### 重排和重绘

如果JavaScript做了修改DOM元素的几何属性（位置、尺寸）等操作，将会重新计算style，并且需要更新布局树，然后执行后面的渲染操作，即从1~9的步骤需要重新执行一遍。这个过程叫“重排”。

如果JavaScript修改了DOM的非几何属性，如修改了元素的背景颜色，不需要更新布局树和重新构建分层树，只需要重新绘制，即省略了3、4两个阶段。

在页面运行中，应该尽量避免重排和重绘，以提升渲染性能。

##### 什么情况会触发重排

除了首次加载，还有一些其他的操作会引起重排

DOM元素移动、增加、删除和内容改变会触发回流。

当DOM元素的几何属性（width / height / padding / margin /border）发生变化就会触发回流。
读写元素的offset / scroll / client等属性会触发回流。
调用window.getComputedStyle会触发回流。

注意，多次修改样式并不一定触发多次回流，例如

```js
document.getElementById('root').stlye.width = '100px';
document.getElementById('root').stlye.height = '100px';
document.getElementById('root').stlye.top = '10px';
document.getElementById('root').stlye.left = '10px';
```

上面代码只会触发一次回流，这是因为浏览器自身有优化机制。

但是获取offset等元素属性，每获取一次都会触发一次回流，这是因为offset等属性，要回流完才能获取到最准确的值。

##### 如何减少重排

在更新界面时候，应该尽量避免重排。

1. 避免元素影响到所在文档流

用绝对定位（position: absolute;）使元素脱离文档流，这样元素的变化不会导致其他元素的布局变化，也就不会引起重排。
如果使用CSS的transform属性实现动画，则不需要重排和重绘，直接在合成线程合成动画操作，即省略了3、4、5三个阶段。由于没有占用主线程资源，并且跳过重排和重绘阶段，因此这样性能最高。

2. 读写分离

当JS对DOM样式进行读写时候，浏览器会如何操作呢？
浏览器对写操作会采用渲染队列机制，将写操作放入异步渲染队列，异步批量执行。当JS遇到读操作时候（offset / scroll / client），会把异步队列中相关的操作提前执行，以便获取到准确的值。
下面通过几个示例理解这个过程。
当使用JS修改样式时候，可能触发重排，例如

```js
div.style.left = '10px';
div.style.top = '10px';
div.style.width = '20px';
div.style.height = '20px';
```

上面每个console.log()都会让浏览器取出异步渲染队列中的写操作执行，然后返回重排后的值。

对于上面的情况，为了避免重排，应该进行读写分离。

```js
div.style.left = '10px';
div.style.top = '10px';
div.style.width = '20px';
div.style.height = '20px';
console.log(div.offsetLeft);
console.log(div.offsetTop);
console.log(div.offsetWidth);
console.log(div.offsetHeight);
```

上面代码在执行console.log()的时候，浏览器把之前上面四个写操作的渲染队列都给清空了。因为渲染队列是空的，所以后面的读操作并没有触发重排，仅仅取值而已。

如果需要根据当前的样式设置新样式，应该先缓存当前样式，然后批量更新样式。

```js
// bad 强制刷新，触发两次重排
div.style.left = div.offsetLeft + 1 + 'px';
div.style.top = div.offsetTop + 1 + 'px';

// good 缓存布局信息，读写分离
var curLeft = div.offsetLeft;
var curTop = div.offsetTop;
div.style.left = curLeft + 1 + 'px';
div.style.top = curTop + 1 + 'px';
```

3. 集中改变样式

虽然浏览器有异步渲染队列的机制，但是异步flush的时机我们没有办法控制，为了保证性能，还是应该集中改变样式。

```js
// bad
var left = 10;
var top = 10;
el.style.left = left + "px";
el.style.top  = top  + "px";

// good 
el.className += " theclassname";
// good
el.style.cssText += "; left: " + left + "px; top: " + top + "px;";
```

4. 离线改变DOM

如果需要进行多个DOM操作（添加、删除、修改），不要在当前的DOM中连续操作（如循环插入li）。

- 在要操作DOM之前，通过display隐藏DOM，当操作完成之后，才将元素的display属性为可见，因为不可见的元素不会触发重排和重绘。

```js

dom.display = 'none';

// 执行DOM操作...

dom.display = 'block';
```

- 通过使用DocumentFragment创建一个dom碎片,在它上面批量操作DOM，操作完成之后，再添加到文档中，这样只会触发一次重排。
- 复制节点，在副本上操作，然后替换原节点。
