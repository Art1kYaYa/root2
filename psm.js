const TelegramBot = require('node-telegram-bot-api');

const token = '7448547318:AAHcQ2lPIiiuo7vS92Lsk5tYW0nWYUR54rY';
const bot = new TelegramBot(token, { polling: true });

const STACK_VALUE = 64; // 1 стак = 64 единицы
const SHULKER_VALUE = 27 * STACK_VALUE; // 1 шалкер = 27 стаков

function calculateInterest(principal, rate, time, isDays = false) {
    const dailyRate = rate / 30;
    return principal * (1 + (isDays ? dailyRate * time : rate * time));
}

function calculateLoan(principal, rate, time, isDays = false) {
    const dailyRate = rate / 30;
    return principal * (1 + (isDays ? dailyRate * time : rate * time));
}

function parseAmount(input) {
    let match = input.match(/^(\d+)\s*(шт|стак|шалкер)?/i);
    if (match) {
        let amount = parseInt(match[1]);
        let unit = match[2] ? match[2].toLowerCase() : 'шт';
        if (unit === 'стак') return amount * STACK_VALUE;
        if (unit === 'шалкер') return amount * SHULKER_VALUE;
        return amount;
    }
    return NaN;
}

function formatStacks(amount) {
    let shulkers = Math.floor(amount / SHULKER_VALUE);
    let remainderAfterShulkers = amount % SHULKER_VALUE;
    let stacks = Math.floor(remainderAfterShulkers / STACK_VALUE);
    let remainder = remainderAfterShulkers % STACK_VALUE;

    let result = [];
    if (shulkers > 0) result.push(`${shulkers} шалкер` + (shulkers > 1 ? 'а' : ''));
    if (stacks > 0) result.push(`${stacks} стак` + (stacks > 1 ? 'а' : ''));
    if (remainder > 0) result.push(`${remainder} шт`);

    return result.join(' ');
}

const bankKeyboard = {
    reply_markup: {
        keyboard: [[{ text: 'Рассчитать вклад' }, { text: 'Рассчитать кредит' }], [{ text: 'Выход' }]],
        one_time_keyboard: true,
        resize_keyboard: true,
    },
};

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Добро пожаловать в банк Minecraft! Выберите действие:', bankKeyboard);
});

bot.onText(/Рассчитать вклад/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Введите сумму вклада (например, "10 шт", "2 стака" или "1 шалкер"):');

    bot.once('message', (message) => {
        let principal = parseAmount(message.text);
        if (!isNaN(principal) && principal > 0) {
            bot.sendMessage(chatId, 'Введите месячную процентную ставку (%):');
            bot.once('message', (rateMessage) => {
                let rate = parseFloat(rateMessage.text) / 100;
                bot.sendMessage(chatId, 'Введите срок (например, "6 месяцев" или "30 дней")');
                bot.once('message', (timeMessage) => {
                    let time = parseInt(timeMessage.text);
                    let isDays = timeMessage.text.includes('дней');
                    let result = calculateInterest(principal, rate, time, isDays);
                    bot.sendMessage(chatId, `Итоговая сумма вклада: ${formatStacks(result)}`);
                });
            });
        } else {
            bot.sendMessage(chatId, 'Некорректная сумма. Попробуйте еще раз.');
        }
    });
});

bot.onText(/Рассчитать кредит/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Введите сумму кредита (например, "10 шт", "2 стака" или "1 шалкер"):');

    bot.once('message', (message) => {
        let principal = parseAmount(message.text);
        if (!isNaN(principal) && principal > 0) {
            bot.sendMessage(chatId, 'Введите месячную процентную ставку (%):');
            bot.once('message', (rateMessage) => {
                let rate = parseFloat(rateMessage.text) / 100;
                bot.sendMessage(chatId, 'Введите срок (например, "6 месяцев" или "30 дней")');
                bot.once('message', (timeMessage) => {
                    let time = parseInt(timeMessage.text);
                    let isDays = timeMessage.text.includes('дней');
                    let result = calculateLoan(principal, rate, time, isDays);
                    bot.sendMessage(chatId, `Итоговая сумма кредита: ${formatStacks(result)}`);
                });
            });
        } else {
            bot.sendMessage(chatId, 'Некорректная сумма. Попробуйте еще раз.');
        }
    });
});

bot.onText(/Выход/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Выход из расчета. Начните снова, набрав /start.');
});
