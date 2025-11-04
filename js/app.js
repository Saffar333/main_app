// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Инициализация Supabase
const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// Глобальные переменные
let currentUser = null;
let telegramId = null;
let characters = [];
let activeTab = 'public';

// Элементы DOM
const elements = {
    pageTitle: document.getElementById('pageTitle'),
    createBtn: document.getElementById('createBtn'),
    charactersPage: document.getElementById('charactersPage'),
    profilePage: document.getElementById('profilePage'),
    charactersGrid: document.getElementById('charactersGrid'),
    profileContent: document.getElementById('profileContent'),
    navItems: document.querySelectorAll('.nav-item'),
    tabs: document.querySelectorAll('.tab')
};

// ======================
// НАВИГАЦИЯ
// ======================

// Переключение страниц
elements.navItems.forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        switchPage(page);
    });
});

function switchPage(page) {
    // Обновляем активные кнопки навигации
    elements.navItems.forEach(item => {
        if (item.dataset.page === page) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Показываем нужную страницу
    if (page === 'characters') {
        elements.charactersPage.classList.add('active');
        elements.profilePage.classList.remove('active');
        elements.pageTitle.textContent = 'Персонажи';
        elements.createBtn.style.display = 'flex';
        loadCharacters();
    } else if (page === 'profile') {
        elements.charactersPage.classList.remove('active');
        elements.profilePage.classList.add('active');
        elements.pageTitle.textContent = 'Профиль';
        elements.createBtn.style.display = 'none';
        loadProfile();
    }
}

// ======================
// ПЕРСОНАЖИ
// ======================

// Переключение табов
elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        elements.tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.dataset.tab;
        renderCharacters();
    });
});

// Кнопка создания персонажа
elements.createBtn.addEventListener('click', () => {
    window.location.href = 'create.html';
});

// Загрузка персонажей
async function loadCharacters() {
    console.log('🔄 Начинаю загрузку персонажей из Supabase...');
    console.log('📡 Supabase URL:', CONFIG.SUPABASE_URL);

    showLoader(elements.charactersGrid);

    try {
        console.log('📤 Отправляю запрос к таблице characters...');
        console.log('🔍 Фильтры: is_active = true');

        // Загружаем ВСЕ персонажи
        const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        console.log('📥 Получен ответ от Supabase');

        if (error) {
            console.error('❌ Supabase вернул ошибку:', error);
            throw error;
        }

        console.log('✅ Данные успешно получены');
        console.log('📊 Количество персонажей:', data ? data.length : 0);
        console.log('📋 Данные персонажей:', data);

        characters = data || [];

        if (characters.length > 0) {
            console.log('👥 Список персонажей:');
            characters.forEach((char, index) => {
                console.log(`  ${index + 1}. ${char.name} (ID: ${char.id}, is_preset: ${char.is_preset})`);
            });
        } else {
            console.warn('⚠️ Персонажи не найдены в базе данных');
        }

        console.log('🎨 Начинаю отрисовку персонажей...');
        renderCharacters();
        console.log('✅ Персонажи успешно отрисованы');

    } catch (error) {
        console.error('❌ Критическая ошибка при загрузке персонажей:');
        console.error('📛 Тип ошибки:', error.name);
        console.error('💬 Сообщение:', error.message);
        console.error('📜 Полная ошибка:', error);

        elements.charactersGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Ошибка загрузки: ${error.message}</div>
            </div>
        `;
    }
}

// Отображение персонажей
function renderCharacters() {
    // Фильтруем персонажей
    let filteredCharacters = [];

    if (activeTab === 'public') {
        // Публичные персонажи (is_preset = true)
        filteredCharacters = characters.filter(c => c.is_preset === true);
    } else {
        // Личные персонажи (is_preset = false И creator_id = текущий пользователь)
        filteredCharacters = characters.filter(c =>
            c.is_preset === false && c.creator_id === currentUser?.id
        );
    }

    console.log(`📊 Отображаем ${activeTab} персонажей:`, filteredCharacters.length);

    if (filteredCharacters.length === 0) {
        const message = activeTab === 'public'
            ? 'Публичные персонажи не найдены'
            : 'У вас пока нет личных персонажей';
        elements.charactersGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">${message}</div>
            </div>
        `;
        return;
    }

    elements.charactersGrid.innerHTML = filteredCharacters
        .map(char => createCharacterCard(char))
        .join('');
}

// Создание карточки персонажа
function createCharacterCard(character) {
    const imageContent = character.avatar_url
        ? `<img src="${character.avatar_url}" alt="${character.name}">`
        : `<div style="font-size: 48px;">${character.name.charAt(0)}</div>`;

    const shortDescription = character.description.length > 80
        ? character.description.substring(0, 80) + '...'
        : character.description;

    return `
        <div class="card" onclick="selectCharacter(${character.id})">
            <div class="card-image">${imageContent}</div>
            <div class="card-content">
                <div class="card-title">${character.name}</div>
                <div class="card-description">${shortDescription}</div>
            </div>
        </div>
    `;
}

