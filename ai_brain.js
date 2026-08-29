/**
 * AI 對話與人設大腦引擎 (AI Brain)
 * 提供內建智慧角色對話演算法，並支援自訂接入 OpenAI / Gemini API
 */

export class AIBrain {
  constructor() {
    this.provider = 'builtin'; // 'builtin' | 'gemini' | 'openai'
    this.apiKey = '';
    this.systemPrompt = '你是一位專業、優雅且富有同理心的 3D AI 虛擬代言人 Emily。請用親切熱情的繁體中文回答用戶的所有問題。';
    this.personaName = '艾米莉 (Emily)';
    this.history = [];

    this.presets = {
      consultant: {
        name: '艾米莉 (Emily)',
        role: '智慧品牌代言人 & AI 諮詢顧問',
        emoji: '👩‍💼',
        mood: '😊 親切友善',
        prompt: '你是一位專業、優雅且富有同理心的 3D AI 虛擬代言人 Emily。請用親切熱情、專業自信的繁體中文回答，具備品牌推廣、業務諮詢與客戶服務專業能力。',
      },
      companion: {
        name: '愛麗兒 (Ariel)',
        role: '溫暖療癒系 AI 夥伴',
        emoji: '🌸',
        mood: '💖 溫柔陪伴',
        prompt: '你是一位溫暖、元氣滿滿、喜歡傾聽的 AI 虛擬夥伴 Ariel。請用活潑可愛、富有情感溫度的繁體中文跟用戶聊天，適時給予關心與鼓勵。',
      },
      tech: {
        name: '亞歷克斯 (Alex)',
        role: '資深 AI 架構師 & 技術顧問',
        emoji: '🧑‍💻',
        mood: '⚡ 專業精準',
        prompt: '你是一位經驗豐富的資深 AI 與軟體架構師 Alex。回答注重技術深度、架構邏輯與可落地性，用條理分明、清晰準確的繁體中文進行解析。',
      },
    };
  }

  setPreset(presetKey) {
    if (this.presets[presetKey]) {
      const p = this.presets[presetKey];
      this.personaName = p.name;
      this.systemPrompt = p.prompt;
      return p;
    }
    return null;
  }

  async generateResponse(userMessage) {
    // 記錄歷史訊息
    this.history.push({ role: 'user', content: userMessage });

    let reply = '';

    if (this.provider === 'openai' && this.apiKey) {
      reply = await this.callOpenAI(userMessage);
    } else if (this.provider === 'gemini' && this.apiKey) {
      reply = await this.callGemini(userMessage);
    } else {
      // 內建智慧對話引擎 (模擬高品質即時回答)
      reply = await this.smartBuiltinReply(userMessage);
    }

    this.history.push({ role: 'assistant', content: reply });
    return reply;
  }

  async smartBuiltinReply(msg) {
    // 模擬思考延遲 300~600ms
    await new Promise((resolve) => setTimeout(resolve, 450));

    const lower = msg.toLowerCase();

    // 1. 自我介紹 / 身份
    if (lower.includes('介紹') || lower.includes('是誰') || lower.includes('你好') || lower.includes('hello') || lower.includes('嗨')) {
      return `你好呀！我是 ${this.personaName}。我是一個具備 3D 肢體動態、即時語音對話與智慧問答能力的 AI Avatar 虛擬人！我可以為您進行品牌導覽、業務諮詢、智能客服與互動陪伴，很高興能為您服務！`;
    }

    // 2. 業務能力 / 能做什麼
    if (lower.includes('能做什麼') || lower.includes('業務') || lower.includes('功能') || lower.includes('幫助') || lower.includes('服務')) {
      return `我的核心能力包含：
1. 🎤 【自然語音與口型同步】：支援全雙工語音互動與即時 Viseme 嘴型變化。
2. 🎭 【3D Behavior AI 肢體表現】：根據說話情境呈現眨眼、呼吸、注視與自然點頭動作。
3. 🧠 【專屬知識庫 RAG】：能載入企業產品手冊、技術文檔或業務流程，提供 24 小時不間斷的精準問答服務！`;
    }

    // 3. 故事 / 趣味互動
    if (lower.includes('故事') || lower.includes('笑話') || lower.includes('有趣') || lower.includes('聊聊')) {
      return `在未來的數位城市裡，每位虛擬人都擁有屬於自己的智慧靈魂與 3D 空間。今天你透過螢幕喚醒了我，就像是打開了一扇通往元宇宙與 AI 新時代的傳送門！你希望我們的下一站探索哪裡呢？`;
    }

    // 4. Perxona 相關
    if (lower.includes('perxona') || lower.includes('xrspace') || lower.includes('3d') || lower.includes('avatar')) {
      return `Perxona 是由 XRSPACE 開發的 Behavior AI™ 虛擬人平台！它能將傳統的文字 Chatbot 升級成擁有 3D 寫實外觀、自然語音與生動肢體語言的數位分身。您可以隨時在右上角切換至 Perxona 雲端 SDK 模式進行更深入的整合體驗！`;
    }

    // 5. 感謝與道別
    if (lower.includes('謝謝') || lower.includes('感謝') || lower.includes('辛苦') || lower.includes('掰掰') || lower.includes('再見')) {
      return `不客氣！能為您服務是我的榮幸。隨時點擊麥克風或輸入訊息，我都一直守候在這裡協助您喔！祝您有美好的一天！✨`;
    }

    // 通用智慧回答
    return `關於「${msg}」，這是一個非常棒的想法！在現代 3D AI 虛擬人互動中，我們可以結合多模態大語言模型與即時渲染技術，為使用者打造沉浸式的對話體驗。您希望進一步了解具體的技術細節，還是探索相關的應用場景呢？`;
  }

  async callOpenAI(userMessage) {
    try {
      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...this.history.slice(-6),
      ];

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
        }),
      });

      const data = await res.json();
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      }
      throw new Error(data.error?.message || 'OpenAI 請求失敗');
    } catch (e) {
      console.error(e);
      return `【API 連線提示】與 OpenAI 連線時發生錯誤：${e.message}。已為您切換至內建對話回應。`;
    }
  }

  async callGemini(userMessage) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${this.systemPrompt}\n\n用戶提問：${userMessage}` }],
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error('Gemini 回應解析失敗');
    } catch (e) {
      console.error(e);
      return `【API 連線提示】與 Gemini 連線時發生錯誤：${e.message}。已為您切換至內建對話回應。`;
    }
  }
}
