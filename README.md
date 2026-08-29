# Perxona 3D AI Avatar 整合專案指南

本專案提供基於 **XRSPACE Perxona (perxona.ai)** 平台的 3D AI 虛擬人（Behavior AI™）Web 整合示範。

---

## 📖 製作與整合步驟

### 第一步：在 Perxona 官方平台建立虛擬人角色
1. 進入 [Perxona Console](https://console.perxona.ai) 註冊/登入帳號。
2. **建立 Agent (Agent Studio)**：
   - **外觀與模型 (3D Avatar)**：挑選適合您品牌的 3D 角色形象。
   - **聲音與語系 (Voice & Language)**：設定 TTS 語音、語速與預設語言（支援多國語言與中文）。
   - **角色個性 (Persona & Prompt)**：設定 System Prompt（例如：「你是一位親切的旅遊諮詢顧問...」）。
   - **知識庫 (Knowledge Base / RAG)**：上傳 PDF、文件或貼上網址，賦予 AI 專屬專業知識。

---

### 第二步：取得整合憑證 (API Credentials)
1. 在 Agent 設定中的 **Integration** / **Share** 頁籤：
   - 複製 **Deployment API Key**（`apiKey`）。
   - 複製 **Agent Profile ID**（`agentProfileId`，格式通常如 `agp_xxxxxxxx`）。
2. **設定網域白名單 (Deployment Access Control)**：
   - 將您預計運行的網域名稱加入白名單（例如：本地測試請加入 `localhost` 或 `127.0.0.1`，正式環境填寫您的正式網域）。

---

### 第三步：本地啟動與測試

由於 Perxona SDK 需要透過 HTTP/HTTPS 協議載入 Web Component，請使用本地伺服器啟動網頁：

#### 方式 A：使用 Python（推薦）
在終端機中執行：
```bash
python -m http.server 8000
```
接著打開瀏覽器造訪：`http://localhost:8000`

#### 方式 B：使用 Node.js / npx
```bash
npx serve .
```

---

### 第四步：在程式碼中自由調用

若要直接將 Perxona Avatar 嵌入到您現有的網站或專案中，只需兩段程式碼：

```html
<!-- 1. 引入 Perxona SDK -->
<script type="module" src="https://cdn.perxona.ai/prod/latest/widget/entry/index.js"></script>

<!-- 2. 放置自訂標籤 -->
<sv-agent 
  apiKey="YOUR_DEPLOYMENT_API_KEY" 
  agentProfileId="YOUR_AGENT_PROFILE_ID" 
  conversationMode="inputText" 
  displayMode="fullPresentation">
</sv-agent>
```

#### 參數說明：
- `conversationMode`: 
  - `inputText`: 純文字輸入對話模式
  - `voice`: 語音麥克風互動模式
- `displayMode`: 
  - `fullPresentation`: 完整舞台展示模式
  - `floating`: 懸浮右下角氣泡模式
  - `inline`: 內嵌區塊模式
