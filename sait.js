const TelegramBot = require('node-telegram-bot-api');

// Токен бота, полученный от BotFather
const TOKEN = '7799272051:AAE4gV--aQWZMAh_1PEf_fWxCrogutpx-9A';

// Создаем бота
const bot = new TelegramBot(TOKEN, { polling: true });

// Обрабатываем команду /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Вот ссылка на фото объектов: [Перейти](https://art1kyaya.github.io/root/)', {
        parse_mode: 'Markdown'
    });
});

