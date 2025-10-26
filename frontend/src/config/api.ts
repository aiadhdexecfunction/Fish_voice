// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Accounts
  accounts: {
    register: `${API_BASE_URL}/accounts/register`,
    login: `${API_BASE_URL}/accounts/login`,
    get: (username: string) => `${API_BASE_URL}/accounts/${username}`,
    updateVoiceModel: (username: string) => `${API_BASE_URL}/accounts/${username}/voice-model`,
  },
  
  // Tasks
  tasks: {
    getAll: `${API_BASE_URL}/tasks/`,
    add: `${API_BASE_URL}/tasks/add`,
    update: (taskName: string) => `${API_BASE_URL}/tasks/update/${taskName}`,
    delete: (taskName: string) => `${API_BASE_URL}/tasks/delete/${taskName}`,
    addSubtask: `${API_BASE_URL}/tasks/subtask/add`,
    removeSubtask: `${API_BASE_URL}/tasks/subtask/remove`,
  },
  
  // Preferences
  preferences: {
    personalities: `${API_BASE_URL}/prefs/personalities`,
    get: (userId: string) => `${API_BASE_URL}/prefs/${userId}`,
    setVoice: (userId: string) => `${API_BASE_URL}/prefs/${userId}/voice`,
    setPersonality: (userId: string) => `${API_BASE_URL}/prefs/${userId}/personality`,
    setVoiceModel: (userId: string) => `${API_BASE_URL}/prefs/${userId}/voice-model`,
  },
  
  // Chat
  chat: {
    send: `${API_BASE_URL}/chat/send`,
    history: (userId: string) => `${API_BASE_URL}/chat/history/${userId}`,
  },
  
  // Pomodoro
  pomodoro: {
    start: `${API_BASE_URL}/pomodoro/start`,
    stop: `${API_BASE_URL}/pomodoro/stop`,
  },
  
  // Voice
  voice: {
    say: `${API_BASE_URL}/voice/say`,
    asr: `${API_BASE_URL}/voice/asr`,
    models: `${API_BASE_URL}/voice/models`,
  },
  
  // WebSocket
  websocket: {
    events: (userId: string) => `ws://localhost:8000/ws/events/${userId}`,
  },
};

export default API_ENDPOINTS;

