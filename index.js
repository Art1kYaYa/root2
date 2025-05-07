const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = '7758731240:AAH6Abgf1m2zkyYpIuWQAAiIAKo-yxcBPfc';
const bot = new TelegramBot(token, { polling: true });
const adminChatId = -1002400665091; // ID админского чата

const usersFile = './users.json';
const finesFile = './fines.json';


const taxWorkers = [2030128216, 6343971096];  


let users = loadData(usersFile) || {};
let fines = loadData(finesFile) || {};
const authorizedUsers = []; 
const employees = []; 

function loadData(filename) {
  if (fs.existsSync(filename)) {
    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data);
  }
  return null;
}

function saveData(filename, data) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}
// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
  `🆘 Список доступных команд:\n\n` +
  `/check_fines - Показать неоплаченные штрафы.\n` +
  `/archive - Просмотреть архив штрафов.\n` +
  `/contact - Контактная информация.\n` +
  `/start - Главное меню.\n\n` +
  `Команды работникам:\n` +
  `/worker_help - Помощь для работников.\n\n` +
  `Кому делать нечего - /game\n`+
  `P.s Игры делала нейронка.\n\n` +

  `Используйте эти команды для работы с ботом!`
     );

  });


function isTaxWorker(userId) {
  return taxWorkers.includes(userId);
}



bot.onText(/\/contact/, (msg) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  // Удаляем сообщение пользователя
  bot.deleteMessage(chatId, messageId).catch((err) => {
    console.error(`Не удалось удалить сообщение: ${err.message}`);
  });

  // Отправляем сообщение с контактной информацией и кнопкой закрытия
  bot.sendMessage(
    chatId,
    `📞 Контактная информация:\n\n` +
    `- Администрация бота: ArtikYaYa\n` +
    `- Глава Налоговой: Serg03S\n` +
    `- Главы ПСМ: mak097\n` +
    `- Администраторы "Меда":\n  • KenD_Live\n  • OPTIMUS_PM\n\n` +
    `Мы рады вам помочь!`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Администрация бота', url: 'https://t.me/ArtikYaYa' }],
          [{ text: 'Глава Налоговой', url: 'https://t.me/SergeySV0354' }],
          [{ text: 'Глава ПСМ 1', url: 'https://t.me/mak097a' }],
          [
            { text: 'Администратор "Меда" KenD_Live', url: 'https://t.me/KenDyxa' },
            { text: 'Администратор "Меда" OPTIMUS_PM', url: 'https://t.me/optms4' },
          ],
          [{ text: '❌ Закрыть', callback_data: 'close_contact' }],
        ],
      },
    }
  );
});


// Обработка кнопки "Закрыть"
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;

  if (callbackQuery.data === 'close_contact') {
    bot.deleteMessage(chatId, messageId).catch((err) => {
      console.error(`Ошибка удаления сообщения: ${err.message}`);
    });
  }
});

bot.onText(/\/delete_fine (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const fineIndex = match[1];

  if (!taxWorkers.includes(chatId)) {
    bot.sendMessage(chatId, '🛑 Эта команда доступна только администраторам.');
    return;
  }

  if (fines[fineIndex]) {
    fines.splice(fineIndex, 1);
    saveData(finesFile, fines);
    bot.sendMessage(chatId, `✅ Штраф ${fineIndex} удален.`);
  } else {
    bot.sendMessage(chatId, '❌ Штраф не найден.');
  }
});


bot.onText(/\/worker_help/, (msg) => {
  const chatId = msg.chat.id;


  if (!msg.from || !users[chatId] || !users[chatId].role.includes('worker')) {
    bot.sendMessage(chatId, '🛑 Эта команда доступна только работникам Налоговой.');
    return;
  }

  const helpMessage = `
  🔹 Привет! Вот список команд для работников Налоговой Сервера Мед и как ими пользоваться:

  1. /fine <ID> <Сумма> <Причина> - Выписать штраф. ВНИМАНИ!!! ID это тег пользователя, который можно получить прописав /list.

  2. /list - Список всех авторизованных.

  3. /list_payments — Подтвердить заявку на оплату от пользователя.

  4. /report_fine — Отчет по штрафам для налоговой.

  5. /top_debtors - Топ должников.

  6. /notify_debtors - Уведомление о долгах должникам.

  7. /check_user_fines - Информация о штрафах людей.

  Команды для Администраторов:

  1. **/remove_worker <ID пользователя>** — Удалить права работника у пользователя.

  2. **/add_worker <ID пользователя>** — Добавить пользователя в список работников.
     - Используется для назначения прав работника пользователю. Пример: /add_worker 987654321.

  Если у вас есть вопросы или нужно дополнительное объяснение, не стесняйтесь обращаться!
  `;

  bot.sendMessage(chatId, helpMessage);
});


function isWorker(chatId) {
  return users[chatId] && users[chatId].role === 'worker';
}

function deleteActiveMessage(chatId) {
  if (activeMessages[chatId]) {
    bot.deleteMessage(chatId, activeMessages[chatId]).catch(() => {});
    delete activeMessages[chatId];
  }
}

bot.onText(/\/notify_debtors/, (msg) => {
  const chatId = msg.chat.id;

  if (!isTaxWorker(chatId)) {
    bot.sendMessage(chatId, '🛑 Эта команда доступна только для сотрудников налоговой.');
    return;
  }

  let notifiedCount = 0;

  for (const userId in fines) {
    const userFines = fines[userId] || [];
    const unpaidAmount = userFines
      .filter(fine => !fine.paid && !fine.cancelled)
      .reduce((sum, fine) => sum + fine.amount, 0);

    if (unpaidAmount > 0) {
      const username = users[userId]?.username || `ID: ${userId}`;
      bot.sendMessage(userId, `⚠️ У вас есть неоплаченные штрафы на сумму ${unpaidAmount} ар. Пожалуйста, погасите задолженность.`);
      notifiedCount++;
    }
  }

  bot.sendMessage(chatId, `✅ Уведомления отправлены ${notifiedCount} должникам.`);
});



bot.onText(/\/add_worker (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userIdToAdd = match[1];

  if (!taxWorkers.includes(chatId)) {
    bot.sendMessage(chatId, '❌ Эта команда доступна только администраторам.');
    return;
  }


  if (users[userIdToAdd]) {
    const user = users[userIdToAdd];
    if (user.role !== 'worker') {
      user.role = 'worker'; 
      saveData(usersFile, users); 

      bot.sendMessage(chatId, `✅ Пользователь ${user.username} (ID: ${userIdToAdd}) теперь является работником.`);
      bot.sendMessage(userIdToAdd, `✅ Вы добавлены в список работников. Все команды которые вам доступны: /worker_help`);
    } else {
      bot.sendMessage(chatId, `⚠️ Пользователь ${user.username} (ID: ${userIdToAdd}) уже является работником.`);
    }
  } else {
    bot.sendMessage(chatId, '❌ Пользователь с указанным ID не найден.');
  }
});
bot.onText(/\/register (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1].trim(); // Убираем пробелы

  try {
    // Проверка, зарегистрирован ли пользователь
    if (users[chatId]) {
      bot.sendMessage(chatId, '✅ Вы уже зарегистрированы!');
      return;
    }

    // Проверяем, начинается ли никнейм с "@"
    if (!username.startsWith('@')) {
      bot.sendMessage(chatId, '🛑 Никнейм должен начинаться с символа "@". Пожалуйста, выберите другой никнейм.');
      return;
    }

    // Проверяем, занят ли никнейм
    const isUsernameTaken = Object.values(users).some(user => {
      // Игнорируем некорректные записи
      if (!user || !user.username) return false;
      return user.username.toLowerCase() === username.toLowerCase();
    });

    if (isUsernameTaken) {
      bot.sendMessage(chatId, `🛑 Имя "${username}" уже занято. Пожалуйста, выберите другое имя.`);
      return;
    }

    // Регистрируем пользователя
    users[chatId] = { 
      username, 
      balance: 0, 
      role: 'user' // Устанавливаем роль по умолчанию
    };

    // Сохраняем данные в файл
    saveUsers(users);

    // Подтверждаем регистрацию
    bot.sendMessage(chatId, `✅ Регистрация успешна! Добро пожаловать, ${username}. Список доступных команд: /help`);
  } catch (error) {
    console.error('Ошибка при регистрации:', error);

    bot.sendMessage(chatId, '🛑 Произошла ошибка при обработке вашей регистрации. Попробуйте позже.');
  }
});

