const TelegramBot = require('node-telegram-bot-api');
const token = '8023867940:AAEUA3mDpQQLLopq0mnYUN8c2NZog3U73xQ'; // Ваш токен
const bot = new TelegramBot(token, { polling: true });

// Обработчик команд
bot.onText(/!(твич|twitch)/, (msg) => {
  const chatId = msg.chat.id;

  // Отправляем ссылку на Twitch
  const twitchMessage = 'Смотрите нас на Twitch: [khalatny](https://www.twitch.tv/khalatny)';
  bot.sendMessage(chatId, twitchMessage, { parse_mode: 'Markdown' });
});

bot.onText(/!(сайт|сайт)/, (msg) => {
  const chatId = msg.chat.id;

  // Отправляем ссылку на сайт
  const siteMessage = 'Перейти на сайт сервера: [Перейти](https://servermishanyaya.easydonate.ru/)';
  bot.sendMessage(chatId, siteMessage, { parse_mode: 'Markdown' });
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Проверяем, есть ли новые участники
  if (msg.new_chat_members) {
    msg.new_chat_members.forEach((member) => {
      const name = member.first_name || 'Пользователь';

      // Формируем приветственное сообщение
      const welcomeMessage = `Добро пожаловать, ${name}! 🎉\n\n` +
        `*Правила сервера:* [Ознакомиться](https://telegra.ph/Pravila-Servera-03-08)\n` +
        `*Глобальная информация(айпи адрес и тд):* [Подробнее](https://telegra.ph/Informaciya-03-08-5)\n` +
        `*Twitch:* [khalatny](https://www.twitch.tv/khalatny)\n` +
        `*Новости сервера, суды собрания и тд:* [ТГ Канал Сервера](https://t.me/+iOjQzgS-G-ozOTIy)\n` +
        `*Купить товары:* [Перейти](https://servermishanyaya.easydonate.ru/)\n` +
        `*Лаунчер, моды и ресурс пак для игры:* [Перейти](https://servermishanyaya.easydonate.ru/resources)\n` +
        `*Помощь и часто задаваемые вопросы:* [Перейти](https://servermishanyaya.easydonate.ru/help)\n` +
        `*Подпишитесь на телеграмм канал:* [Халатного](https://t.me/+dt8Sh8x762FmYWYy)`;

      // Отправляем сообщение
      bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
      });
    });
  }
});
