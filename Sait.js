const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Жестко прописываем ID чата и токен бота
const ADMIN_CHAT_ID = "-1002478553864";  
const BOT_TOKEN = "7568338469:AAHJr1MJygPv3SSW4HXj0yeZUStAbje1KGM";  

// API для отправки заявки
app.post("/api/delivery", (req, res) => {
    const { userId, nickname, items, coordinates } = req.body;

    if (!userId || !nickname || !items || !coordinates) {
        return res.status(400).json({ message: "Ошибка: заполните все поля" });
    }

    // Отправляем уведомление админу в Telegram
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: ADMIN_CHAT_ID,
            text: `📦 *Новая заявка на доставку*\n\n` +
                  `👤 Никнейм: ${nickname}\n` +
                  `📦 Товары: ${items}\n` +
                  `📍 Координаты: ${coordinates}\n\n` +
                  `🕒 Статус: Ожидание`,
            parse_mode: "Markdown"
        }),
    });

    res.json({ message: "✅ Заявка отправлена!" });
});

// Запускаем сервер
app.listen(3000, "0.0.0.0", () => console.log("Сервер запущен на порту 3000"));