bot.onText(/\/remove_worker (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userIdToRemove = match[1];

  if (!taxWorkers.includes(chatId)) {
    bot.sendMessage(chatId, '❌ Эта команда доступна только администраторам.');
    return;
  }


  if (users[userIdToRemove]) {
    const user = users[userIdToRemove];
    if (user.role === 'worker') {
      user.role = 'user'; 
      saveData(usersFile, users); 

      bot.sendMessage(chatId, `✅ Пользователь ${user.username} (ID: ${userIdToRemove}) теперь больше не является работником.`);
      bot.sendMessage(userIdToRemove, `❌ Ваши права работника были сняты.`);
    } else {
      bot.sendMessage(chatId, `⚠️ Пользователь ${user.username} (ID: ${userIdToRemove}) не является работником.`);
    }
  } else {
    bot.sendMessage(chatId, '❌ Пользователь с указанным ID не найден.');
  }
});



// Функция для загрузки данных из файла
function loadUsers() {
  if (fs.existsSync(usersFile)) {
    const data = fs.readFileSync(usersFile, 'utf-8');
    return JSON.parse(data);
  } else {
    return { authorizedUsers: [], employees: [] }; // Если файл не существует
  }
}





// Функции для сохранения данных
function saveData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Проверка, является ли пользователь налоговым работником
function isTaxWorker(userId) {
  return users[userId] && (users[userId].role === 'worker' || users[userId].role === 'admin');
}

