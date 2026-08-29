import { Avatar3D } from './avatar3d.js';
import { SpeechManager } from './speech.js';
import { AIBrain } from './ai_brain.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化 3D Avatar 引擎
  const avatar = new Avatar3D('avatarCanvas');

  // 2. 初始化 AI 大腦
  const brain = new AIBrain();

  // 3. UI 元素參照
  const subtitleBox = document.getElementById('speechSubtitle');
  const subtitleText = document.getElementById('subtitleText');
  const avatarStatusDot = document.getElementById('avatarStatusDot');
  const avatarStatusText = document.getElementById('avatarStatusText');
  const chatMessages = document.getElementById('chatMessages');
  const userInput = document.getElementById('userInput');
  const btnSend = document.getElementById('btnSend');
  const btnMic = document.getElementById('btnMic');
  const micStatus = document.getElementById('micStatus');
  const btnVoiceToggle = document.getElementById('btnVoiceToggle');
  const voiceIcon = document.getElementById('voiceIcon');
  const voiceLabel = document.getElementById('voiceLabel');

  // 模式切換與設定視窗
  const tabBuiltin = document.getElementById('tabBuiltin');
  const tabPerxona = document.getElementById('tabPerxona');
  const builtinStage = document.getElementById('builtinStage');
  const perxonaStage = document.getElementById('perxonaStage');
  const perxonaSdkContainer = document.getElementById('perxonaSdkContainer');
  const btnSettings = document.getElementById('btnSettings');
  const settingsModal = document.getElementById('settingsModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const btnOpenPerxonaConfig = document.getElementById('btnOpenPerxonaConfig');

  // 人設卡片
  const personaNameEl = document.getElementById('personaName');
  const personaRoleEl = document.getElementById('personaRole');
  const personaEmojiEl = document.getElementById('personaEmoji');
  const personaMoodEl = document.getElementById('personaMood');

  // 4. 初始化語音模組
  const speech = new SpeechManager(
    // onSpeechStart: Avatar 開始講話
    (spokenText) => {
      avatar.setSpeaking(true);
      avatarStatusDot.className = 'status-indicator speaking';
      avatarStatusText.textContent = '說話中 (Speaking)';
      subtitleText.textContent = spokenText;
      subtitleBox.classList.remove('hidden');
    },
    // onSpeechEnd: Avatar 結束講話
    () => {
      avatar.setSpeaking(false);
      avatarStatusDot.className = 'status-indicator';
      avatarStatusText.textContent = '待命中 (Idle)';
      setTimeout(() => {
        subtitleBox.classList.add('hidden');
      }, 1200);
    },
    // onVisemeUpdate: 嘴型更新
    (event) => {
      // 依發音邊界進一步微調
    }
  );

  // 5. 訊息發送與對話處理核心函式
  async function handleSendMessage(rawText) {
    const text = (rawText || userInput.value).trim();
    if (!text) return;

    // 清空輸入框
    userInput.value = '';
    userInput.style.height = 'auto';

    // 1. 新增使用者訊息
    appendChatMessage('user', text);

    // 2. 設為思考狀態
    avatarStatusDot.className = 'status-indicator thinking';
    avatarStatusText.textContent = '思考中 (Thinking)...';

    try {
      // 3. AI 大腦生成回應
      const reply = await brain.generateResponse(text);

      // 4. 新增助手訊息
      appendChatMessage('assistant', reply);

      // 5. 3D Avatar 語音朗讀與動作觸發
      speech.speak(reply);
    } catch (e) {
      console.error(e);
      appendChatMessage('system', `抱歉，處理您的請求時發生問題：${e.message}`);
      avatarStatusDot.className = 'status-indicator';
      avatarStatusText.textContent = '待命中 (Idle)';
    }
  }

  function appendChatMessage(role, text) {
    const item = document.createElement('div');
    item.className = `message-item ${role}`;

    if (role === 'system') {
      item.innerHTML = `<div class="msg-bubble system">${escapeHtml(text)}</div>`;
    } else if (role === 'user') {
      item.innerHTML = `
        <div class="msg-content">
          <div class="msg-sender">You</div>
          <div class="msg-bubble">${escapeHtml(text)}</div>
        </div>
      `;
    } else {
      item.innerHTML = `
        <div class="msg-avatar">${personaEmojiEl.textContent}</div>
        <div class="msg-content">
          <div class="msg-sender">${escapeHtml(personaNameEl.textContent)}</div>
          <div class="msg-bubble">${formatReplyText(text)}</div>
        </div>
      `;
    }

    chatMessages.appendChild(item);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  function formatReplyText(str) {
    return escapeHtml(str).replace(/\n/g, '<br/>');
  }

  // 6. 綁定事件監聽
  btnSend.addEventListener('click', () => handleSendMessage());

  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // 自動伸展輸入框
  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = `${Math.min(userInput.scrollHeight, 120)}px`;
  });

  // 快捷問題按鈕 (Prompt Chips)
  document.querySelectorAll('.prompt-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      handleSendMessage(chip.getAttribute('data-text'));
    });
  });

  // 麥克風語音對話
  btnMic.addEventListener('click', () => {
    if (speech.isRecording) {
      speech.stopListening();
      btnMic.classList.remove('recording');
      micStatus.classList.add('hidden');
    } else {
      speech.startListening(
        (transcript) => {
          btnMic.classList.remove('recording');
          micStatus.classList.add('hidden');
          handleSendMessage(transcript);
        },
        (err) => {
          btnMic.classList.remove('recording');
          micStatus.classList.add('hidden');
        },
        () => {
          btnMic.classList.remove('recording');
          micStatus.classList.add('hidden');
        }
      );
      btnMic.classList.add('recording');
      micStatus.classList.remove('hidden');
    }
  });

  // 語音開關
  btnVoiceToggle.addEventListener('click', () => {
    speech.isVoiceEnabled = !speech.isVoiceEnabled;
    if (speech.isVoiceEnabled) {
      voiceIcon.textContent = '🔊';
      voiceLabel.textContent = '語音開啟';
      btnVoiceToggle.style.color = '#e2e8f0';
    } else {
      speech.stopSpeaking();
      voiceIcon.textContent = '🔇';
      voiceLabel.textContent = '語音靜音';
      btnVoiceToggle.style.color = '#94a3b8';
    }
  });

  // 舞台背景切換
  document.querySelectorAll('.stage-ctrl-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stage-ctrl-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      avatar.setBackgroundTheme(btn.getAttribute('data-bg'));
    });
  });

  // 模式頁籤切換 (內建 3D Avatar vs Perxona 雲端 SDK)
  tabBuiltin.addEventListener('click', () => {
    tabBuiltin.classList.add('active');
    tabPerxona.classList.remove('active');
    builtinStage.classList.add('active');
    perxonaStage.classList.remove('active');
  });

  tabPerxona.addEventListener('click', () => {
    tabPerxona.classList.add('active');
    tabBuiltin.classList.remove('active');
    perxonaStage.classList.add('active');
    builtinStage.classList.remove('active');
    renderPerxonaWidget();
  });

  function renderPerxonaWidget() {
    const apiKey = localStorage.getItem('perxona_api_key') || '';
    const profileId = localStorage.getItem('perxona_profile_id') || '';
    const convMode = localStorage.getItem('perxona_conv_mode') || 'inputText';

    if (!apiKey || !profileId) {
      perxonaSdkContainer.innerHTML = `
        <div class="sdk-placeholder">
          <div class="icon">✨</div>
          <h3>Perxona Cloud SDK 模式</h3>
          <p>尚未設定 Perxona 憑證。請填入您的 API Key 與 Agent Profile ID 即可載入官方 3D Behavior AI 虛擬人！</p>
          <button id="btnOpenPerxonaConfigInline" class="btn-primary-small">立即設定憑證</button>
        </div>
      `;
      document.getElementById('btnOpenPerxonaConfigInline')?.addEventListener('click', openSettings);
      return;
    }

    perxonaSdkContainer.innerHTML = '';
    const svAgent = document.createElement('sv-agent');
    svAgent.setAttribute('apiKey', apiKey);
    svAgent.setAttribute('agentProfileId', profileId);
    svAgent.setAttribute('presentationMode', 'embedded');
    perxonaSdkContainer.appendChild(svAgent);
  }

  // 設定視窗開關
  function openSettings() {
    settingsModal.classList.remove('hidden');
  }
  function closeSettings() {
    settingsModal.classList.add('hidden');
  }

  btnSettings.addEventListener('click', openSettings);
  btnOpenPerxonaConfig?.addEventListener('click', openSettings);
  btnCloseModal.addEventListener('click', closeSettings);

  // 設定視窗內頁籤切換
  document.querySelectorAll('.settings-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.settings-tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.settings-section').forEach((sec) => sec.classList.remove('active'));
      btn.classList.add('active');
      const targetSec = document.getElementById(btn.getAttribute('data-section'));
      if (targetSec) targetSec.classList.add('active');
    });
  });

  // 人設模板連動
  const selectPersonaPreset = document.getElementById('selectPersonaPreset');
  const cfgPersonaName = document.getElementById('cfgPersonaName');
  const cfgSystemPrompt = document.getElementById('cfgSystemPrompt');

  selectPersonaPreset.addEventListener('change', () => {
    const val = selectPersonaPreset.value;
    if (val !== 'custom') {
      const p = brain.setPreset(val);
      if (p) {
        cfgPersonaName.value = p.name;
        cfgSystemPrompt.value = p.prompt;
      }
    }
  });

  // 語速音調控制
  const cfgVoiceRate = document.getElementById('cfgVoiceRate');
  const cfgVoicePitch = document.getElementById('cfgVoicePitch');
  const valRate = document.getElementById('valRate');
  const valPitch = document.getElementById('valPitch');

  cfgVoiceRate.addEventListener('input', () => {
    valRate.textContent = `${cfgVoiceRate.value}x`;
    speech.voiceRate = parseFloat(cfgVoiceRate.value);
  });
  cfgVoicePitch.addEventListener('input', () => {
    valPitch.textContent = `${cfgVoicePitch.value}`;
    speech.voicePitch = parseFloat(cfgVoicePitch.value);
  });

  // AI Provider 切換
  const cfgLlmProvider = document.getElementById('cfgLlmProvider');
  const apiKeyWrap = document.getElementById('apiKeyWrap');
  cfgLlmProvider.addEventListener('change', () => {
    if (cfgLlmProvider.value === 'builtin') {
      apiKeyWrap.style.display = 'none';
    } else {
      apiKeyWrap.style.display = 'flex';
    }
  });

  // 載入儲存的設定
  const loadSavedSettings = () => {
    const defaultKey = 'fe502a49-39a1-437a-b119-c9adc3bb8bac';
    const defaultProfileId = '01M15QYPRERRK4XX8EXC2ZJV6W';
    
    const savedApiKey = defaultKey;
    const savedProfileId = defaultProfileId;
    const savedConvMode = localStorage.getItem('perxona_conv_mode') || 'inputText';

    localStorage.setItem('perxona_api_key', savedApiKey);
    localStorage.setItem('perxona_profile_id', savedProfileId);

    document.getElementById('cfgPerxonaApiKey').value = savedApiKey;
    document.getElementById('cfgPerxonaProfileId').value = savedProfileId;
    document.getElementById('cfgPerxonaConvMode').value = savedConvMode;
  };
  loadSavedSettings();

  // 儲存設定
  btnSaveSettings.addEventListener('click', () => {
    // 儲存人設
    const presetKey = selectPersonaPreset.value;
    if (presetKey !== 'custom') {
      const p = brain.presets[presetKey];
      if (p) {
        personaNameEl.textContent = cfgPersonaName.value || p.name;
        personaRoleEl.textContent = p.role;
        personaEmojiEl.textContent = p.emoji;
        personaMoodEl.textContent = p.mood;
      }
    } else {
      personaNameEl.textContent = cfgPersonaName.value;
      personaRoleEl.textContent = '自訂 AI 虛擬助手';
      personaEmojiEl.textContent = '🤖';
      personaMoodEl.textContent = '✨ 專屬客製';
    }
    brain.personaName = cfgPersonaName.value;
    brain.systemPrompt = cfgSystemPrompt.value;

    // 儲存語音角色
    const selectVoiceName = document.getElementById('selectVoiceName');
    if (selectVoiceName) {
      speech.setVoiceByName(selectVoiceName.value);
    }

    // 儲存 Perxona 設定
    const perxonaApiKey = document.getElementById('cfgPerxonaApiKey').value.trim();
    const perxonaProfileId = document.getElementById('cfgPerxonaProfileId').value.trim();
    const perxonaConvMode = document.getElementById('cfgPerxonaConvMode').value;
    localStorage.setItem('perxona_api_key', perxonaApiKey);
    localStorage.setItem('perxona_profile_id', perxonaProfileId);
    localStorage.setItem('perxona_conv_mode', perxonaConvMode);

    // 儲存 AI Provider 設定
    brain.provider = cfgLlmProvider.value;
    brain.apiKey = document.getElementById('cfgLlmApiKey').value.trim();

    closeSettings();
    if (tabPerxona.classList.contains('active')) {
      renderPerxonaWidget();
    }
  });
});
