# Body Double (Letta + Fish Audio) — Minimal

## download
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Python >= 3.10 可选：
# pip install fish-audio-sdk

cp .env.example .env  # 填入 FISH_API_KEY / LETTA_API_KEY / LETTA_AGENT_ID(可选)

## run
uvicorn app:app --reload --port 8001

## test
- 打开前端示例（见 README 最下方）或用你自己的前端
- Voice button：POST /prefs/{user_id}/voice {"enabled": true|false}
- chat：POST /chat/send {"user_id":"u_1", "text":"你好，帮我规划接下来25分钟"}
- 无回复超时（例如把 FOLLOWUP_DELAY_SEC 设为 30），将收到 msg.followup 的关怀消息
- 番茄钟：POST /pomodoro/start {"user_id":"u_1","focus_min":1,"break_min":1,"cycles":1}

## front example
```html
<!doctype html>
<meta charset="utf-8" />
<label><input type="checkbox" id="voiceToggle"> Voice 开启</label>
<div>
  <input id="inp" placeholder="对助手说点什么..." />
  <button id="send">发送</button>
</div>
<div id="chat"></div>
<audio id="bb-voice" controls></audio>
<script>
const userId = "u_1";
const audio = document.getElementById("bb-voice");
const chat = document.getElementById("chat");
const toggle = document.getElementById("voiceToggle");
fetch(`/prefs/${userId}`).then(r=>r.json()).then(({voice_enabled})=>toggle.checked=!!voice_enabled);
toggle.onchange = ()=>fetch(`/prefs/${userId}/voice`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:toggle.checked})});

const ws = new WebSocket(`ws://${location.host}/ws/events/${userId}`);
ws.onmessage = async (e)=>{
  const msg = JSON.parse(e.data);
  append(`[${msg.event}] ${msg.text}`);
  if (toggle.checked && msg.type==="speak" && msg.text){
    const res = await fetch("/voice/say",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:msg.text,latency:"balanced",format:"mp3"})});
    const blob = await res.blob();
    audio.src = URL.createObjectURL(blob);
    audio.play();
  }
}
document.getElementById("send").onclick = async ()=>{
  const txt = document.getElementById("inp").value.trim();
  if(!txt) return;
  append(`你：${txt}`);
  const r = await fetch("/chat/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:userId,text:txt})});
  const data = await r.json();
  append(`助手：${data.text}`);
  if (toggle.checked && data.voice_suggested){
    const res = await fetch("/voice/say",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:data.text,latency:"balanced",format:"mp3"})});
    const blob = await res.blob();
    audio.src = URL.createObjectURL(blob);
    audio.play();
  }
}
function append(s){ const p=document.createElement('p'); p.textContent=s; chat.appendChild(p); }
</script>
