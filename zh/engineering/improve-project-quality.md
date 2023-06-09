# 改善项目品质

## 背景

2022 年 12 月我被任命为当前所在的项目开发团队——劳务制品项目的负责人。该项目是从 2022 年 8 月左右开始启动，已经进行了大概 4 个月左右的时间。但是该产品在当时基本属于无法正常使用的状态，导致管理层很不满意，因此临时撤换了原来的负责人，让我作为新的负责人改善该项目。

## 问题分析

通过 2 周左右的调查，发现了有如下问题：

- 已经上线的功能不完整，无法形成闭环
- 功能设计无法形成闭环，状态迁移不清晰
- 组内成员没有 Agile 的开发理念
- 前后端 bug 过多
- 前端页面样式粗糙
- 前后端缺少单元测试和 E2E 测试
- 引入了不必要的复杂技术

## 解决方案

### 管理

- 提前定义好 roadmap 中的每个阶段应该完成的功能
- 团队内部贯彻 Agile 的开发理念
- 通过各种手段提升团队士气

### 设计

- 将大的功能合理拆解成能够形成闭环的小颗粒度的功能
- 使用 UML 的状态图整理状态迁移过程
- 开发完成后设计师验收

### 开发

- 项目重构，去掉无意义的复杂技术
- 加强 Unit Test 要求
- 加强 Code Review 过程
- 增加 E2E 测试
- 使用 Storybook + Chromatic 管理样式变更过程
- 使用 Cloudflare Pages 发布每个特性分支，合并之前需要产品经理和设计师验收通过
- 后端开发先行
- 前后端将报警接入到 Teams，确保团队第一时间得知异常产生
- 前端使用 Datadog 捕获异常
