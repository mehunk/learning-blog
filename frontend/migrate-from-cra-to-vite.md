# 构建工具从 CRA 迁移到 Vite

## 背景

时间：2024 年 4 月 4 日

### 版本

- Vite: 5.2.8
- Node.js: 20.12.0
- vite-tsconfig-paths: 
- vite-plugin-svgr: 4.2.0

## 安装

```shell
$ npm install -D vite @vitejs/plugin-react
```

## 更新配置和文件

### 创建配置文件

在根目录创建 `vite.config.ts`。

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
```

### index.html

将 `index.html` 移动到根目录。

### 确保文件扩展名正确

将所有扩展名为 `.js` 或者 `.tsx` 的 React 组件文件全部重命名为 `.jsx` 或者 `.tsx`。

### 设置代理

在 `vite.config.ts` 配置文件中配置代理。

```javascript
{
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
}
```

## 安装对应的插件

### vite-tsconfig-paths

为了确保 Vite 能够按照 TypeScript 的配置解析路径，需要安装 `vite-tsconfig-paths` 插件。

### vite-plugin-svgr

为了继续使用类似于 `export { ReactComponent as LogoImage } from "./logo.svg";` 这样的语法来导入 SVG 文件，需要另外安装 `vite-plugin-svgr` 插件。

## 不兼容的库

### jsonwebtoken

因为 `jsonwebtoken` 用到了一些 Node.js 的内置模块，但 vite 并没有将 Node.js 的内置模块暴露在全局下，因此提示找不到某些函数的错误。有多个解决方案，比如将用到的内置模块暴露通过配置暴露在全局中，但是这个解决方案并不合理。最简单的解决方案是直接使用 `jose` 替换原来的模块，虽然 API 并不是完全兼容的，但也相差不多，修改一些就行。

## 其他的破坏性变化

### \<xxx\> is not defined

- global is not defined
- require is not defined
- process is not defined

在 `vite.config.ts` 配置文件中定义全局变量。

```javascript
{
  define: {
    global: {},
    'process.env': {
      ...process.env,
      PUBLIC_URL: ''
    }
  }
}
```

## 替换命令

将原来的 `react-scripts` 替换成 `vite` 相关的命令。

```json
{
  "scripts": {
    "start": "vite",
    "build": "tsc && vite build"
  }
}
```

## 参考资料

- [Migrating a Create React App project to Vite](https://darekkay.com/blog/create-react-app-to-vite/)