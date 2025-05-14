// Импортируем библиотеку tmi.js
const tmi = require('tmi.js');

// Настройки бота
const opts = {
    identity: {
        username: 'servermed_bot',
        password: 'oauth:2lrso8utxczs3vmd5b335t9cx53bno' // Заменить на свой OAuth токен
    },
    channels: [
        'khalatny'
    ]
};

// Создаем клиент
const client = new tmi.Client(opts);

// Подключение к Twitch
client.connect().catch(err => console.error('Ошибка подключения к Twitch:', err));

// Сообщения для случайной отправки
const randomMessages = [
    'Подпишитесь на телеграмм канал Khalatny - https://t.me/+dt8Sh8x762FmYWYy',
    'Давно хотел играть с лицензией Манкрафта, но не хватало денег? Сейчас действует акция на первые три покупки по 600!!!(Джава+бедрок, никнейм можно менять, аккаунт с полным доступом.)'
];

// Триггеры
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
    server: `Чтобы зайти на сервер, нужно всего лишь подписаться на ТГК https://t.me/+dt8Sh8x762FmYWYy и написать свой ник под последним постом.`
};

// Отслеживание приветствий
const userGreetingTracked = {};

const resetUserGreetingTracked = () => {
    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const timeUntilReset = nextReset - now;

    setTimeout(() => {
        Object.keys(userGreetingTracked).forEach(user => delete userGreetingTracked[user]);
        resetUserGreetingTracked();
    }, timeUntilReset);
};
resetUserGreetingTracked();

let messageCount = 0;
const getRandomMessage = () => randomMessages[Math.floor(Math.random() * randomMessages.length)];

// Обработка сообщений
client.on('message', (channel, tags, message, self) => {
    if (self) return;

    const username = tags.username;
    const lowerCaseMessage = message.toLowerCase().trim();

    console.log(`Получено сообщение: "${lowerCaseMessage}" от ${username}`);

    // Конкурс
    if (lowerCaseMessage === '!конкурс') {
        client.say(channel, ` ТикТок Конкурс!  
Выложи нарезку моего стрима в TikTok и заработай деньги! 
200K просмотров — 700₽, 1M — 3,500₽ 
100K в других соцсетях (кроме TikTok) — 500₽ 
Укажи мой Twitch: Khalatny 
Хэштеги: #Mishanyamine, #MishanYAYA, #МишанЯЯ, #Мишанямайн, #СерверМёд, #ServerMed, #Khalatny  
⚠️ Видео без других стримеров! Только с 18.01.2025!`);
        return;
    }

    // Приветствие
    if (!userGreetingTracked[username] && triggerPhrases.get('greeting').some(regex => regex.test(lowerCaseMessage))) {
        client.say(channel, responses.greeting(username));
        userGreetingTracked[username] = true;
        console.log(`Приветствие от ${username} обработано.`);
    }

    // Вопросы о сервере
    if (triggerPhrases.get('server').some(regex => regex.test(lowerCaseMessage))) {
        client.say(channel, responses.server);
        console.log(`Вопрос про сервер от ${username} обработан.`);
    }

    // Дополнительные команды
    const commands = {
        '!сайт': 'Сайт сервера: https://servermishanyaya.easydonate.ru/',
        '!донат': 'Донат DA - https://www.donationalerts.com/r/mihadred Донат Пэй - https://new.donatepay.ru/@1344104 Донат в крипте USDT - 0xA1B27d127449dd25349CA45c53bfbDF83CD1c8a8',
        '!yt': 'YouTube: https://www.youtube.com/@Мишаня2222',
        '!ютуб': 'YouTube: https://www.youtube.com/@Мишаня2222',
        '!вк': 'VK - https://vk.com/mishanyaya2222',
        '!тг': 'Telegram канал Халатного: https://t.me/+dt8Sh8x762FmYWYy',
        '!tg': 'Telegram канал Халатного: https://t.me/+dt8Sh8x762FmYWYy'
    };

    if (commands[lowerCaseMessage]) {
        client.say(channel, commands[lowerCaseMessage]);
    }

    // Каждые 20 сообщений — рандом
    messageCount++;
    if (messageCount >= 10) {
        const randomMessage = getRandomMessage();
        client.say(channel, randomMessage);
        console.log(`Отправлено случайное сообщение: ${randomMessage}`);
        messageCount = 0;
    }
});

// Обработка ошибок
client.on('error', err => console.error('Ошибка клиента:', err));