// Загрузка пользователей
function loadUsers() {
  if (fs.existsSync(usersFile)) {
    const data = fs.readFileSync(usersFile, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

// Загрузка штрафов
function loadFines() {
  if (fs.existsSync(finesFile)) {
    const data = fs.readFileSync(finesFile, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

// Загрузка данных
function loadUsers() {
  if (fs.existsSync(usersFile)) {
    const data = fs.readFileSync(usersFile, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

function loadFines() {
  if (fs.existsSync(finesFile)) {
    const data = fs.readFileSync(finesFile, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

function saveFines() {
  fs.writeFileSync(finesFile, JSON.stringify(fines, null, 2), 'utf-8');
}

// Проверка, является ли пользователь работником
function isWorker(userId) {
  return users[userId] && users[userId].role === 'worker';
}

// Загрузка данных
function loadUsers() {
  if (fs.existsSync(usersFile)) {
    const data = fs.readFileSync(usersFile, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

function loadFines() {
  if (fs.existsSync(finesFile)) {
    const data = fs.readFileSync(finesFile, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

function saveFines() {
  fs.writeFileSync(finesFile, JSON.stringify(fines, null, 2), 'utf-8');
}

// Проверка, является ли пользователь работником
function isWorker(userId) {
  return users[userId] && users[userId].role === 'worker';
}

function loadUsers() {
  if (fs.existsSync(usersFile)) {
    const data = fs.readFileSync(usersFile, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

function loadFines() {
  if (fs.existsSync(finesFile)) {
    const data = fs.readFileSync(finesFile, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}


// Проверка, является ли пользователь работником
function isWorker(userId) {
  return users[userId] && users[userId].role === 'worker';
}

// Проверка, является ли пользователь с id 2030128216 (это особенный работник, который может менять статус)
function isSpecialWorker(userId) {
  return userId === '2030128216';
}

bot.onText(/\/fine (@\w+|\w+) (\d+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (!isWorker(chatId)) {
    bot.sendMessage(chatId, '❌ Эта команда доступна только для работников.');
    return;
  }

  const targetUsername = match[1]; // Имя пользователя из команды
  const amount = parseInt(match[2], 10);
  const reason = match[3];

  if (isNaN(amount) || amount <= 0) {
    bot.sendMessage(chatId, '❌ Укажите корректную сумму штрафа.');
    return;
  }

  // Ищем пользователя по username или first_name
  const targetUserId = Object.keys(users).find(
    (id) => 
      (users[id].username && users[id].username.toLowerCase() === targetUsername.toLowerCase()) || 
      (users[id].first_name && users[id].first_name.toLowerCase() === targetUsername.toLowerCase())
  );

  if (!targetUserId) {
    bot.sendMessage(chatId, `❌ Пользователь ${targetUsername} не найден.`);
    return;
  }

  // Убеждаемся, что у пользователя есть массив штрафов
  fines[targetUserId] ??= [];

  fines[targetUserId].push({
    amount,
    reason,
    issuedBy: chatId,
    date: new Date().toISOString(),
    paid: false,
    confirmedBy: null, // Добавляем поле для хранения ID подтверждающего работника
    rejectedBy: null, // Добавляем поле для хранения ID отклоняющего работника
  });



  bot.sendMessage(
    chatId,
    `✅ Штраф для ${targetUsername} на сумму ${amount} успешно добавлен.\nПричина: ${reason}.`
  );

  try {
    await bot.sendMessage(
      targetUserId,
      `❌ Вам выписан штраф на сумму ${amount}.\nПричина: ${reason}.\nНажмите "Штраф оплачен", если вы оплатили штраф.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Штраф оплачен',
                callback_data: `fine_paid_${targetUserId}`,
              },
            ],
          ],
        },
      }
    );
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error.message);
    bot.sendMessage(chatId, `⚠️ Не удалось отправить штраф пользователю. Возможно, он не начинал чат с ботом.`);
  }
});
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const targetUserId = data.split('_')[2];

    if (!fines[targetUserId]) {
        bot.answerCallbackQuery(query.id, { text: '❌ Штрафов не найдено.' });
        return;
    }

    // Если нажали "Штраф оплачен"
    if (data.startsWith('fine_paid_')) {
        // Находим неоплаченный штраф
        const unpaidFine = fines[targetUserId].find((fine) => !fine.paid && !fine.rejectedBy);

        if (!unpaidFine) {
            bot.answerCallbackQuery(query.id, { text: '✅ Все штрафы уже обработаны.' });
            return;
        }

        // Запрещаем пользователю нажимать кнопку несколько раз
        if (unpaidFine.requestedPayment) {
            bot.answerCallbackQuery(query.id, { text: '⚠️ Вы уже отправили запрос на оплату.' });
            return;
        }
        unpaidFine.requestedPayment = true;


        // Отправляем уведомление всем работникам
        Object.entries(users)
            .filter(([_, user]) => user.role === 'worker')
            .forEach(([workerId]) => {
                bot.sendMessage(
                    workerId,
                    `📢 Пользователь ${users[targetUserId].username} заявил, что оплатил штраф на сумму ${unpaidFine.amount}.\nПричина: ${unpaidFine.reason}.\n\nПодтвердите или отклоните оплату.`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '✅ Подтвердить оплату', callback_data: `confirm_payment_${targetUserId}` },
                                    { text: '❌ Отклонить оплату', callback_data: `reject_payment_${targetUserId}` },
                                ],
                            ],
                        },
                    }
                );
            });

        bot.answerCallbackQuery(query.id, { text: '✅ Заявка на оплату отправлена работникам.' });
    }

    // Подтверждение оплаты штрафа
    if (data.startsWith('confirm_payment_') || data.startsWith('reject_payment_')) {
        const unpaidFineIndex = fines[targetUserId].findIndex((fine) => !fine.paid && !fine.rejectedBy);

        if (unpaidFineIndex === -1) {
            bot.answerCallbackQuery(query.id, { text: '✅ Все штрафы уже обработаны.' });
            return;
        }

        const unpaidFine = fines[targetUserId][unpaidFineIndex];

        if (unpaidFine.paid || unpaidFine.rejectedBy) {
            bot.answerCallbackQuery(query.id, { text: '❌ Штраф уже был обработан другим работником.' });
            return;
        }

        const isConfirm = data.startsWith('confirm_payment_');
        unpaidFine.paid = isConfirm;
        unpaidFine.rejectedBy = isConfirm ? null : chatId;
        unpaidFine.confirmedBy = isConfirm ? chatId : null;


        const statusText = isConfirm ? '✅ Оплачено' : '❌ Отклонено';
        bot.answerCallbackQuery(query.id, { text: `✅ Штраф ${statusText}.` });

        bot.sendMessage(
            chatId,
            `✅ Статус штрафа пользователя ${users[targetUserId].username} был изменен на "${statusText}".`
        );

        bot.sendMessage(
            targetUserId,
            `✅ Ваш штраф на сумму ${unpaidFine.amount} был изменен на "${statusText}".`
        );

        // Убираем кнопки у всех работников
        Object.entries(users)
            .filter(([_, user]) => user.role === 'worker')
            .forEach(([workerId]) => {
                bot.editMessageReplyMarkup(
                    { inline_keyboard: [] },
                    { chat_id: workerId, message_id: unpaidFine.messageId }
                ).catch(() => {});
            });
    }
});
// Команда для 2030128216, чтобы изменить статус штрафа
bot.onText(/\/change_fine_status (\d+) (\w+)/, (msg, match) => {
  const chatId = msg.chat.id;

  // Проверяем, что пользователь является тем самым работником с ID 2030128216
  if (!isSpecialWorker(chatId)) {
    bot.sendMessage(chatId, '❌ Эта команда доступна только для специального работника.');
    return;
  }

  const targetUserId = match[1];
  const status = match[2].toLowerCase();

  // Находим штраф для пользователя
  const unpaidFine = fines[targetUserId]?.find((fine) => !fine.paid);

  if (!unpaidFine) {
    bot.sendMessage(chatId, `❌ У пользователя ${users[targetUserId]?.username || 'неизвестный'} нет неоплаченных штрафов.`);
    return;
  }

  // Проверяем, что статус корректен (оплачено или отказано)
  if (status !== 'оплачено' && status !== 'отказано') {
    bot.sendMessage(chatId, '❌ Статус может быть только "оплачено" или "отказано".');
    return;
  }
// Обновляем статус
  unpaidFine.paid = (status === 'оплачено');
  unpaidFine.rejectedBy = (status === 'отказано') ? chatId : null;
  unpaidFine.confirmedBy = (status === 'оплачено') ? chatId : null;

  

  // Уведомляем работника, что статус штрафа был изменен
  bot.sendMessage(chatId, `✅ Статус штрафа для пользователя ${users[targetUserId]?.username || 'неизвестного'} был изменен на "${status}".`);

  // Уведомление пользователя о том, что его статус был изменен
  bot.sendMessage(
    targetUserId,
    `✅ Статус вашего штрафа на сумму ${unpaidFine.amount} был изменен на "${status}". Причина: ${unpaidFine.reason}.`
  );

  // Убираем кнопки, если они еще остались
  bot.editMessageReplyMarkup(
    { inline_keyboard: [] },
    { chat_id: targetUserId, message_id: unpaidFine.messageId }
  );
});
bot.onText(/\/archive/, (msg) => {
  const chatId = msg.chat.id;

  if (!users[chatId]) {
    bot.sendMessage(chatId, '🛑 Вы не зарегистрированы! Используйте команду /register <имя> для регистрации.');
    return;
  }

  const userFines = fines[chatId] || [];
  const archiveList = userFines
    .filter((fine) => fine.paid || fine.cancelled)
    .map((fine, index) => {
      const status = fine.paid
        ? 'Оплачен'
        : fine.cancelled
        ? 'Аннулирован'
        : 'Неизвестно';

      return `Штраф ${index + 1}:\n` +
             `- Сумма: ${fine.amount} ар\n` +
             `- Причина: ${fine.reason || 'Не указана'}\n` +
             `- Статус: ${status}\n` +
             `- Дата: ${
               fine.paidAt ? new Date(fine.paidAt).toLocaleString() : 'Не указана'
             }\n\n`;
    });

  const response = archiveList.length > 0
    ? '📂 Архив штрафов:\n\n' + archiveList.join('')
    : '📂 У вас нет архивных штрафов.';

  bot.sendMessage(chatId, response, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '❌ Закрыть меню', callback_data: 'close_menu' },
          { text: '📋 Посмотреть текущие штрафы', callback_data: 'view_current_fines' },
        ],
      ],
    },
  }).then((message) => {
    // Удаляем предыдущее сообщение
    bot.deleteMessage(chatId, msg.message_id);
  });
});

// Обработка нажатий на кнопки
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data === 'close_menu') {
    // Закрытие меню
    bot.deleteMessage(chatId, callbackQuery.message.message_id);
  } else if (data === 'view_current_fines') {
    // Удаляем старое сообщение
    bot.deleteMessage(chatId, callbackQuery.message.message_id);

    // Просмотр текущих штрафов
    const userFines = fines[chatId] || [];
    const currentFines = userFines
      .filter(fine => !fine.paid && !fine.cancelled)
      .map((fine, index) => {
        return `Штраф ${index + 1}:\n` +
               `- Сумма: ${fine.amount} ар\n` +
               `- Причина: ${fine.reason || 'Не указана'}\n` +
               `- Статус: Неоплачено\n` +
               `- Дата: ${new Date(fine.date).toLocaleString()}\n\n`;
      });

    const response = currentFines.length > 0
      ? '📋 Текущие штрафы:\n\n' + currentFines.join('')
      : '📋 У вас нет текущих штрафов.';

    // Отправляем сообщение с кнопками для текущих штрафов
    bot.sendMessage(chatId, response, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '❌ Закрыть меню', callback_data: 'close_menu' },
            { text: '📂 Посмотреть архив штрафов', callback_data: 'archive' },
          ],
        ],
      },
    });
  } else if (data === 'archive') {
    // Удаляем старое сообщение
    bot.deleteMessage(chatId, callbackQuery.message.message_id);

    // Вернуться к просмотру архива
    const userFines = fines[chatId] || [];
    const archiveList = userFines
      .filter((fine) => fine.paid || fine.cancelled)
      .map((fine, index) => {
        const status = fine.paid
          ? 'Оплачен'
          : fine.cancelled
          ? 'Аннулирован'
          : 'Неизвестно';

        return `Штраф ${index + 1}:\n` +
               `- Сумма: ${fine.amount} ар\n` +
               `- Причина: ${fine.reason || 'Не указана'}\n` +
               `- Статус: ${status}\n` +
               `- Дата: ${
                 fine.paidAt ? new Date(fine.paidAt).toLocaleString() : 'Не указана'
               }\n\n`;
      });

    const response = archiveList.length > 0
      ? '📂 Архив штрафов:\n\n' + archiveList.join('')
      : '📂 У вас нет архивных штрафов.';

    bot.sendMessage(chatId, response, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '❌ Закрыть меню', callback_data: 'close_menu' },
            { text: '📋 Посмотреть текущие штрафы', callback_data: 'view_current_fines' },
          ],
        ],
      },
    });
  } else if (data === 'check_fines') {
    // Удаляем старое сообщение
    bot.deleteMessage(chatId, callbackQuery.message.message_id);

    // Проверить штрафы с автоматическим списанием
    autoPayFines(chatId);

    const userFines = fines[chatId] || [];
    const unpaidFines = userFines.filter((fine) => !fine.paid && !fine.cancelled);

    if (unpaidFines.length > 0) {
      const fineList = unpaidFines.map((fine, index) => {
        return `Штраф ${index + 1}:\n` +
               `- Сумма: ${fine.amount} ар\n` +
               `- Причина: ${fine.reason || 'Не указана'}\n` +
               `- Дата: ${new Date(fine.date).toLocaleString()}\n`;
      }).join('\n');

      bot.sendMessage(chatId, `🛑 У вас есть неоплаченные штрафы:\n\n${fineList}`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '❌ Закрыть меню', callback_data: 'close_menu' },
              { text: '📂 Посмотреть архив штрафов', callback_data: 'archive' },
            ],
          ],
        },
      });
    } else {
      bot.sendMessage(chatId, '✅ У вас нет неоплаченных штрафов.', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '❌ Закрыть меню', callback_data: 'close_menu' },
              { text: '📂 Посмотреть архив штрафов', callback_data: 'archive' },
            ],
          ],
        },
      });
    }
  }
});


// Функция для автоматической оплаты штрафов
function autoPayFines(userId) {
  const user = users[userId];
  const userFines = fines[userId] || [];

  if (!user || !userFines.length) return;

  userFines.forEach((fine) => {
    if (!fine.paid && !fine.cancelled && user.balance >= fine.amount) {
      user.balance -= fine.amount; // Списываем сумму штрафа с баланса
      fine.paid = true; // Отмечаем штраф как оплаченный
      fine.paidAt = new Date().toISOString(); // Записываем дату оплаты
    }
  });

  // Сохраняем обновленные данные
  saveData(usersFile, users);
  saveData(finesFile, fines);
}

// Функция для безопасного удаления сообщения
function safeDeleteMessage(chatId, messageId) {
  if (!chatId || !messageId) return; // Проверяем, что параметры заданы
  bot.deleteMessage(chatId, messageId).catch((err) => {
    if (err.response && err.response.body && err.response.body.description) {
      console.warn(
        `Не удалось удалить сообщение ${messageId} в чате ${chatId}: ${err.response.body.description}`
      );
    } else {
      console.error(`Не удалось удалить сообщение ${messageId} в чате ${chatId}:`, err);
    }
  });
}

// Команда /check_fines с автоматической оплатой
bot.onText(/\/check_fines/, (msg) => {
  const chatId = msg.chat.id;

  if (!users[chatId]) {
    bot.sendMessage(chatId, '🛑 Вы не зарегистрированы! Используйте команду /register <имя> для регистрации.');
    return;
  }

  // Автоматическая оплата штрафов
  autoPayFines(chatId);

  // Проверяем список штрафов пользователя
  const userFines = fines[chatId] || [];
  const unpaidFines = userFines.filter((fine) => !fine.paid && !fine.cancelled);

  let response;
  if (unpaidFines.length > 0) {
    const fineList = unpaidFines.map((fine, index) => {
      return `Штраф ${index + 1}:\n` +
             `- Сумма: ${fine.amount} ар\n` +
             `- Причина: ${fine.reason || 'Не указана'}\n` +
             `- Дата: ${new Date(fine.date).toLocaleString()}\n`;
    }).join('\n');

    response = `🛑 У вас есть неоплаченные штрафы:\n\n${fineList}`;
  } else {
    response = '✅ У вас нет неоплаченных штрафов.';
  }

  // Отправляем сообщение с кнопками
  bot.sendMessage(chatId, response, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '❌ Закрыть меню', callback_data: 'close_menu' },
          { text: '📂 Посмотреть архив штрафов', callback_data: 'archive' },
        ],
      ],
    },
  }).then((message) => {
    // Удаляем сообщение с командой
    safeDeleteMessage(chatId, msg.message_id);
  });
});

// Обработка нажатий на кнопки
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data === 'close_menu') {
    // Закрытие меню
    safeDeleteMessage(chatId, callbackQuery.message.message_id);
  } else if (data === 'archive') {
    // Удаляем старое сообщение
    safeDeleteMessage(chatId, callbackQuery.message.message_id);


  }
});


// Функция для ручной проверки штрафов (если сотрудник налоговой хочет проверить)
bot.onText(/\/check_user_fines/, (msg) => {
  const chatId = msg.chat.id;

  if (!isWorker(chatId)) {
    bot.sendMessage(chatId, '🛑 Эта команда доступна только для сотрудников налоговой.');
    return;
  }

  const commandParts = msg.text.split(' ');
  const username = commandParts[1];

  if (!username) {
    bot.sendMessage(chatId, '🛑 Укажите имя пользователя. Пример: /check_user_fines @username');
    return;
  }

  const targetUserId = Object.keys(users).find((id) => users[id]?.username === username);

  if (!targetUserId) {
    bot.sendMessage(chatId, `🛑 Пользователь с именем ${username} не найден.`);
    return;
  }

  autoPayFines(targetUserId); // Автоматическая оплата штрафов для указанного пользователя

  const userFines = fines[targetUserId] || [];
  const unpaidFines = userFines.filter((fine) => !fine.paid && !fine.cancelled);

  if (unpaidFines.length > 0) {
    const fineList = unpaidFines.map((fine, index) => {
      return `Штраф ${index + 1}:\n` +
             `- Сумма: ${fine.amount} ар\n` +
             `- Причина: ${fine.reason || 'Не указана'}\n` +
             `- Дата: ${new Date(fine.date).toLocaleString()}\n`;
    }).join('\n');

    bot.sendMessage(chatId, `🛑 У пользователя ${username} есть неоплаченные штрафы:\n\n${fineList}`);
  } else {
    bot.sendMessage(chatId, `✅ У пользователя ${username} нет неоплаченных штрафов.`);
  }
});


// Команда для создания заявки на оплату с возможной причиной

// Команда /cancel_fine для аннулирования штрафа (только для работников налоговой)
bot.onText(/\/cancel_fine (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const fineIndex = parseInt(match[1]);

  // Проверка, является ли пользователь работником налоговой
  if (!isTaxWorker(chatId)) {
    bot.sendMessage(chatId, '🛑 Эта команда доступна только работникам налоговой.');
    return;
  }

  // Находим ID пользователя по индексу штрафа
  let targetUserId;
  for (const userId in fines) {
    if (fines[userId][fineIndex]) {
      targetUserId = userId;
      break;
    }
  }

  if (!targetUserId || !fines[targetUserId] || !fines[targetUserId][fineIndex]) {
    bot.sendMessage(chatId, '🛑 Штраф с таким индексом не найден.');
    return;
  }

  const fine = fines[targetUserId][fineIndex];

  // Проверка, не был ли уже отменён штраф
  if (fine.cancelled) {
    bot.sendMessage(chatId, `🛑 Этот штраф уже был отменён.`);
    return;
  }

  // Аннулирование штрафа
  fine.cancelled = true;

  // Возвращаем сумму штрафа на баланс пользователя
  users[targetUserId].заявок += fine.amount;

  // Сохраняем изменения в файлах
  saveData(finesFile, fines);
  saveData(usersFile, users);

  // Уведомление работников налоговой и пользователя
  bot.sendMessage(chatId, `🛑 Штраф для ${users[targetUserId].username} на сумму ${fine.amount} был успешно аннулирован.`);
  bot.sendMessage(targetUserId, `✅ Ваш штраф на сумму ${fine.amount} был аннулирован. Ваш новый баланс: ${users[targetUserId].balance}`);
});
// Подсказка для использования /cancel_fine (если команда была написана неверно)
bot.onText(/\/cancel_fine/, (msg) => {
  const chatId = msg.chat.id;

  if (!isTaxWorker(chatId)) {
    bot.sendMessage(chatId, '🛑 Эта команда доступна только работникам налоговой.');
    return;
  }

  bot.sendMessage(chatId, '🛑 Используйте команду в следующем формате: /cancel_fine <индекс штрафа>\nПример: /cancel_fine 2\nКоманда отменит штраф с указанным индексом.');
});
// Функция для уведомления работников налоговой о новой заявке
function notifyTaxWorkers(paymentRequest) {
  taxWorkers.forEach(workerId => {
    bot.sendMessage(workerId, `🛑 Новая заявка на оплату:\n\nПользователь: ${paymentRequest.username}\nСумма: ${paymentRequest.amount}ар\nКомментарий: ${paymentRequest.comment}\nДата: ${paymentRequest.date}\n\nПодтвердите её командой /list_payments`);
  });
}


// Путь к файлу payments.json
const paymentsFile = './payments.json';

// Функция для загрузки данных из JSON файла
function loadData(filePath) {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return [];
}

// Функция для сохранения данных в JSON файл
function saveData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Инициализация массива payments
let payments = loadData(paymentsFile);

// Команда /pay
bot.onText(/\/pay (\d+)(?: (.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const amount = parseInt(match[1]);
  const comment = match[2] || 'Оплата штрафа';

  if (isNaN(amount) || amount <= 0) {
    bot.sendMessage(chatId, '🛑 Пожалуйста, укажите корректную сумму для оплаты.');
    return;
  }

  if (!users[chatId]) {
    bot.sendMessage(chatId, '🛑 Вы не зарегистрированы! Используйте команду /register <имя> для регистрации.');
    return;
  }

  // Создание заявки на оплату
  const paymentRequest = {
    userId: chatId,
    username: users[chatId].username,
    amount,
    comment,
    date: new Date().toISOString(),
    status: 'pending',
  };

  payments.push(paymentRequest);
  saveData(paymentsFile, payments);

  bot.sendMessage(chatId, `✅ Заявка на оплату на сумму ${amount} создана. Ожидайте подтверждения.`);
  notifyTaxWorkers(paymentRequest);
});

// Команда /list_payments
bot.onText(/\/payments_list/, (msg) => {

  const chatId = msg.chat.id;

  if (!isTaxWorker(chatId)) {
    bot.sendMessage(chatId, '🛑 Эта команда доступна только работникам налоговой.');
    return;
  }

  let paymentsList = '📋 Список заявок на оплату:\n\n';
  const buttons = [];
  let foundPayments = false;

  payments.forEach((payment, index) => {
    if (payment.status === 'pending') {
      foundPayments = true;
      paymentsList += `Заявка №${index}\n` +
        `- Пользователь: ${payment.username}\n` +
        `- Сумма: ${payment.amount} ар\n` +
        `- Комментарий: ${payment.comment || 'Нет'}\n` +
        `- Дата: ${payment.date}\n\n`;

      buttons.push([{
        text: `Подтвердить оплату №${index}`,
        callback_data: `approve_payment_${index}`,
      }]);
    }
  });

  if (!foundPayments) {
    bot.sendMessage(chatId, '✅ Нет ожидающих заявок на оплату.');
    return;
  }

  bot.sendMessage(chatId, paymentsList, {
    reply_markup: {
      inline_keyboard: buttons,
    },
  });
});

// Обработка нажатий кнопок
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith('approve_payment_')) {
    const paymentIndex = parseInt(data.split('_')[2]);

    if (isNaN(paymentIndex) || !payments[paymentIndex]) {
      bot.answerCallbackQuery(query.id, { text: '❌ Заявка не найдена.' });
      return;
    }

    const payment = payments[paymentIndex];

    if (payment.status !== 'pending') {
      bot.answerCallbackQuery(query.id, { text: '🛑 Эта заявка уже обработана.' });
      return;
    }

    // Подтверждаем оплату и обновляем данные
    users[payment.userId].balance += payment.amount;
    payment.status = 'approved';

    saveData(paymentsFile, payments);
    saveData(usersFile, users);

    bot.answerCallbackQuery(query.id, { text: `✅ Оплата на сумму ${payment.amount} ар подтверждена.` });
    bot.sendMessage(chatId, `✅ Оплата на сумму ${payment.amount} для пользователя ${payment.username} подтверждена.`);
    bot.sendMessage(payment.userId, `✅ Ваша заявка на оплату на сумму ${payment.amount} была подтверждена!`);
  }
});



bot.onText(/\/list_pending/, (msg) => {
  const chatId = msg.chat.id;

  // Фильтруем только заявки со статусом "в ожидании"
  const pendingDeliveries = deliveries.filter((d) => d.status === 'в ожидании');

  if (pendingDeliveries.length === 0) {
    bot.sendMessage(chatId, '✅ Все заявки обработаны.');
    return;
  }

  pendingDeliveries.forEach((delivery, index) => {
    bot.sendMessage(
      chatId,
      `📦 *Заявка №${index + 1}:*\n\n` +
        `- Никнейм: ${delivery.nickname}\n` +
        `- Товары: ${delivery.items}\n` +
        `- Координаты: ${delivery.coordinates}\n` +
        `- Дата: ${delivery.date}\n` +
        `- Статус: ${delivery.status}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: `✅ Подтвердить заявку №${index + 1}`, callback_data: `confirm_delivery_${delivery.nickname}` }
            ]
          ]
        }
      }
    );
  });
});

// Обработка кнопки "Подтвердить доставку"
bot.on('callback_query', (callbackQuery) => {
  const data = callbackQuery.data;

  if (data.startsWith('confirm_delivery_')) {
    const nickname = data.replace('confirm_delivery_', '');

    // Находим заявку
    const delivery = deliveries.find((delivery) => delivery.nickname === nickname && delivery.status === 'в ожидании');

    if (delivery) {
      delivery.status = 'доставлено'; // Обновляем статус

      // Сохраняем изменения в файл
      saveDeliveries();

      // Отправляем уведомление администратору
      bot.sendMessage(adminChatId, `✅ Доставка для ${nickname} подтверждена.`);

      // Убираем кнопку подтверждения
      bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: callbackQuery.message.chat.id, message_id: callbackQuery.message.message_id }
      );

      bot.answerCallbackQuery(callbackQuery.id, { text: 'Доставка подтверждена!' });

      // Уведомляем пользователя
      if (delivery.chatId) {
        bot.sendMessage(
          delivery.chatId,
          `📦 Ваша заявка на доставку была успешно выполнена. Спасибо за использование нашего бота!`
        );
      }
    } else {
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Заявка не найдена или уже обработана.' });
    }
  }
});


const deliveriesFile = 'deliveries.json';

// Загружаем данные о доставках из файла
let deliveries = [];
if (fs.existsSync(deliveriesFile)) {
  deliveries = JSON.parse(fs.readFileSync(deliveriesFile, 'utf8'));
}

// Сохраняем данные в файл
function saveDeliveries() {
  fs.writeFileSync(deliveriesFile, JSON.stringify(deliveries, null, 2), 'utf-8');
}

// Загружаем данные о доставках
function loadDeliveries() {
  if (fs.existsSync(deliveriesFile)) {
    const data = fs.readFileSync(deliveriesFile, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

// Загружаем заявки при старте
deliveries = loadDeliveries();

// Хранилище для отслеживания попыток с ошибками
const deliveryAttempts = {};

// Регулярное выражение для проверки формата заявки
const deliveryFormatRegex =
  /Никнейм:\s*(.+)\nТовары:\s*(.+)\nКоординаты:\s*(.+)\nДата оформление доставки:\s*(\d{2}\/\d{2}\/\d{4})/;

// Функция для получения текущей даты в формате DD/MM/YYYY
function getCurrentDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
}

bot.onText(/\/(oformit_dostavky|оформить_доставку)/, (msg) => {
  const chatId = msg.chat.id;

  // Сбрасываем счетчик ошибок
  deliveryAttempts[chatId] = 0;

  // Текст шаблона с текущей датой
  const deliveryTemplate =
    `Никнейм: \nТовары: \nКоординаты: x y z\nДата оформление доставки: ${getCurrentDate()}`;

  // Отправляем сообщение с инструкцией
  bot.sendMessage(
    chatId,
    `Чтобы оформить доставку, заполните анкету по следующему образцу:\n\n` +
      `*Образец:*\n\n${deliveryTemplate}\n\n` +
      `📌 Важно: Товары, пожалуйста, разделяйте запятыми.\n` + 
      `📌 Важно: Если товар не доставляется, а выдается (например, команды /co i, /co near, /v или префикс), в поле координат указывайте нули.\n\n` +
      `Сообщение должно строго соответствовать формату!`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Копировать образец',
              callback_data: 'copy_delivery_template',
            },
          ],
        ],
      },
    }
  );
});

// Слушаем нажатие на кнопку
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'copy_delivery_template') {
    const deliveryTemplate =
      `Никнейм: \nТовары: \nКоординаты: x y z\nДата оформление доставки: ${getCurrentDate()}`;
    bot.sendMessage(chatId, deliveryTemplate, { parse_mode: 'Markdown' });
    bot.answerCallbackQuery(query.id, { text: 'Шаблон отправлен!' });
  }
});

// Обработка заявок
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (deliveryAttempts[chatId] === undefined) return;

  if (deliveryFormatRegex.test(text)) {
    const match = text.match(deliveryFormatRegex);
    const nickname = match[1].trim();

    if (!nickname) {
      bot.sendMessage(
        chatId,
        `❌ Поле "Никнейм" не должно быть пустым. Заполните анкету по образцу!`
      );
      return;
    }

    deliveryAttempts[chatId] = 0;

    const deliveryData = {
      nickname: nickname,
      items: match[2].trim(),
      coordinates: match[3].trim(),
      date: match[4].trim(),
      chatId: chatId,
      status: 'в ожидании',
    };

    deliveries.push(deliveryData);
    saveDeliveries();

    bot.sendMessage(chatId, '✅ Ваша заявка успешно отправлена на обработку!');

    bot.sendMessage(
      adminChatId,
      `📦 *Новая заявка на доставку:*\n\n` +
        `*Никнейм:* ${deliveryData.nickname}\n` +
        `*Товары:* ${deliveryData.items}\n` +
        `*Координаты:* ${deliveryData.coordinates}\n` +
        `*Дата оформления доставки:* ${deliveryData.date}\n` +
        `*Статус:* ${deliveryData.status}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Подтвердить доставку',
                callback_data: `confirm_${nickname}`,
              },
              {
                text: 'Отменить доставку',
                callback_data: `cancel_${nickname}`,
              },
            ],
          ],
        },
      }
    );
  }
});

// Обработка кнопок подтверждения и отмены доставки
bot.on('callback_query', (callbackQuery) => {
  const data = callbackQuery.data;

  if (data.startsWith('confirm_')) {
    const nickname = data.split('_')[1];
    const delivery = deliveries.find((delivery) => delivery.nickname === nickname);

    if (delivery) {
      delivery.status = 'доставлено';
      saveDeliveries();

      bot.sendMessage(adminChatId, `✅ Доставка для ${nickname} подтверждена.`);
      bot.sendMessage(delivery.chatId, `📦 Ваша заявка на доставку выполнена!`);
    }
  }
  
  if (data.startsWith('cancel_')) {
    const nickname = data.split('_')[1];
    const index = deliveries.findIndex((delivery) => delivery.nickname === nickname);

    if (index !== -1) {
      deliveries.splice(index, 1);
      saveDeliveries();

      bot.sendMessage(adminChatId, `❌ Доставка для ${nickname} отменена.`);
      bot.sendMessage(callbackQuery.message.chat.id, `🚫 Заявка на доставку отменена.`);
    }
  }

  bot.editMessageReplyMarkup(
    { inline_keyboard: [] },
    { chat_id: callbackQuery.message.chat.id, message_id: callbackQuery.message.message_id }
  );

  bot.answerCallbackQuery(callbackQuery.id, { text: 'Операция выполнена!' });
});

bot.onText(/\/submit_case/, (msg) => {
  const chatId = msg.chat.id;

  // Текст, который будет отправлен для копирования
  const caseTemplate = 
    `Кто подает: \n` +
    `На кого: \n` +
    `Что произошло: \n` +
    `Дополнительная информация: \n` +
    `Требования: `;

  // Отправляем сообщение с кнопкой для копирования
  bot.sendMessage(
    chatId,
    `Чтобы подать заявление в суд, заполните анкету в следующем формате:\n` +         `Кто подает: Ваше имя\n` +
    `На кого: Ответчик\n` +
    `Что произошло: Краткое описание\n` +
    `Дополнительная информация: Детали\n` +
    `Требования: Ваши требования`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Копировать образец(текст снизу можно скопировать нажатием)",
              callback_data: "copy_template"
            }
          ]
        ]
      }
    }
  );

  // Слушаем нажатие на кнопку
  bot.on('callback_query', (query) => {
    if (query.data === 'copy_template') {
      // Отправляем текст шаблона пользователю
      bot.sendMessage(chatId, `\`${caseTemplate}\``, { parse_mode: 'Markdown' });
    }
  });
});

// Проверка формата заявления в суд
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  const courtFormatRegex =
    /Кто подает: (.+)\nНа кого: (.+)\nЧто произошло: (.+)\nДополнительная информация: (.+)\nТребования: (.+)/;

  if (courtFormatRegex.test(text)) {
    const match = text.match(courtFormatRegex);
    const courtData = {
      plaintiff: match[1],
      defendant: match[2],
      description: match[3],
      details: match[4],
      demands: match[5],
    };


    bot.sendMessage(
      adminChatId,
      `Новая заявка в суд:\n\n` +
        `Кто подает: ${courtData.plaintiff}\n` +
        `На кого: ${courtData.defendant}\n` +
        `Что произошло: ${courtData.description}\n` +
        `Дополнительная информация: ${courtData.details}\n` +
        `Требования: ${courtData.demands}`
    );

    bot.sendMessage(chatId, '✅ Ваше заявление в суд успешно отправлено!');
  }
});
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const message = `Привет! Добро пожаловать в бота! Используйте встроенную клавиатуру ниже для выбора команды.\n\n` +
    `Информация о боте: /info\n` +
    `Подать дело в суд: /submit_case\n` +
    `Доставка: /оформить_доставку\n` +
    `Регистрация: /register @username\n`;

  // Удаляем клавиатуру и отправляем приветственное сообщение
  bot.sendMessage(chatId, message, {
    reply_markup: {
      remove_keyboard: true,
    },
  });
});

// Команда: /report_fine — Отчет по штрафам
bot.onText(/\/report_fine/, (msg) => {
  const chatId = msg.chat.id;

  if (!isWorker(chatId)) {
    bot.sendMessage(chatId, '🛑 Эта команда доступна только для сотрудников.');
    return;
  }

  const { totalFines, totalPaid, totalCancelled, totalUnpaidAmount } = getFineStatistics();

  const report = `📊 Отчет по штрафам:\n\n` +
                 `- Всего выписано штрафов: ${totalFines}\n` +
                 `- Оплачено штрафов: ${totalPaid}\n` +
                 `- Аннулировано штрафов: ${totalCancelled}\n` +
                 `- Сумма неоплаченных штрафов: ${totalUnpaidAmount} ар\n`;

  bot.sendMessage(chatId, report, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔍 Топ должников', callback_data: 'top_debtors' }],
        [{ text: '❌ Закрыть', callback_data: 'close_report' }],
      ],
    },
  });
});

