const TelegramBot = require('node-telegram-bot-api');
const token = '8023867940:AAFKv9EqqragaE5FxbdNWf6zz4PqxsfUXdI'; // Ваш токен
const bot = new TelegramBot(token, { polling: true });

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Проверяем, есть ли новые участники
  if (msg.new_chat_members) {
    msg.new_chat_members.forEach((member) => {
      const name = member.first_name || 'Пользователь';

      // Формируем приветственное сообщение
      const welcomeMessage = `Добро пожаловать, ${name}! 🎉\n\n` +
        `*Правила сервера:* [Ознакомиться](https://telegra.ph/Pravila-Servera-07-19-3)\n` +
        `*Глобальная информация(айпи адрес и тд):* [Подробнее](https://telegra.ph/informaciya-07-19-64)\n` +
        `*Twitch:* [khalatny](https://www.twitch.tv/khalatny)\n` +
        `*Новости сервера, суды собрания и тд:* [ТГ Канал Сервера](https://t.me/+iOjQzgS-G-ozOTIy)\n` +
        `*Купить товары:* [Перейти](https://servermishanyaya.easydonate.ru/)\n` +
        `*Лаунчер, моды и ресурс пак для игры:* [Перейти](https://servermishanyaya.easydonate.ru/resources)\n` +
        `*Подпишитесь на телеграмм канал:* [Халатного](https://t.me/+dt8Sh8x762FmYWYy)`;

      // Отправляем сообщение
      bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
      });
    });
  }
});
