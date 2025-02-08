const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

// 🔹 Токен бота
const token = '7774876781:AAGZmGJtaI7e14IBTZJTZWVbFfzv4wWzSQM';
const bot = new TelegramBot(token, { polling: true });

// 🔹 Пути к файлам
const reportsFile = path.join(__dirname, 'reports.json');
const usersFile = path.join(__dirname, 'users.json');

// 🔹 ID группы для отчётов
const reportsGroupId = -1002293411618;

// 🔹 ID администраторов (могут разблокировать отчёты)
const adminIds = [634391096, 2030128216];

// 🔹 Переменная для блокировки подачи отчётов
let reportsLocked = false;

// 🔹 Проверяем, существуют ли файлы, если нет, создаём их
if (!fs.existsSync(reportsFile)) fs.writeFileSync(reportsFile, JSON.stringify({}));
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify({}));

// 🔹 Хранилище активных отчётов пользователей
const userReports = {};

// 🔹 Проверка роли пользователя
function checkUserRole(userId) {
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    return users[userId] && users[userId].role === 'worker';
}

// 🔹 Проверка, подавал ли пользователь отчёт на этой неделе
function hasSubmittedReport(chatId) {
    const reports = JSON.parse(fs.readFileSync(reportsFile, 'utf-8'));
    const userReport = reports[chatId];
    if (!userReport) return false;

    const lastSubmissionDate = new Date(userReport.date);
    const currentDate = new Date();
    return (currentDate - lastSubmissionDate) / (1000 * 60 * 60 * 24) < 7;
}

// 🔹 Команда для начала отчёта
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    if (!checkUserRole(chatId)) {
        return bot.sendMessage(chatId, '🚫 У вас нет прав для отправки отчётов.');
    }

    if (reportsLocked) {
        return bot.sendMessage(chatId, '🚫 Подача отчётов временно заблокирована.');
    }

    if (new Date().getDay() !== 0) {
        return bot.sendMessage(chatId, '📅 Команда /start доступна только по воскресеньям.');
    }

    if (hasSubmittedReport(chatId)) {
        return bot.sendMessage(chatId, '✅ Вы уже отправили отчёт на этой неделе.');
    }

    userReports[chatId] = {};

    bot.sendMessage(chatId, '📋 Выберите, что вы сделали за неделю:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Оформлено штрафов', callback_data: 'fines_processed' }],
                [{ text: 'Посадок в КПЗ', callback_data: 'detentions' }],
                [{ text: 'Дежурств в судах', callback_data: 'duties' }],
                [{ text: 'Обходов по базам', callback_data: 'patrols' }],
                [{ text: 'Участий в рейдах', callback_data: 'raids' }],
                [{ text: 'Выдано документов', callback_data: 'documents_issued' }],
                [{ text: '✅ Завершить', callback_data: 'confirm' }]
            ]
        }
    });
});

// 🔹 Обработка нажатий кнопок
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (!userReports[chatId]) {
        return bot.sendMessage(chatId, '⚠️ Начните с команды /start.');
    }

    if (data === 'confirm') {
        const report = userReports[chatId];
        const confirmationMessage =
            `📝 *Подтвердите ваш отчёт:*\n\n` +
            `- 📋 *Штрафов оформлено:* ${report.fines_processed || 0}\n` +
            `- 🚔 *Посадок в КПЗ:* ${report.detentions || 0}\n` +
            `- ⚖️ *Дежурств в судах:* ${report.duties || 0}\n` +
            `- 🚨 *Обходов по базам:* ${report.patrols || 0}\n` +
            `- 🔍 *Участий в рейдах:* ${report.raids || 0}\n` +
            `- 📜 *Выдано документов:* ${report.documents_issued || 0}`;

        return bot.sendMessage(chatId, confirmationMessage, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ Подтвердить', callback_data: 'save' }],
                    [{ text: '❌ Отменить', callback_data: 'cancel' }]
                ]
            }
        });
    }

    if (data === 'save') {
        const reports = JSON.parse(fs.readFileSync(reportsFile, 'utf-8'));
        reports[chatId] = { ...userReports[chatId], date: new Date().toISOString() };
        fs.writeFileSync(reportsFile, JSON.stringify(reports, null, 2));

        const reportMessage =
            `📝 *Отчёт от @${query.from.username || 'Неизвестный'}:*\n\n` +
            `- 📋 *Штрафов оформлено:* ${userReports[chatId].fines_processed || 0}\n` +
            `- 🚔 *Посадок в КПЗ:* ${userReports[chatId].detentions || 0}\n` +
            `- ⚖️ *Дежурств в судах:* ${userReports[chatId].duties || 0}\n` +
            `- 🚨 *Обходов по базам:* ${userReports[chatId].patrols || 0}\n` +
            `- 🔍 *Участий в рейдах:* ${userReports[chatId].raids || 0}\n` +
            `- 📜 *Выдано документов:* ${userReports[chatId].documents_issued || 0}`;

        bot.sendMessage(reportsGroupId, reportMessage, { parse_mode: "Markdown" });
        bot.sendMessage(chatId, '✅ Ваш отчёт отправлен!');
        delete userReports[chatId];
        return;
    }

    if (data === 'cancel') {
        bot.sendMessage(chatId, '❌ Отчёт отменён.');
        delete userReports[chatId];
        return;
    }

    bot.sendMessage(chatId, `Введите количество:`);
    userReports[chatId].currentCategory = data;
    
    bot.onText(/^\d+$/, (msg) => {
        const chatId = msg.chat.id;
        const number = parseInt(msg.text, 10);
    
        if (!userReports[chatId]) return;
    
        const currentCategory = userReports[chatId].currentCategory;
        if (currentCategory) {
            userReports[chatId][currentCategory] = number;
            delete userReports[chatId].currentCategory;
    
            bot.sendMessage(chatId, `✅ Вы ввели ${number} для категории *${currentCategory}*.`);
            bot.sendMessage(chatId, 'Теперь выберите следующую категорию или нажмите "Завершить".', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Оформлено штрафов', callback_data: 'fines_processed' }],
                        [{ text: 'Посадок в КПЗ', callback_data: 'detentions' }],
                        [{ text: 'Дежурств в судах', callback_data: 'duties' }],
                        [{ text: 'Обходов по базам', callback_data: 'patrols' }],
                        [{ text: 'Участий в рейдах', callback_data: 'raids' }],
                        [{ text: 'Выдано документов', callback_data: 'documents_issued' }],
                        [{ text: '✅ Завершить', callback_data: 'confirm' }]
                    ]
                }
            });
        }
    });
    
});

// 🔹 Блокировка подачи отчётов
bot.onText(/\/lock_reports/, (msg) => {
    if (!adminIds.includes(msg.from.id)) return;
    reportsLocked = true;
    bot.sendMessage(msg.chat.id, '🔒 Подача отчётов заблокирована.');
});

// 🔹 Разблокировка подачи отчётов
bot.onText(/\/unlock_reports/, (msg) => {
    if (!adminIds.includes(msg.from.id)) return;
    reportsLocked = false;
    bot.sendMessage(msg.chat.id, '✅ Подача отчётов разблокирована.');
});

// 🔹 Просмотр личного отчёта
bot.onText(/\/myreport/, (msg) => {
    const chatId = msg.chat.id;
    const reports = JSON.parse(fs.readFileSync(reportsFile, 'utf-8'));
    const report = reports[chatId];

    if (!report) return bot.sendMessage(chatId, '❌ У вас нет отчёта.');

    bot.sendMessage(chatId, `📋 Ваш последний отчёт:\n${JSON.stringify(report, null, 2)}`);
});