// Команда: /top_debtors — Топ должников
bot.onText(/\/top_debtors/, (msg) => {
  const chatId = msg.chat.id;

  if (!isWorker(chatId)) {
    bot.sendMessage(chatId, '🛑 Эта команда доступна только для сотрудников.');
    return;
  }

  const debtors = getTopDebtors();

  const response = debtors.length > 0
    ? '📋 Топ должников:\n\n' + debtors.map((debtor, i) => `${i + 1}. ${debtor.username}: ${debtor.amount} ар`).join('\n')
    : '✅ Все пользователи оплатили свои штрафы.';

  bot.sendMessage(chatId, response, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📊 Отчет по штрафам', callback_data: 'fine_report' }],
        [{ text: '❌ Закрыть', callback_data: 'close_report' }],
      ],
    },
  });
});

// Callback обработчик кнопок
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data === 'close_report') {
    bot.deleteMessage(chatId, callbackQuery.message.message_id).catch(() => {});
  } else if (data === 'fine_report') {
    bot.deleteMessage(chatId, callbackQuery.message.message_id).catch(() => {});
    bot.sendMessage(chatId, '/report_fine'); // Вызов отчета
  } else if (data === 'top_debtors') {
    bot.deleteMessage(chatId, callbackQuery.message.message_id).catch(() => {});
    bot.sendMessage(chatId, '/top_debtors'); // Вызов топа должников
  }

  bot.answerCallbackQuery(callbackQuery.id);
});

