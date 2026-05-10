# 🔄 ChromaMatch Lite — 完整工作流程

## 系统架构总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              用户交互层                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        浏览器 UI (index.html)                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ 图片上传 │ │ 滑块调整 │ │ 节点编辑 │ │ 参考搜索 │ │ 导出面板 │  │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │   │
│  │       │            │            │            │            │         │   │
│  │       └────────────┴────────────┴────────────┴────────────┘         │   │
│  │                                │                                     │   │
│  │                     ┌──────────┴──────────┐                         │   │
│  │                     │      app.js         │                         │   │
│  │                     │   (主控制器/协调器)   │                         │   │
│  │                     └──────────┬──────────┘                         │   │
│  └────────────────────────────────┼────────────────────────────────────┘   │
│                                   │                                          │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              处理引擎层                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        浏览器端处理引擎                               │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │   │
│  │  │  color-transfer  │  │ image-adjustments│  │  smart-matcher   │  │   │
│  │  │  (颜色转移算法)   │  │  (后期调整)       │  │  (智能匹配)       │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │   │
│  │  │   node-graph     │  │ feedback-loop    │  │  color-analysis  │  │   │
│  │  │  (节点图引擎)     │  │  (反馈循环)       │  │  (颜色分析)       │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                          │
│                                   │ (可选：图片生成/参考搜索)                  │
│                                   ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      外部 API 调用 (浏览器端)                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │   │
│  │  │ Unsplash │ │  Pexels  │ │  OpenAI  │ │  Google  │  ...          │   │
│  │  │ (图库搜索)│ │ (图库搜索)│ │ (AI生成) │ │ (AI生成) │               │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (可选：MCP 服务)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MCP 服务层                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     MCP Server (Node.js)                             │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │   │
│  │  │   transport.js   │  │   handler.js     │  │   image-gen.js   │  │   │
│  │  │  (stdio/HTTP)    │  │  (工具路由)       │  │  (图片生成适配)   │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │   │
│  │  │    tools.js      │  │   config/keys.js │  │   (20个MCP工具)  │  │   │
│  │  │  (工具定义)       │  │  (密钥管理)       │  │                  │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                          │
│                                   ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        AI Agent 集成                                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │  Claude  │ │  Codex   │ │  Trae    │ │  Cursor  │ │ Windsurf │  │   │
│  │  │  Desktop │ │   CLI    │ │   Solo   │ │          │ │          │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 一、用户逻辑（浏览器端）

### 1.1 基础工作流程

```
用户操作                          系统响应
─────────────────────────────────────────────────────────────────
1. 上传源图片 (source)      →    存储到 sourceImage (ImageData)
2. 上传参考图片 (reference) →    存储到 targetImage (ImageData)
3. 点击 "Transfer Colors"   →    执行颜色转移
                                 │
                                 ├── colorTransfer.transferColors()
                                 │   └── Reinhard LAB / LAB Histogram / RGB Mean-Std
                                 │
                                 ├── smartMatcher.computeMatchScoreDE2000()
                                 │   └── 计算 ΔE2000 匹配分数 (0-100)
                                 │
                                 └── 显示结果到 resultCanvas
                                     └── 触发 colorAnalysis.analyzeImage()
                                         └── 更新直方图、向量图、建议
```

### 1.2 调整滑块工作流程

```
用户拖动滑块                      系统响应
─────────────────────────────────────────────────────────────────
temperatureSlider.input    →    updateAdjustment('temperature', value)
                                 │
                                 ├── 更新 UI 显示值
                                 ├── 防抖 150ms
                                 └── reapplyAdjustments()
                                     └── imageAdjustments.applyAll(result, adjustments)
                                         └── 更新 resultCanvas
```

### 1.3 节点编辑器工作流程

