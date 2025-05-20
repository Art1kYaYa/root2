const TelegramBot = require('node-telegram-bot-api');
const token = '8023867940:AAEUA3mDpQQLLopq0mnYUN8c2NZog3U73xQ';
const bot = new TelegramBot(token, { polling: true });

const ADMIN_IDS = [2030128216, 1923832824];

// Экранирование HTML-тегов
function escapeHTML(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const welcomeMessage =
  `<b>Полезные ссылки:</b>\n` +
  `• <a href="https://telegra.ph/Informaciya-03-08-5">Инфо о сервере (IP и прочее)</a>\n` +
  `• <a href="https://www.twitch.tv/khalatny">Twitch Khalatny</a>\n` +
  `• <a href="https://t.me/+iOjQzgS-G-ozOTIy">Новости и события (ТГК)</a>\n` +
  `• <a href="https://servermishanyaya.easydonate.ru/">Купить ресурсы</a>\n` +
  `• <a href="https://servermishanyaya.easydonate.ru/resources">Ресурсы для игры</a>\n` +
  `• <a href="https://servermishanyaya.easydonate.ru/help">Помощь и FAQ</a>\n` +
  `• <a href="https://t.me/+dt8Sh8x762FmYWYy">Канал Халатного</a>`;

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.new_chat_members) {
    msg.new_chat_members.forEach((member) => {
      const nameRaw = member.first_name || 'Пользователь';
      const name = escapeHTML(nameRaw);

      const fullMessage =
        `Привет, <b>${name}</b>!\n\n` +
        `Заходя на сервер, вы автоматически соглашаетесь с <a href="https://servermishanyaya.easydonate.ru/rules">правилами</a> ` +
        `(кратко — <a href="https://telegra.ph/Pravila-Servera-03-08">тут</a>).\n\n` +
        `Запрещены: <b>читы</b>, <b>гриферство</b>, <b>оскорбления(БанВорды)</b> — всё фиксируется тех.Администраций и плагином <b>CoreProtect</b> ` +
        `и всё может быть откатано за пару секунд.\n\n` +
        `Спасибо, что зашёл(-а) к нам!\n\n${welcomeMessage}`;

      const secondMessage = `⚠️ <b>ЕСЛИ ВЫ НЕ УМЕЕТЕ ЧИТАТЬ</b> — НЕ НУЖНО ПИСАТЬ "ГДЕ IP?"\n` +
                            `📌 Всё есть выше, в строчке <b>"Инфо о сервере (IP и прочее)"</b>.`;

      bot.sendMessage(chatId, fullMessage, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }).then(() => {
        bot.sendMessage(chatId, secondMessage, {
          parse_mode: 'HTML',
          disable_web_page_preview: true
        });
      });
    });
  }
});

bot.onText(/\/welcome/, (msg) => {
  if (ADMIN_IDS.includes(msg.from.id)) {
    bot.sendMessage(msg.chat.id, welcomeMessage, {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
  } else {
    bot.sendMessage(msg.chat.id, 'У вас нет доступа к этой команде.');
  }
});