// Вспомогательные функции
function getFineStatistics() {
  let totalFines = 0;
  let totalPaid = 0;
  let totalCancelled = 0;
  let totalUnpaidAmount = 0;

  for (const userId in fines) {
    const userFines = fines[userId] || [];
    userFines.forEach((fine) => {
      totalFines++;
      if (fine.paid) totalPaid++;
      else if (fine.cancelled) totalCancelled++;
      else totalUnpaidAmount += fine.amount;
    });
  }

  return { totalFines, totalPaid, totalCancelled, totalUnpaidAmount };
}

function getTopDebtors() {
  const debtors = [];

  for (const userId in fines) {
    const userFines = fines[userId] || [];
    const unpaidAmount = userFines
      .filter(fine => !fine.paid && !fine.cancelled)
      .reduce((sum, fine) => sum + fine.amount, 0);

    if (unpaidAmount > 0) {
      debtors.push({ username: users[userId]?.username || `ID: ${userId}`, amount: unpaidAmount });
    }
  }

  return debtors.sort((a, b) => b.amount - a.amount).slice(0, 10);
}
bot.onText(/\/info/, (msg) => {
  const chatId = msg.chat.id;
  const infoMessage = 
    `🤖 <b>Информация о боте:</b>\n\n` +
    `Этот бот помогает оформить быструю доставку товаров или узнать штрафы (возможно временно не актуально). Для оформления заказа используйте команду /оформить_доставку и заполните анкету по указанному образцу.\n` + 
    `Другие команды доступны по команде /help.\n\n` +
    `Если у вас возникнут вопросы, напишите в Артику(@ArtikYaYa). Спасибо за использование нашего сервиса!`;

  bot.sendMessage(chatId, infoMessage, { parse_mode: "HTML" });
});