```
用户操作                          系统响应
─────────────────────────────────────────────────────────────────
点击 "Node Editor" 按钮    →    toggleNodeEditor()
                                 │
                                 ├── 显示节点画布
                                 ├── 初始化 nodeGraph
                                 └── 渲染默认节点布局

拖拽节点到画布              →    nodeGraph.addNode(node)
                                 └── nodeEditor.render()

连接两个端口                →    nodePort.connect(otherPort)
                                 │
                                 ├── 验证端口类型兼容性
                                 ├── 更新连接线
                                 └── 标记下游节点为 dirty

修改节点参数                →    inspectorPanel.updateParam()
                                 │
                                 ├── 更新节点参数
                                 ├── 标记节点为 dirty
                                 └── 触发重新执行

点击 "Execute Graph"        →    nodeGraph.execute()
                                 │
                                 ├── 拓扑排序
                                 ├── 按顺序执行每个节点
                                 ├── 缓存中间结果
                                 └── 返回最终输出
```

### 1.4 反馈循环工作流程

```
用户操作                          系统响应
─────────────────────────────────────────────────────────────────
点击 "Auto Tune" 按钮       →    runFeedbackLoop()
                                 │
                                 ├── feedbackController.autoTune()
                                 │   │
                                 │   ├── 循环 (最多 5 次):
                                 │   │   ├── 执行当前转移
                                 │   │   ├── 分析匹配分数
                                 │   │   ├── 生成调整建议
                                 │   │   ├── 应用建议
                                 │   │   └── 检查收敛 (分数 ≥ 90 或改进 < 0.5%)
                                 │   │
                                 │   └── 返回最终结果
                                 │
                                 └── 更新 UI 显示进度和最终分数
```

### 1.5 参考图片搜索工作流程

```
用户操作                          系统响应
─────────────────────────────────────────────────────────────────
点击 "Reference Search"     →    toggleReferenceDiscovery()
                                 └── 显示 ReferenceDiscoveryPanel

输入搜索词 + 点击 Search    →    searchService.search(query, sources)
                                 │
                                 ├── 检查 API Key 是否配置
                                 ├── 并行调用 Unsplash/Pexels API
                                 ├── 合并结果
                                 └── renderResults() 显示图片网格

点击图片选择                →    selectImage(card)
                                 └── 显示预览和 "Use as Reference" 按钮

点击 "Use as Reference"     →    useAsReference()
                                 │
                                 ├── 加载图片到 canvas
                                 ├── 获取 ImageData
                                 ├── 设置为 targetImage
                                 └── 关闭搜索面板
```

### 1.6 预设系统工作流程

```
用户操作                          系统响应
─────────────────────────────────────────────────────────────────
点击 "Presets" 按钮         →    togglePresetPanel()
                                 └── 显示预设列表

点击预设卡片                →    presetManager.loadPreset(name)
                                 │
                                 ├── 解析节点图 JSON
                                 ├── 重建 nodeGraph
                                 └── 执行并显示结果

保存当前设置为预设          →    presetManager.savePreset(config)
                                 │
                                 ├── 序列化 nodeGraph
                                 ├── 生成缩略图
                                 └── 存储到 localStorage
```

---

## 二、后端逻辑（MCP 服务）

### 2.1 MCP 服务启动流程

```
启动命令                          系统响应
─────────────────────────────────────────────────────────────────
node server.js             →    createServer().start()
                                 │
                                 ├── 解析命令行参数
                                 │   └── --transport stdio|http
                                 │
                                 ├── stdio 模式:
                                 │   └── 监听 stdin，解析 JSON-RPC 2.0 消息
                                 │
                                 └── HTTP 模式:
                                     └── 启动 Express 服务器 (端口 3456)
```

### 2.2 MCP 协议交互流程

```
AI Agent 请求                     MCP Server 响应
─────────────────────────────────────────────────────────────────
initialize                 →    handleInitialize()
                                 └── 返回协议版本和能力声明

tools/list                 →    handleListTools()
                                 └── 返回 20 个工具定义

tools/call                 →    handleToolCall(name, args)
  { name: "chromamatch_         │
    generate_image",            ├── 路由到对应处理器
    arguments: {...} }          │
                                 └── 返回 { content: [...] }
```

