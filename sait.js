const TelegramBot = require('node-telegram-bot-api');

// Токен бота, полученный от BotFather
const TOKEN = '7799272051:AAEGUUs3OTC6O3w9sXijj8ZcpAcMBQyGoYg';

// Создаем бота
const bot = new TelegramBot(TOKEN, { polling: true });

// Обрабатываем команду /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Вот ссылка на фото объектов: [Перейти](https://fotosait.github.io/PhotosObjects/)', {
        parse_mode: 'Markdown'
    });
});

