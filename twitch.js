// Импортируем библиотеки
const tmi = require('tmi.js');
const fs = require('fs');
const path = require('path');

// Путь к файлу для хранения пользовательских команд
const commandsFilePath = path.join(__dirname, 'customCommands.json');

// Функция для загрузки пользовательских команд из файла
function loadCustomCommands() {
  try {
    if (fs.existsSync(commandsFilePath)) {
      const data = fs.readFileSync(commandsFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Ошибка при загрузке команд из файла:', err);
  }
  return {};
}

// Функция для сохранения пользовательских команд в файл
function saveCustomCommands() {
  try {
    fs.writeFileSync(commandsFilePath, JSON.stringify(customCommands, null, 2), 'utf-8');
  } catch (err) {
    console.error('Ошибка при сохранении команд в файл:', err);
  }
}

// Настройки бота
const opts = {
  identity: {
    username: 'servermed_bot',
    password: 'oauth:2lrso8utxczs3vmd5b335t9cx53bno' // Заменить на свой OAuth токен
  },
  channels: ['khalatny']
};

// Создаем клиент и подключаемся
const client = new tmi.Client(opts);
client.connect().catch(err => console.error('Ошибка подключения к Twitch:', err));

// Сообщения для случайной отправки
const randomMessages = [
  'Подпишитесь на телеграмм канал Khalatny - https://t.me/+dt8Sh8x762FmYWYy',
  'Давно хотел играть с лицензией Манкрафта, но не хватало денег? Сейчас действует акция на первые три покупки по 600!!!(Джава+бедрок, никнейм можно менять, аккаунт с полным доступом.)'
];

// Триггеры для автоответов
const triggerPhrases = new Map([
  ['greeting', [
    /\bку\b/i, /^ку$/i, /\bпривет\b/i, /\bzдарова\b/i, /\bhi\b/i,
    /\bhello\b/i, /\bхай\b/i, /\bсалам\b/i, /\bдобрый день\b/i,
    /\bдобрый вечер\b/i, /\bздорово\b/i, /\bхеллоу\b/i,
    /\bприв\b/i, /\bсалют\b/i, /\bхола\b/i
  ]],
  ['server', [
    /как зайти на сервер/i, /как попасть на сервер/i, /можно к тебе/i,
    /^!сервер/i, /что нужно чтобы зайти/i, /где найти сервер/i,
    /^!server$/i, /^! сервер$/i, /^! server$/i,
    /какие условия входа/i, /как получить доступ/i, /как присоединиться/i,
    /что нужно для игры/i, /можно ли зайти/i, /есть ли место на сервере/i,
    /какой ip/i, /айпи сервера/i, /ip сервера/i
  ]]
]);

const responses = {
  greeting: username => `Добро пожаловать на стрим, ${username}!`,
  server: `Honey — бесплатный ванильный сервер на версии 1.21.4 Java Edition с рп элементами. На сервере установлен PlasmoVoice, лицензия не требуется. Чтобы попасть на сервер, подпишись на тгк: https://t.me/+dt8Sh8x762FmYWYy и напиши ник под последним постом.`
};

// Отслеживание уникальных приветствий в сутки
const userGreetingTracked = {};
function resetUserGreetingTracked() {
  const now = new Date();
  const nextReset = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  setTimeout(() => {
    Object.keys(userGreetingTracked).forEach(u => delete userGreetingTracked[u]);
    resetUserGreetingTracked();
  }, nextReset - now);
}
resetUserGreetingTracked();

// Счетчик сообщений для рандомных сообщений
let messageCount = 0;
const getRandomMessage = () => randomMessages[Math.floor(Math.random() * randomMessages.length)];

// Базовые команды
const baseCommands = {
  '!сайт': 'Сайт сервера: https://servermishanyaya.easydonate.ru/',
  '!донат': 'Донат DA - https://www.donationalerts.com/r/mihadred Донат Пэй - https://new.donatepay.ru/@1344104 Донат в крипте USDT - 0xA1B27d127449dd25349CA45c53bfbDF83CD1c8a8',
  '!yt': 'YouTube: https://www.youtube.com/@Мишаня2222',
  '!ютуб': 'YouTube: https://www.youtube.com/@Мишаня2222',
  '!вк': 'VK - https://vk.com/mishanyaya2222',
  '!тг': 'Telegram канал Халатного: https://t.me/+dt8Sh8x762FmYWYy',
  '!tg': 'Telegram канал Халатного: https://t.me/+dt8Sh8x762FmYWYy'
};

// Загружаем пользовательские команды из файла
let customCommands = loadCustomCommands();

// Разрешенные пользователи для управления командами
const allowedUsers = ['khalatny', 'artikyaya'];
function canManageCommands(username) {
  return allowedUsers.includes(username.toLowerCase());
}

// Обработка входящих сообщений
client.on('message', (channel, tags, message, self) => {
  if (self) return;
  const username = tags.username;
  const lowerCaseMessage = message.toLowerCase().trim();

  // Конкурс
  if (lowerCaseMessage === '!конкурс') {
    client.say(channel, `ТикТок Конкурс!  
Выложи нарезку моего стрима в TikTok и заработай деньги! 
200K просмотров — 700₽, 1M — 3,500₽ 
100K в других соцсетях (кроме TikTok) — 500₽ 
Укажи мой Twitch: Khalatny 
Хэштеги: #Mishanyamine, #MishanYAYA, #МишанЯЯ, #Мишанямайн, #СерверМёд, #ServerMed, #Khalatny  
⚠️ Видео без других стримеров! Только с 18.01.2025!`);
    return;
  }

  // Приветствие
  if (!userGreetingTracked[username] && triggerPhrases.get('greeting').some(r => r.test(lowerCaseMessage))) {
    client.say(channel, responses.greeting(username));
    userGreetingTracked[username] = true;
  }

  // Вопросы о сервере
  if (triggerPhrases.get('server').some(r => r.test(lowerCaseMessage))) {
    client.say(channel, responses.server);
  }

  // Управление командами (только allowedUsers)
  if (canManageCommands(username)) {
    // +команда
    if (lowerCaseMessage.startsWith('+команда ')) {
      const line = message.slice(9).trim();
      const idx = line.indexOf(' ');
      if (idx === -1) {
        client.say(channel, 'Использование: +команда !название текст команды'); return;
      }
      const cmd = line.slice(0, idx).toLowerCase();
      const txt = line.slice(idx + 1).trim();
      if (!cmd.startsWith('!')) { client.say(channel, 'Название команды должно начинаться с "!".'); return; }
      if (baseCommands[cmd]) { client.say(channel, `Команда ${cmd} уже существует.`); return; }
      customCommands[cmd] = txt;
      saveCustomCommands();
      client.say(channel, `Команда ${cmd} добавлена.`);
      return;
    }
    // -команда
    if (lowerCaseMessage.startsWith('-команда ')) {
      const cmd = lowerCaseMessage.slice(9).trim();
      if (!cmd.startsWith('!')) { client.say(channel, 'Название команды должно начинаться с "!".'); return; }
      if (!customCommands[cmd]) { client.say(channel, `Команда ${cmd} не найдена.`); return; }
      delete customCommands[cmd];
      saveCustomCommands();
      client.say(channel, `Команда ${cmd} удалена.`);
      return;
    }
    // +редактировать
    if (lowerCaseMessage.startsWith('+редактировать ')) {
      const line = message.slice(13).trim();
      const idx = line.indexOf(' ');
      if (idx === -1) {
        client.say(channel, 'Использование: +редактировать !название новый текст команды'); return;
      }
      const cmd = line.slice(0, idx).toLowerCase();
      const txt = line.slice(idx + 1).trim();
      if (!cmd.startsWith('!')) { client.say(channel, 'Название команды должно начинаться с "!".'); return; }
      if (!customCommands[cmd]) { client.say(channel, `Команда ${cmd} не найдена.`); return; }
      customCommands[cmd] = txt;
      saveCustomCommands();
      client.say(channel, `Команда ${cmd} отредактирована.`);
      return;
    }
  }

  // Обработка базовых и пользовательских команд
  if (baseCommands[lowerCaseMessage]) {
    client.say(channel, baseCommands[lowerCaseMessage]);
    return;
  }
  if (customCommands[lowerCaseMessage]) {
    client.say(channel, customCommands[lowerCaseMessage]);
    return;
  }

  // Каждые 10 сообщений — рандомное сообщение
  messageCount++;
  if (messageCount >= 10) {
    client.say(channel, getRandomMessage());
    messageCount = 0;
  }
});

// Обработка ошибок
client.on('error', err => console.error('Ошибка клиента:', err));