### 2.3 图片生成工作流程

```
AI Agent 调用                     MCP Server 处理
─────────────────────────────────────────────────────────────────
chromamatch_generate_image →    generateImage(options)
  {                              │
    provider: "openai",          ├── 解析 provider 配置
    prompt: "...",               │   └── 从 BUILTIN_PROVIDERS 获取
    size: "1024x1024"            │
  }                              ├── 获取 API Key
                                 │   └── 优先级: runtime > env var
                                 │
                                 ├── 构建 HTTP 请求
                                 │   ├── 替换模板占位符
                                 │   └── 合并 extra_params
                                 │
                                 ├── 调用 API
                                 │   └── POST {baseUrl}{endpoint}
                                 │
                                 ├── 提取响应
                                 │   └── 按 responseExtractor 解析
                                 │
                                 └── 返回结果
                                     └── { success, image: "data:..." }
```

### 2.4 自定义 Provider 注册流程

```
AI Agent 调用                     MCP Server 处理
─────────────────────────────────────────────────────────────────
chromamatch_register_      →    registerProvider(config)
  provider({                     │
    id: "my-api",                ├── 验证必填字段
    base_url: "https://...",     │
    endpoint: "/generate",       ├── 存储到 customProviders Map
    model: "flux-pro"            │
  })                             ├── 注册 API Key 环境变量
                                 │   └── MY_API_API_KEY
                                 │
                                 └── 返回 provider 对象
```

### 2.5 API Key 管理流程

```
来源                              处理方式
─────────────────────────────────────────────────────────────────
环境变量 (.env)            →    dotenv.config() 加载
                                 └── process.env.OPENAI_API_KEY

运行时注入 (MCP 工具)      →    setApiKey(provider, key)
                                 └── 存储到 runtimeKeys Map (内存)

获取密钥                    →    getApiKey(provider)
                                 └── 优先级: runtimeKeys > process.env
```

---

## 三、数据流图

### 3.1 颜色转移数据流

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐
│ Source Image│     │ Ref Image   │     │ Transfer Options    │
│ (ImageData) │     │ (ImageData) │     │ {method, strength}  │
└──────┬──────┘     └──────┬──────┘     └──────────┬──────────┘
       │                   │                       │
       └───────────────────┼───────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │    ColorTransfer       │
              │  ┌──────────────────┐  │
              │  │ 1. RGB → LAB     │  │
              │  │ 2. 计算均值/标准差│  │
              │  │ 3. 应用统计转移  │  │
              │  │ 4. LAB → RGB     │  │
              │  └──────────────────┘  │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Result ImageData     │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   ImageAdjustments     │
              │  (temperature, tint,   │
              │   exposure, contrast...)│
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Final Result         │
              │   (显示在 resultCanvas) │
              └────────────────────────┘
```

### 3.2 节点图执行数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                        Node Graph                                │
│                                                                  │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌────────┐│
│  │ Source   │────→│ Transfer │────→│ Curves   │────→│ Output ││
│  │ (image)  │     │ (image)  │     │ (image)  │     │(result)││
│  └──────────┘     └────┬─────┘     └──────────┘     └────────┘│
│                        │                                        │
│  ┌──────────┐          │                                        │
│  │ Reference│──────────┘                                        │
│  │ (image)  │                                                   │
│  └──────────┘                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼ 拓扑排序执行
              ┌────────────────────────┐
              │ NodeProcessor.execute()│
              │                        │
              │ for node in order:     │
              │   inputs = collect()   │
              │   output = process()   │
              │   cache(node, output)  │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ Final ImageData        │
              └────────────────────────┘
```

---

## 四、文件职责对照表

