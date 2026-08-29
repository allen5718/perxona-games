/**
 * 語音模組 (Web Speech Recognition STT + Speech Synthesis TTS)
 * 負責語音轉文字、文字朗讀以及與 3D Avatar 的口型發音同步
 */

export class SpeechManager {
  constructor(onSpeechStart, onSpeechEnd, onVisemeUpdate) {
    this.onSpeechStart = onSpeechStart;
    this.onSpeechEnd = onSpeechEnd;
    this.onVisemeUpdate = onVisemeUpdate;

    this.synth = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    this.voiceRate = 1.0;
    this.voicePitch = 1.0;
    this.isVoiceEnabled = true;

    this.recognition = null;
    this.isRecording = false;

    this.initVoices();
    this.initSTT();
  }

  initVoices() {
    const updateVoiceList = () => {
      this.voices = this.synth.getVoices();
      const voiceSelect = document.getElementById('selectVoiceName');
      if (!voiceSelect) return;

      voiceSelect.innerHTML = '';
      
      // 優先尋找繁體中文 (zh-TW, zh-HK) 或中文語音
      let defaultVoiceIndex = 0;
      this.voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' [系統預設]' : ''}`;
        
        if (voice.lang.includes('zh') || voice.lang.includes('cmn') || voice.lang.includes('TW')) {
          if (!this.selectedVoice) defaultVoiceIndex = index;
        }
        voiceSelect.appendChild(option);
      });

      if (this.voices.length > 0) {
        voiceSelect.selectedIndex = defaultVoiceIndex;
        this.selectedVoice = this.voices[defaultVoiceIndex];
      }
    };

    updateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = updateVoiceList;
    }
  }

  setVoiceByName(name) {
    this.selectedVoice = this.voices.find(v => v.name === name) || this.selectedVoice;
  }

  initSTT() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('瀏覽器不支援 Web Speech API 語音識別');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'zh-TW';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
  }

  startListening(onResult, onError, onEnd) {
    if (!this.recognition) {
      alert('您的瀏覽器不支援語音輸入功能（建議使用 Google Chrome 或 Edge 瀏覽器）');
      return;
    }

    this.isRecording = true;
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
    };

    this.recognition.onerror = (err) => {
      console.error('STT Error:', err);
      this.isRecording = false;
      if (onError) onError(err);
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition already started', e);
    }
  }

  stopListening() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
    }
  }

  /**
   * 朗讀文字並觸發 3D Avatar 口型與動作
   */
  speak(text, onComplete) {
    if (!this.isVoiceEnabled) {
      if (onComplete) onComplete();
      return;
    }

    // 先取消先前的發音
    this.synth.cancel();

    if (!text || text.trim() === '') {
      if (onComplete) onComplete();
      return;
    }

    // 移除 markdown 符號，提升 TTS 朗讀自然度
    const cleanText = text
      .replace(/[#*`_~\[\]()<>]/g, '')
      .replace(/https?:\/\/\S+/g, '相關連結');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = this.voiceRate;
    utterance.pitch = this.voicePitch;

    utterance.onstart = () => {
      if (this.onSpeechStart) this.onSpeechStart(cleanText);
    };

    utterance.onboundary = (event) => {
      if (this.onVisemeUpdate) this.onVisemeUpdate(event);
    };

    utterance.onend = () => {
      if (this.onSpeechEnd) this.onSpeechEnd();
      if (onComplete) onComplete();
    };

    utterance.onerror = (e) => {
      console.error('TTS Error:', e);
      if (this.onSpeechEnd) this.onSpeechEnd();
      if (onComplete) onComplete();
    };

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth.speaking) {
      this.synth.cancel();
      if (this.onSpeechEnd) this.onSpeechEnd();
    }
  }
}
