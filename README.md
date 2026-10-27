# 🛡️ 隐私护盾 (Privacy Shield for DeepSeek Harness)

> **仅留在本机的内容** —— 发往云端前自动替身，收到回复后无缝归位。  
> Local HMAC-SHA256 Secret & PII Masking, Streaming Unmasking, and Visual Security Dashboard for DeepSeek Harness (DSH).

![Privacy Shield Dashboard Preview](assets/dashboard-preview.png)

---

## ✨ 核心特性

- **全局请求拦截与脱敏（Pre-request Masking）**：挂载在 DSH 全局 `llm/stream` 瀑布流切面上。在 Prompt 发往任何大模型（包括经由网关转发的 Provider 或直接调用的模型）之前，自动识别 23 类敏感数据并替换为确定性占位符（如 `{{API_KEY_oqsxkpdh}}`）。
- **零明文落盘保障（In-memory Vault）**：敏感明文绝不写入磁盘，仅在 Node.js 进程内存 Map 中临时驻留；磁盘仅记录脱敏后的结构审计日志与哈希摘要。
- **确定性与抗彩虹表反推（HMAC-SHA256）**：基于本机独有的 32 字节私钥 `redact.key` 生成 8 位 Base32 签名，同一敏感值在同一设备上始终生成相同占位符（保持 Prompt Cache 命中率），且数学上不可逆推。
- **流式跨 Chunk 无痕还原（Streaming Unmasking）**：内置字符状态机（`splitPartialTail`），自动拼接被大模型流式切片拆碎的 Token（例如 `...{{API_KEY_` 与 `oqsxkpdh}}...`），在实时打字机与最终工具调用块中无感还原真实内容。
- **原生极简观测大盘（Visual Dashboard）**：
  - 极简原生设计大盘：总脱敏数、独立敏感值、请求数、7天/30天柱状图、数据流向图。
  - 双栏透视对比：查看单次请求的「本机原貌」与「云端所见」实时 Diff。
  - 实时沙盒测试（Try it）：输入测试文本，实时预览脱敏效果与微秒级处理耗时。
  - 聊天窗口右上角常驻 `🛡️` 实时护盾胶囊。
- **历史记录安全归档（Historical Archive Sync）**：支持自动归档与分析历史脱敏账本，无需重新积累历史统计。

---

## 📦 支持识别的敏感数据类别

| 大类 | 实体类别 (`Kind`) | 识别范围 |
| :--- | :--- | :--- |
| **机密凭证** | `API_KEY` | OpenAI (`sk-`), Anthropic (`sk-ant-`), GitHub (`ghp_`/`github_pat_`), Google (`AIza`), AWS (`AKIA`/`ASIA`), HuggingFace, xAI, npm, Stripe 等 |
| | `PRIVATE_KEY` | RSA/EC/OPENSSH PEM 私钥块 (`-----BEGIN PRIVATE KEY-----`) |
| | `TOKEN` | JWT Token (`eyJ...`) |
| | `PASSWORD` | 命令行/URL/配置文件/自然语言中的明文口令与密码 |
| | `SECRET` | 配置文件与键值对中的各类高熵密钥 |
| **个人隐私** | `EMAIL` | 电子邮箱（排除常见的测试/示例域名） |
| | `PHONE` | 多国电话号码（中国大陆 +86、北美 +1 NANP、英国 +44、欧洲 +49/+33、日本 +81、新加坡 +65 等 E.164 格式） |
| | `ID_CARD` | 多国身份证件（中国大陆 18 位身份证 GB 11643、中国香港 HKID、中国台湾身分证、英国国民保险号 NINO 等） |
| | `BANK_CARD` | 银行卡号（Luhn 模10 校验） |
| | `IP` | IPv4 / IPv6 地址（排除局部环回与公共 DNS） |
| | `MAC` | 物理网卡地址（排除占位测试地址） |
| | `USERNAME` | 本机用户主目录路径名 (`/Users/...`, `/home/...`) |
| | `BUCKET` | S3 / OSS / GCS / COS / R2 云存储桶名 |
| **自定义** | `TERM` | 用户在面板中自定义配置的敏感词（支持大小写模糊匹配） |

---

## 🚀 安装与使用

在 DSH 环境中运行：

```bash
# 从 npm 安装
dsh plugin --profile web add dsh-privacy-shield

# 或在本地源码目录安装
dsh plugin --profile web add ./dsh-privacy-shield
```

安装后刷新 DSH 网页端：
1. 点击左侧设置齿轮 $\rightarrow$ **「隐私护盾」** 进入安全大盘与策略配置。
2. 聊天窗口右上角将显示 `🛡️` 徽标，实时呈现当前拦截状态。

---

## 🛠️ 本地开发与构建

```bash
# 安装依赖
pnpm install

# 运行单元测试
node --experimental-strip-types --test tests/shield.test.ts

# 编译打包 (输出到 lib/)
npm run build
```

---

## ☕ 赞助与支持 (Donate & Sponsor)

如果你觉得「隐私护盾」保护了你的密钥与数据安全，欢迎请作者喝杯咖啡！你的支持是持续维护规则库与功能演进的最大动力：

- **GitHub Sponsors**: [Sponsor @Lukeknow0](https://github.com/sponsors/Lukeknow0)
- **Buy Me a Coffee**: [buymeacoffee.com/lukeknow0](https://www.buymeacoffee.com/lukeknow0)
- **微信 / 支付宝**: 可在仓库 Issue 或 Discussions 中留言赞助支持 ☕

---

## 📄 License

MIT License © 2026
