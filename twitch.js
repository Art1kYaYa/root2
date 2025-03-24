// Импортируем библиотеку tmi.js
const tmi = require('tmi.js');

// Настройки бота
const opts = {
    identity: {
        username: 'servermed_bot', // Имя вашего Twitch-бота
        password: 'oauth:2lrso8utxczs3vmd5b335t9cx53bno' // OAuth-токен для вашего бота
    },
    channels: [
        'khalatny' // Канал, где бот будет активен
    ]
};

// Создаем клиент бота
const client = new tmi.Client(opts);

// Подключение к Twitch-каналу с обработкой ошибок
client.connect().catch(err => console.error('Ошибка подключения к Twitch:', err));

// Сообщения для случайной отправки
const randomMessages = [
    'Подпишитесь на телеграмм канал Khalatny - https://t.me/+dt8Sh8x762FmYWYy'
];

// Настройка триггеров
const triggerPhrases = new Map([
    ['greeting', [
        /\bку\b/i,
        /^ку$/i,
        /\bпривет\b/i,
        /\bzдарова\b/i,
        /\bhi\b/i,
        /\bhello\b/i,
        /\bхай\b/i,
        /\bсалам\b/i,
        /\bдобрый день\b/i,
        /\bдобрый вечер\b/i,
        /\bздорово\b/i,
        /\bхеллоу\b/i,
        /\bприв\b/i,
        /\bсалют\b/i,
        /\bхола\b/i
    ]],
    ['server', [
        /как зайти на сервер/i,
        /как попасть на сервер/i,
        /можно к тебе/i,
        /^!сервер/i,
        /что нужно чтобы зайти/i,
        /где найти сервер/i,
        /^!server$/i,
        /^! сервер$/i,
        /^! server$/i,
        /какие условия входа/i,
        /как получить доступ/i,
        /как присоединиться/i,
        /что нужно для игры/i,
        /можно ли зайти/i,
        /есть ли место на сервере/i,
        /какой ip/i,
        /айпи сервера/i,
        /ip сервера/i
    ]]
]);

const responses = {
    greeting: username => `Добро пожаловать на стрим, ${username}!`,
    server: 'Привет! Хочешь попасть на наш сервер? У нас есть два способа: 1. БЕСПЛАТНЫЙ Способ! Просто смотри наш стрим на Twitch и накопи 1000 баллов за 20-30 минут! Потрать их на проходку. Если ты подписчик ТГК Халатного ( !tg ) то нужно всего 500 баллов! 300 из которых тебе дают за фоллов. 2. ПЛАТНЫЙ Способ! Оплати проходку за 200 рублей через DonationAlerts ( !донат ). Всё просто, и ты в игре! Стримы: с 10:00 до 12:00 с 18:00 до 22:00  Ждём тебя в игре'
};

// Хранилище сообщений пользователей для отслеживания приветствий
const userGreetingTracked = {};

// Функция сброса трекинга приветствий (ежедневно)
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

// Счетчик сообщений для отправки случайных сообщений
let messageCount = 0;

// Функция выбора случайного сообщения
const getRandomMessage = () => randomMessages[Math.floor(Math.random() * randomMessages.length)];

// Обработка всех входящих сообщений
client.on('message', (channel, tags, message, self) => {
    if (self) return; // Игнорируем сообщения от бота

    const username = tags.username;
    const lowerCaseMessage = message.toLowerCase().trim();

    console.log(`Получено сообщение: "${lowerCaseMessage}" от ${username}`);

    // Команда !конкурс
    if (lowerCaseMessage === '!конкурс') {
        client.say(channel, ` ТикТок Конкурс!  
 Выложи нарезку моего стрима в TikTok и заработай деньги! 
 200K просмотров — 700₽, 1M — 3,500₽ 
 100K в других соцсетях (кроме TikTok) — 500₽ 
 Укажи мой Twitch: Khalatny 
 Хэштеги: #Mishanyamine, #MishanYAYA, #МишанЯЯ, #Мишанямайн, #СерверМёд, #ServerMed, #Khalatny  
⚠️ Видео без других стримеров! Только с 18.01.2025!`);
        // Прекращаем дальнейшую обработку этого сообщения, если необходимо
        return;
    }

    // Проверка приветствия
    if (
        !userGreetingTracked[username] &&
        triggerPhrases.get('greeting').some(regex => regex.test(lowerCaseMessage))
    ) {
        client.say(channel, responses.greeting(username));
        userGreetingTracked[username] = true;
        console.log(`Приветствие от ${username} обработано.`);
    } else if (userGreetingTracked[username]) {
        console.log(`Приветствие от ${username} проигнорировано (уже было сегодня).`);
    }

    // Проверка вопросов про сервер
    if (triggerPhrases.get('server').some(regex => regex.test(lowerCaseMessage))) {
        client.say(channel, responses.server);
        console.log(`Вопрос про сервер от ${username} обработан.`);
    }

    // Обработка других команд
    const commands = {
        '!сайт': 'Сайт сервера: https://servermishanyaya.easydonate.ru/',
        '!донат': 'Донат: https://www.donationalerts.com/r/mihadred',
        '!yt': 'YouTube: https://www.youtube.com/@Мишаня2222',
        '!ютуб': 'YouTube: https://www.youtube.com/@Мишаня2222',
        '!вк': 'VK - https://vk.com/mishanyaya2222',
        '!тг': 'Telegram канал Халатного: https://t.me/+dt8Sh8x762FmYWYy',
        '!tg': 'Telegram канал Халатного: https://t.me/+dt8Sh8x762FmYWYy'
    };

    if (commands[lowerCaseMessage]) {
        client.say(channel, commands[lowerCaseMessage]);
    }

    // Увеличение счетчика сообщений и отправка случайного сообщения каждые 20 сообщений
    messageCount++;
    if (messageCount >= 20) {
        const randomMessage = getRandomMessage();
        client.say(channel, randomMessage);
        console.log(`Отправлено случайное сообщение: ${randomMessage}`);
        messageCount = 0;
    }
});

// Обработка ошибок клиента
client.on('error', err => console.error('Ошибка клиента:', err));
