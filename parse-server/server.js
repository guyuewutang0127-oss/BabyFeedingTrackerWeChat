/**
 * 本地喂养文字解析服务
 * 调用 Ollama 小模型理解口语化表达，输出与 utils/parser 一致的结构
 * 使用方式：先启动 Ollama 并拉取小模型（如 qwen2:0.5b），再运行 node server.js
 * 模型路径：可将 Ollama 的模型目录设为 E:\models，或使用默认路径
 */

const http = require('http');

const PORT = Number(process.env.PARSE_PORT) || 3842;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2:0.5b';

function buildPrompt(userText) {
  return `你是一个宝宝喂养记录助手。从下面这段口语化描述中提取喂养信息，只输出一个JSON对象，不要其他文字、不要markdown代码块。
JSON格式：{"startTime":"HH:mm","preparedAmount":数字,"actualAmount":数字,"duration":数字,"feedingType":"breastfeeding或mixed或formula"}
说明：startTime 用24小时制，如下午2点半写 "14:30"，凌晨1点写 "01:00"。无法推断的字段省略或填0。feedingType 只能是 breastfeeding、mixed、formula 之一。

用户描述：${userText}`;
}

function parseJsonFromResponse(text) {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}') + 1;
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end));
  } catch {
    return null;
  }
}

function timeStringToDate(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const parts = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!parts) return null;
  const hour = parseInt(parts[1], 10);
  const minute = parseInt(parts[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (d > now) d.setDate(d.getDate() - 1);
  return d;
}

function callOllama(prompt) {
  return new Promise((resolve, reject) => {
    const u = new URL(OLLAMA_HOST + '/api/generate');
    const body = JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false
    });
    const opts = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          resolve(j.response || '');
        } catch {
          reject(new Error('Ollama response parse error'));
        }
      });
    });
    req.on('error', reject);
    req.setHeader('Content-Length', Buffer.byteLength(body));
    req.write(body);
    req.end();
  });
}

function normalizeToParserFormat(raw) {
  const startTime = timeStringToDate(raw.startTime || raw.start_time);
  const preparedAmount = Math.max(0, parseInt(raw.preparedAmount, 10) || 0);
  let actualAmount = Math.max(0, parseInt(raw.actualAmount, 10) || 0);
  if (actualAmount === 0 && preparedAmount > 0) actualAmount = preparedAmount;
  const duration = Math.max(0, parseInt(raw.duration, 10) || 0);
  let feedingType = String(raw.feedingType || 'formula').toLowerCase();
  if (!['breastfeeding', 'mixed', 'formula'].includes(feedingType)) feedingType = 'formula';

  return {
    startTime,
    endTime: null,
    duration,
    preparedAmount,
    actualAmount,
    feedingType,
    note: ''
  };
}

// 简单 multipart 解析，取第一个 file 的二进制（用于 /asr）
function parseMultipartBody(rawBuffer, boundary) {
  if (!boundary || !rawBuffer || rawBuffer.length === 0) return null;
  const b = Buffer.from('--' + boundary.replace(/^"/, '').replace(/"$/, ''));
  const parts = [];
  let start = 0;
  while (start < rawBuffer.length) {
    const idx = rawBuffer.indexOf(b, start);
    if (idx === -1) break;
    const next = rawBuffer.indexOf(b, idx + b.length);
    const end = next === -1 ? rawBuffer.length : next;
    parts.push(rawBuffer.slice(idx + b.length, end));
    start = end;
  }
  for (const part of parts) {
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) continue;
    const header = part.slice(0, headerEnd).toString();
    if (/Content-Disposition:\s*form-data.*name="file"/i.test(header)) {
      return part.slice(headerEnd + 4).slice(0, -2); // 去掉末尾 \r\n
    }
  }
  return null;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const path = req.url.split('?')[0];
  if (req.method !== 'POST' || (path !== '/parse' && path !== '/asr')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Not Found' }));
    return;
  }

  if (path === '/asr') {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=([^;\s]+)/);
    const boundary = boundaryMatch ? boundaryMatch[1].trim() : null;
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      const fileBuffer = boundary ? parseMultipartBody(raw, boundary) : null;
      // 暂未接入真实 ASR，返回未配置；后续可在此用 Whisper 等处理 fileBuffer
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'ASR 未配置，请在 parse-server 中接入语音识别（如 Whisper）'
      }));
    });
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', async () => {
    let text = '';
    try {
      const j = JSON.parse(body);
      text = (j.text || '').trim();
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid JSON body' }));
      return;
    }

    if (!text) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Empty text' }));
      return;
    }

    try {
      const response = await callOllama(buildPrompt(text));
      const raw = parseJsonFromResponse(response);
      if (!raw) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Model output not valid JSON' }));
        return;
      }
      const data = normalizeToParserFormat(raw);
      const hasValid = data.startTime || data.actualAmount > 0;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: hasValid,
        data: {
          ...data,
          startTime: data.startTime ? data.startTime.toISOString() : null
        }
      }));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: String(err.message || err) }));
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Parse server: http://0.0.0.0:${PORT}/parse`);
  console.log(`Ollama: ${OLLAMA_HOST}, model: ${OLLAMA_MODEL}`);
  console.log('Ensure Ollama is running and the model is pulled (e.g. ollama run qwen2:0.5b).');
});