// Разрешённые ID пользователей для ограниченных команд
const allowedUserIds = [6343971096, 2030128216];

// Имя файла для хранения данных
const HISTORY_FILE = 'userHistory.json';

// Объект для хранения истории пользователей
let userHistory = {};

// Загрузка истории из файла
function loadHistory() {
    if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
        userHistory = JSON.parse(data);
    }
}

// Сохранение истории в файл
function saveHistory() {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(userHistory, null, 2));
}

// Загрузить историю при запуске
loadHistory();

// Проверка доступа к ограниченным командам
function isAllowed(userId) {
    return allowedUserIds.includes(userId);
}

// Команда /add для добавления записи другому пользователю
bot.onText(/\/add (\d+) (.+)/, (msg, match) => {
    const userId = msg.from.id;

    if (!isAllowed(userId)) {
        return bot.sendMessage(userId, 'У вас нет доступа к этой команде.');
    }

    const targetUserId = parseInt(match[1], 10); // ID целевого пользователя
    const message = match[2]; // Сообщение

    if (!userHistory[targetUserId]) {
        userHistory[targetUserId] = [];
    }

    userHistory[targetUserId].push(message);
    saveHistory(); // Сохраняем изменения в файл
    bot.sendMessage(userId, `Запись добавлена для пользователя ${targetUserId}:\n"${message}"`);
});

