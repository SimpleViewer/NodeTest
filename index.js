const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
//токен бота
const token = 'BOT_TOKEN';
// Создаем бота
const bot = new TelegramBot(token, { polling: true });


// Настройка клавиатуры
const options = {
  reply_markup: {
    keyboard: [['Добавить подписку', 'Удалить подписку'], ['Показать все подписки']],
    resize_keyboard: true,
    one_time_keyboard: false,
  },
};

let subscriptions = [];

if (fs.existsSync('subscriptions.json')) {
  const data = fs.readFileSync('subscriptions.json');
  subscriptions = JSON.parse(data);
} else {
  fs.writeFileSync('subscriptions.json', JSON.stringify(subscriptions));
}

function addSubscription(chatId, subscription) {
  const index = subscriptions.findIndex((item) => item.chatId === chatId && item.subscription === subscription);

  if (index === -1) {
    subscriptions.push({ chatId, subscription });
    fs.writeFileSync('subscriptions.json', JSON.stringify(subscriptions));
    return true;
  }

  return false;
}

function removeSubscription(chatId, subscription) {
  const index = subscriptions.findIndex((item) => item.chatId === chatId && item.subscription === subscription);

  if (index !== -1) {
    subscriptions.splice(index, 1);
    fs.writeFileSync('subscriptions.json', JSON.stringify(subscriptions));
    return true;
  }

  return false;
}

function showSubscriptions(chatId) {
  const userSubscriptions = subscriptions.filter((item) => item.chatId === chatId);

  let message = '';

  if (userSubscriptions.length === 0) {
    message = 'У вас нет ни одной подписки';
  } else {
    message = 'Ваши подписки:\n\n';

    for (const subscription of userSubscriptions) {
      message += `${subscription.subscription}\n`;
    }
  }

  bot.sendMessage(chatId, message);
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Добро пожаловать в бота менеджера истечения подписок! Выберите одну из опций, используя клавиатуру:', options);
});

bot.onText(/Добавить подписку/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Введите название подписки, которую вы хотите добавить:');

  bot.on('message', (msg) => {
    const subscription = msg.text.trim();

    if (addSubscription(chatId, subscription)) {
      bot.sendMessage(chatId, `Подписка "${subscription}" успешно добавлена`);
    } else {
      bot.sendMessage(chatId, `Подписка "${subscription}" уже существует`);
    }

    bot.removeListener('message', this);
  });
});

bot.onText(/Удалить подписку/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Введите название подписки, которую вы хотите удалить:');

  bot.on('message', (msg) => {
    const subscription = msg.text.trim();

    if (removeSubscription(chatId, subscription)) {
      bot.sendMessage(chatId, `Подписка "${subscription}" успешно удалена`);
    } else {
      bot.sendMessage(chatId, `Подписка "${subscription}" не найдена`);
    }

    bot.removeListener('message', this);
  });
});

bot.onText(/Показать все подписки/, (msg) => {
  const chatId = msg.chat.id;

  showSubscriptions(chatId);
});