| 文件 | 层级 | 职责 |
|------|------|------|
| `index.html` | UI | 页面结构、DOM 元素定义 |
| `styles.css` | UI | 样式、主题、响应式布局 |
| `src/ui/app.js` | 控制器 | 主协调器、事件绑定、状态管理 |
| `src/ui/node-editor.js` | UI | 节点画布渲染、交互处理 |
| `src/ui/inspector.js` | UI | 参数面板、AI 提示显示 |
| `src/engine/transfer/color-transfer.js` | 引擎 | 颜色转移算法实现 |
| `src/engine/adjustments/image-adjustments.js` | 引擎 | 后期调整滑块处理 |
| `src/engine/matching/smart-matcher.js` | 引擎 | ΔE2000 计算、自适应强度 |
| `src/engine/nodes/node-graph.js` | 引擎 | DAG 数据结构、执行引擎 |
| `src/engine/nodes/node-types.js` | 引擎 | 30+ 节点类型定义 |
| `src/engine/nodes/node-processor.js` | 引擎 | 节点执行器、缓存管理 |
| `src/analysis/color-analysis.js` | 分析 | 直方图、向量图、匹配分数 |
| `src/feedback/feedback-controller.js` | 控制 | 自动调优循环逻辑 |
| `src/search/reference-discovery.js` | 服务 | 图库搜索、AI 生成面板 |
| `src/presets/preset-manager.js` | 存储 | 预设 CRUD 操作 |
| `src/config/api-keys.js` | 配置 | 浏览器端密钥加密存储 |
| `mcp-server/server.js` | 入口 | MCP 服务启动入口 |
| `mcp-server/transport.js` | 传输 | stdio/HTTP 双传输层 |
| `mcp-server/handler.js` | 路由 | MCP 工具调用路由 |
| `mcp-server/tools.js` | 定义 | 20 个 MCP 工具定义 |
| `mcp-server/image-gen.js` | 服务 | 通用图片生成适配器 |
| `mcp-server/config/keys.js` | 配置 | 服务端密钥管理 |

---

## 五、关键交互时序图

### 5.1 用户执行颜色转移

```
用户          app.js       ColorTransfer    SmartMatcher    ColorAnalysis
 │              │               │               │               │
 │──上传图片──→│               │               │               │
 │              │──存储 ImageData              │               │
 │              │               │               │               │
 │──点击转移──→│               │               │               │
 │              │──transferColors()→│          │               │
 │              │               │──计算 LAB 统计│               │
 │              │               │──应用转移     │               │
 │              │←──返回 ImageData│            │               │
 │              │               │               │               │
 │              │──computeMatchScore()────────→│               │
 │              │               │               │──ΔE2000 计算 │
 │              │←──────────────返回分数────────│               │
 │              │               │               │               │
 │              │──analyzeImage()──────────────────────────────→│
 │              │←──────────────────────────返回分析结果────────│
 │              │               │               │               │
 │←─更新 UI────│               │               │               │
```

### 5.2 AI Agent 调用图片生成

```
Agent         MCP Server    handler.js    image-gen.js    OpenAI API
 │               │              │              │              │
 │──initialize──→│              │              │              │
 │←─协议信息────│              │              │              │
 │               │              │              │              │
 │──tools/list──→│              │              │              │
 │←─工具定义────│              │              │              │
 │               │              │              │              │
 │──generate────→│              │              │              │
 │  image        │──路由──────→│              │              │
 │               │              │──generateImage()→│          │
 │               │              │              │──获取 API Key│
 │               │              │              │──构建请求────→│
 │               │              │              │              │
 │               │              │              │←─返回图片────│
 │               │              │              │──提取 base64 │
 │               │              │←─返回结果───│              │
 │               │←─MCP 响应───│              │              │
 │←─图片数据────│              │              │              │
```

---

*此文档描述了 ChromaMatch Lite 的完整工作流程，包括用户交互、后端处理、数据流向和文件职责。*