// Команда /history для просмотра истории определённого пользователя
bot.onText(/\/history (\d+)/, (msg, match) => {
    const userId = msg.from.id;

    if (!isAllowed(userId)) {
        return bot.sendMessage(userId, 'У вас нет доступа к этой команде.');
    }

    const targetUserId = parseInt(match[1], 10); // ID целевого пользователя
    const history = userHistory[targetUserId] || [];

    if (history.length === 0) {
        return bot.sendMessage(userId, `У пользователя ${targetUserId} нет записей.`);
    }

    const historyText = history.map((item, index) => `${index + 1}. ${item}`).join('\n');
    bot.sendMessage(userId, `История пользователя ${targetUserId}:\n${historyText}`);
});

// Команда /clear для очистки истории определённого пользователя
bot.onText(/\/clear (\d+)/, (msg, match) => {
    const userId = msg.from.id;

    if (!isAllowed(userId)) {
        return bot.sendMessage(userId, 'У вас нет доступа к этой команде.');
    }

    const targetUserId = parseInt(match[1], 10); // ID целевого пользователя
    userHistory[targetUserId] = [];
    saveHistory(); // Сохраняем изменения в файл
    bot.sendMessage(userId, `История пользователя ${targetUserId} очищена.`);
});

// Команда /all для просмотра всех пользователей с историей
bot.onText(/\/all/, (msg) => {
    const userId = msg.from.id;

    if (!isAllowed(userId)) {
        return bot.sendMessage(userId, 'У вас нет доступа к этой команде.');
    }

    const usersWithHistory = Object.keys(userHistory)
        .filter((id) => userHistory[id] && userHistory[id].length > 0)
        .map((id) => `ID: ${id}, Записей: ${userHistory[id].length}`);

    if (usersWithHistory.length === 0) {
        return bot.sendMessage(userId, 'Ни у одного пользователя нет записей.');
    }

    const response = usersWithHistory.join('\n');
    bot.sendMessage(userId, `Пользователи с записями:\n${response}`);
});





// Массив известных команд
const knownCommands = [
  '/start',
  '/help',
  '/oformit_dostavky',
  '/оформить_доставку',
  '/contact',
  `/all`,
  `/history`,
  `/clear`,
  `/add`,
  `/info`,
  `/top_debtors`,
  `/check_fines`,
  `/archive`,
  `/list`,
  `/fine`,
  `/notify_debtors`,
  `/check_user_fines`,
  `/report_fine`,
  `/remove_worker`,
  `/add_worker`,
  `/payments_list`,
  `/submit_case`,
  `/register`,
  `/guess_game`,
  `/tap_game`,
  `/guess`,
  `/game`,
  `/worker_help`,
  `/list_pending`
];

// Обработчик всех сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Проверяем, начинается ли сообщение с "/"
  if (msg.text && typeof msg.text === 'string' && msg.text.startsWith('/')) {
    // Проверяем, есть ли команда в списке известных
    if (!knownCommands.includes(msg.text.split(' ')[0])) {
      bot.sendMessage(chatId, 'Неизвестная команда. Введите /help для получения списка доступных команд.\n\n' +
    'Возможно эта команда вам не доступна\n\n' +
    'Или Артик забыл добавить эту команду но это врядли...');
    }
  }
});



const TAP_COUNTS_FILE = "tap_counts.json"; // Файл для сохранения данных
let tapCounts = {}; // Хранилище для подсчёта нажатий
const startTime = Date.now(); // Время начала игры
const ADMIN_ID = 2030128216; // ID администратора

let guessNumberGame = {
  active: false,
  number: null,
  attempts: {},
};

let rpsGame = {
  choices: ["Камень", "Ножницы", "Бумага"], // Варианты для игры
};

// Загрузка данных из файла при старте
function loadTapCounts() {
  if (fs.existsSync(TAP_COUNTS_FILE)) {
    const data = fs.readFileSync(TAP_COUNTS_FILE);
    tapCounts = JSON.parse(data);
  }
}

// Сохранение данных в файл
function saveTapCounts() {
  fs.writeFileSync(TAP_COUNTS_FILE, JSON.stringify(tapCounts, null, 2));
}

// Загружаем данные при старте
loadTapCounts();

// Команда для отображения меню игр с анимациями
bot.onText(/\/game/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, `🎮 Добро пожаловать в меню игр! 🌟 Выберите игру, чтобы начать:`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔘 Тап на кнопку", callback_data: "play_tap_game" }],
        [{ text: "🎲 Угадай число", callback_data: "play_guess_game" }],
        [{ text: "✊ Камень, ножницы, бумага", callback_data: "play_rps_game" }]
      ]
    }
  });
});