// Выбор персонажа
function selectCharacter(id) {
    const character = characters.find(c => c.id === id);
    if (!character) return;

    console.log('✅ Персонаж выбран:', character.name);
    console.log('📤 Отправка данных в бот...');

    // Получаем telegram_id пользователя
    const telegramUser = tg.initDataUnsafe?.user;
    const currentTelegramId = telegramUser?.id || null;

    console.log('👤 Telegram User ID:', currentTelegramId);

    const data = {
        action: 'select_character',
        character_id: character.id,
        character_name: character.name,
        character_description: character.description,
        character_avatar: character.avatar_url,
        telegram_id: currentTelegramId,
        username: telegramUser?.username || null,
        first_name: telegramUser?.first_name || null
    };

    // Отправляем данные в бота
    tg.sendData(JSON.stringify(data));

    console.log('✅ Данные отправлены:', data);
}

// ======================
// ПРОФИЛЬ
// ======================

// Загрузка профиля
async function loadProfile() {
    console.log('👤 Загрузка профиля...');

    showLoader(elements.profileContent);

    if (!telegramId) {
        elements.profileContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Данные пользователя недоступны</div>
            </div>
        `;
        return;
    }

    try {
        // Получаем данные пользователя из Supabase
        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', telegramId)
            .maybeSingle();

        if (error) throw error;

        // Если пользователь не найден в БД, используем данные из Telegram
        const user = userData || {
            telegram_id: telegramId,
            username: tg.initDataUnsafe?.user?.username || '',
            first_name: tg.initDataUnsafe?.user?.first_name || '',
            total_message_count: 0,
            daily_message_count: 0
        };

        currentUser = userData;

        renderProfile(user);
    } catch (error) {
        console.error('❌ Ошибка загрузки профиля:', error);
        elements.profileContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Ошибка загрузки профиля</div>
            </div>
        `;
    }
}

// Отображение профиля
function renderProfile(user) {
    const telegramUser = tg.initDataUnsafe?.user;

    // Формируем аватар
    const firstInitial = (user.first_name || telegramUser?.first_name || '?').charAt(0).toUpperCase();
    const avatarContent = telegramUser?.photo_url
        ? `<img src="${telegramUser.photo_url}" alt="Avatar">`
        : firstInitial;

    // Имя пользователя
    const displayName = user.first_name || telegramUser?.first_name || 'Пользователь';
    const username = user.username || telegramUser?.username;

    // Данные статистики
    const totalMessages = user.total_message_count || 0;
    const dailyMessages = user.daily_message_count || 0;

    elements.profileContent.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">${avatarContent}</div>
            <div class="profile-name">${displayName}</div>
            ${username ? `<div class="profile-username">@${username}</div>` : ''}
        </div>

        <div class="profile-stats">
            <div class="stat-card">
                <div class="stat-value">${totalMessages}</div>
                <div class="stat-label">Всего сообщений</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${dailyMessages}</div>
                <div class="stat-label">Сообщений сегодня</div>
            </div>
        </div>

        <div class="info-list">
            <div class="info-item">
                <div class="info-label">Telegram ID</div>
                <div class="info-value">${user.telegram_id}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Username</div>
                <div class="info-value">${username ? '@' + username : 'Не указан'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Язык</div>
                <div class="info-value">${(telegramUser?.language_code || 'ru').toUpperCase()}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Premium</div>
                <div class="info-value">${telegramUser?.is_premium ? '⭐ Да' : 'Нет'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Платформа</div>
                <div class="info-value">${tg.platform || 'Неизвестно'}</div>
            </div>
        </div>
    `;

    console.log('✅ Профиль отображен');
}

// ======================
// УТИЛИТЫ
// ======================

function showLoader(container) {
    container.innerHTML = `
        <div class="loader">
            <div class="spinner"></div>
            <div class="loader-text">Загрузка...</div>
        </div>
    `;
}

// ======================
// ИНИЦИАЛИЗАЦИЯ
// ======================

async function init() {
    console.log('🚀 Инициализация приложения...');
    console.log('👤 Telegram User:', tg.initDataUnsafe?.user);
    console.log('📱 Версия Web App:', tg.version);
    console.log('🎨 Тема:', tg.colorScheme);

    // Получаем данные пользователя из Telegram
    const user = tg.initDataUnsafe?.user;

    if (user && user.id) {
        telegramId = user.id;
        console.log('👤 Telegram ID:', telegramId);
        console.log('👤 Username:', user.username);
        console.log('👤 First Name:', user.first_name);
    } else {
        console.warn('⚠️ Данные пользователя недоступны');
    }

    // Загружаем персонажей на старте
    await loadCharacters();

    // Подписываемся на изменения в реальном времени
    console.log('🔔 Подключаю реал-тайм обновления...');
    supabase
        .channel('characters_changes')
        .on('postgres_changes', {
            event: '*',  // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'characters'
        }, (payload) => {
            console.log('🔔 Изменение в БД:', payload);
            // Перезагружаем персонажей при любом изменении
            loadCharacters();
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Подписка на реал-тайм обновления активна');
            }
        });

    // Сигнализируем Telegram, что приложение готово
    tg.ready();
    console.log('✅ Приложение готово (ready() вызван)');
}

// Запускаем приложение
console.log('▶️ Запуск приложения...');
init();