// Обработчик кнопок из меню игр
bot.on("callback_query", (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;

  // Обработка выбора игры "Тап на кнопку"
  if (callbackQuery.data === "play_tap_game") {
    bot.sendMessage(chatId, `✨ Добро пожаловать в игру "Тап на кнопку"! ✨\n\n` +
      `🔘 Нажимайте на кнопку как можно больше раз, чтобы стать чемпионом!\n` +
      `🏆 Посмотрите топ-10 игроков, чтобы узнать, кто лидирует.\n\n` +
      `Игра началась! 🚀 Удачи всем!`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔘 Тапнуть!", callback_data: "tap" }],
            [{ text: "🏆 Посмотреть топ", callback_data: "show_top" }],
            [{ text: "📊 Ваша статистика", callback_data: "my_stats" }]
          ]
        }
      });
  }

  // Обработка выбора игры "Угадай число"
  if (callbackQuery.data === "play_guess_game") {
    if (!guessNumberGame.active) {
      guessNumberGame.active = true;
      guessNumberGame.number = Math.floor(Math.random() * 100) + 1; // Загаданное число
      guessNumberGame.attempts = {};

      bot.sendMessage(chatId, `🎲 Игра "Угадай число" началась! 🌟\n\n` +
        `Я загадал число от 1 до 100. Попробуйте угадать! 🎯\n` +
        `Выберите число с кнопками ниже!`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "1-10", callback_data: "guess_1-10" },
              { text: "11-20", callback_data: "guess_11-20" },
              { text: "21-30", callback_data: "guess_21-30" }
            ],
            [
              { text: "31-40", callback_data: "guess_31-40" },
              { text: "41-50", callback_data: "guess_41-50" },
              { text: "51-60", callback_data: "guess_51-60" }
            ],
            [
              { text: "61-70", callback_data: "guess_61-70" },
              { text: "71-80", callback_data: "guess_71-80" },
              { text: "81-90", callback_data: "guess_81-90" }
            ],
            [
              { text: "91-100", callback_data: "guess_91-100" }
            ]
          ]
        }
      });
    } else {
      bot.sendMessage(chatId, "🎲 Игра уже идёт! Попробуйте угадать число. 🌈");
    }
  }

  // Обработка выбора игры "Камень, ножницы, бумага"
  if (callbackQuery.data === "play_rps_game") {
    bot.sendMessage(chatId, `✊ Добро пожаловать в игру "Камень, ножницы, бумага"! 💥\n\n` +
      `Выберите один из вариантов, чтобы начать игру:`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✊ Камень", callback_data: "rps_rock" },
              { text: "✋ Бумага", callback_data: "rps_paper" },
              { text: "✌️ Ножницы", callback_data: "rps_scissors" }
            ]
          ]
        }
      });
  }

  const userId = callbackQuery.from.id;
  const username = callbackQuery.from.username || callbackQuery.from.first_name || "Аноним";

  // Обработка нажатий на кнопку "🔘 Тапнуть!"
  if (callbackQuery.data === "tap") {
    if (!tapCounts[userId]) {
      tapCounts[userId] = { username: username, count: 0 };
    }
    tapCounts[userId].count += 1;

    const emojis = ["🔥", "✨", "🚀", "💥", "🎉", "⭐", "⚡"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    saveTapCounts();

    bot.answerCallbackQuery(callbackQuery.id, {
      text: `${randomEmoji} Вы нажали ${tapCounts[userId].count} раз! 🌟`,
      show_alert: false
    });
  }

  // "Камень, ножницы, бумага" обработка выбора
  if (callbackQuery.data.startsWith("rps_")) {
    const userChoice = callbackQuery.data.split("_")[1];
    const botChoice = rpsGame.choices[Math.floor(Math.random() * rpsGame.choices.length)];

    let result;
    if (userChoice === "rock") {
      result = botChoice === "Ножницы" ? "🎉 Победа!" : botChoice === "Бумага" ? "💥 Поражение!" : "🔄 Ничья!";
    } else if (userChoice === "paper") {
      result = botChoice === "Камень" ? "🎉 Победа!" : botChoice === "Ножницы" ? "💥 Поражение!" : "🔄 Ничья!";
    } else if (userChoice === "scissors") {
      result = botChoice === "Бумага" ? "🎉 Победа!" : botChoice === "Камень" ? "💥 Поражение!" : "🔄 Ничья!";
    }

    // Отправка результата
    bot.sendMessage(chatId, `🕹 Вы выбрали: *${userChoice === "rock" ? "Камень" : userChoice === "paper" ? "Бумага" : "Ножницы"}*\n` +
      `🤖 Бот выбрал: *${botChoice}* \n\n` +
      `Результат: *${result}* ✨`, { parse_mode: "Markdown" });

    // Удаление результата через 15 секунд
    setTimeout(() => {
      bot.deleteMessage(chatId, callbackQuery.message.message_id).catch(err => {
        console.error(`Не удалось удалить сообщение: ${err.message}`);
      });
    }, 15000);
  }

  // Обработка выбора диапазона чисел для "Угадай число"
  if (callbackQuery.data.startsWith("guess_")) {
    const range = callbackQuery.data.split("_")[1];
    const [min, max] = range.split("-").map(Number);

    if (min <= guessNumberGame.number && guessNumberGame.number <= max) {
      bot.sendMessage(chatId, `🎯 Поздравляю! Загаданное число находится в этом диапазоне (${min}-${max})!`);
    } else {
      bot.sendMessage(chatId, `❌ К сожалению, загаданное число не в этом диапазоне. Попробуйте снова!`);
    }
  }

  // Обработка кнопки "🏆 Посмотреть топ"
  if (callbackQuery.data === "show_top") {
    const sortedUsers = Object.values(tapCounts).sort((a, b) => b.count - a.count);
    const topText = sortedUsers
      .slice(0, 10)
      .map((user, index) => `${index + 1}. ${user.username} — ${user.count} раз`)
      .join("\n");

    const message = topText
      ? `🏆 *Топ игроков:*\n\n${topText}`
      : "😔 Пока никто не нажал на кнопку. Начните игру первым!";

    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  }

  // Обработка кнопки "📊 Ваша статистика"
  if (callbackQuery.data === "my_stats") {
    const userStats = tapCounts[userId];
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    if (userStats) {
      bot.answerCallbackQuery(callbackQuery.id, {
        text: `📊 ${username}, вы нажали ${userStats.count} раз! 💥\n⏳ Игра длится ${totalTime} секунд. 🚀`,
        show_alert: true
      });
    } else {
      bot.answerCallbackQuery(callbackQuery.id, {
        text: "😔 У вас пока нет нажатий. Попробуйте нажать кнопку! 🎮",
        show_alert: true
      });
    }
  }
});
// Список разрешённых пользователей (username или id)
const allowedUsers = [
  { id: 6081062380, username: 'user1' },
  { id: 1923832824, username: 'user2' },
  { id: 1788399054, username: 'user3' },
  { id: 7886273686, username: 'user4' }
];

// Чтение данных из файла deliveries.json
function getDeliveries() {
  try {
    if (!fs.existsSync('deliveries.json')) {
      fs.writeFileSync('deliveries.json', '[]'); // Создать пустой JSON при необходимости
      console.log('Файл deliveries.json создан.');
    }
    const data = fs.readFileSync('deliveries.json', 'utf8');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Ошибка чтения/парсинга файла deliveries.json:', error.message);
    return [];
  }
}

// Форматирование списка заказов для отображения
function formatDeliveries(deliveries) {
  if (deliveries.length === 0) {
    return 'Список заказов пуст.';
  }

  return deliveries.map((delivery, index) => {
    return `${index + 1}. Ник: ${delivery.nickname}\n   Предметы: ${delivery.items}\n   Координаты: ${delivery.coordinates}\n   Дата: ${delivery.date}\n   ChatID: ${delivery.chatId}`;
  }).join('\n\n');
}

// Проверка, есть ли пользователь в списке разрешённых
function isUserAllowed(user) {
  return allowedUsers.some((allowedUser) => allowedUser.id === user.id || allowedUser.username === user.username);
}

// Команда /deliveries
bot.onText(/\/deliveries/, (msg) => {
  const user = msg.from;
  console.log('Проверяем пользователя:', user);

  if (!isUserAllowed(user)) {
    bot.sendMessage(msg.chat.id, 'У вас нет доступа к этой команде.');
    return;
  }

  const deliveries = getDeliveries();
  const response = formatDeliveries(deliveries);
  bot.sendMessage(msg.chat.id, response);
});

// Логирование получения любого сообщения
bot.on('message', (msg) => {
  console.log(`Получено сообщение от пользователя: ${msg.from.username || 'без username'} (id: ${msg.from.id})`);
});

// Запуск бота
console.log('Бот запущен');
bot.onText(/\/list/, (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from.id);

  if (!users[userId] || (users[userId].role !== 'worker' && users[userId].role !== 'admin')) {
    bot.sendMessage(chatId, '❌ Эта команда доступна только работникам налоговой.');
    return;
  }

  const userList = Object.entries(users).map(([id, userData]) => {
    const username = userData.username || "Неизвестный";
    const balance = isNaN(userData.balance) ? 0 : userData.balance;
    const role = userData.role || "user";
    return `- ${username} (ID: \`${id}\`, Баланс: ${balance}, Роль: ${role})`;
  });

  if (userList.length === 0) {
    bot.sendMessage(chatId, "📋 **Список пользователей пуст**.", { parse_mode: 'Markdown' });
    return;
  }

  // Функция отправки сообщений частями (если список большой)
  function sendChunks(chatId, messages, chunkSize = 4000) {
    let chunk = "";
    for (const msg of messages) {
      if (chunk.length + msg.length > chunkSize) {
        bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
        chunk = "";
      }
      chunk += msg + "\n";
    }
    if (chunk.length > 0) {
      bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
    }
  }

  // Отправляем список по частям
  sendChunks(chatId, userList);
});
