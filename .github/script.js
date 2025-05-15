document.addEventListener('DOMContentLoaded', function() {
  // Global state
  const appState = {
    accounts: {},
    proxies: {},
    chats: {},
    schedules: {},
    currentEditId: null,
    testMode: {
      active: false,
      interval: null,
      count: 0,
      chatId: null
    }
  };

  // Функция для форматирования ID чата
  function formatChatId(chatId) {
    // Если это строка, начинающаяся с @, оставляем как есть
    if (typeof chatId === 'string' && chatId.startsWith('@')) {
      return chatId;
    }
    
    // Если это число или строка с цифрами
    if (typeof chatId === 'number' || (typeof chatId === 'string' && /^\d+$/.test(chatId))) {
      // Преобразуем в строку с префиксом -100
      return `-100${chatId.toString().replace(/^-100/, '')}`;
    }
    
    // Если уже в формате -100..., оставляем как есть
    if (typeof chatId === 'string' && chatId.startsWith('-100')) {
      return chatId;
    }
    
    // Если в формате -..., но не -100..., добавляем 100 после минуса
    if (typeof chatId === 'string' && chatId.startsWith('-') && !chatId.startsWith('-100')) {
      return `-100${chatId.substring(1)}`;
    }
    
    // В остальных случаях возвращаем как есть
    return chatId;
  }

  // Загрузка данных из localStorage
  function loadFromLocalStorage() {
    try {
      const savedState = localStorage.getItem('telegramManagerState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Обновляем состояние приложения
        if (parsedState.accounts) appState.accounts = parsedState.accounts;
        if (parsedState.proxies) appState.proxies = parsedState.proxies;
        if (parsedState.chats) appState.chats = parsedState.chats;
        if (parsedState.schedules) appState.schedules = parsedState.schedules;
        
        logger.info("Данные успешно загружены из localStorage");
      }
    } catch (e) {
      console.error("Ошибка загрузки данных из localStorage:", e);
    }
  }

  // Сохранение данных в localStorage
  function saveToLocalStorage() {
    try {
      const stateToSave = {
        accounts: appState.accounts,
        proxies: appState.proxies,
        chats: appState.chats,
        schedules: appState.schedules
      };
      
      localStorage.setItem('telegramManagerState', JSON.stringify(stateToSave));
      logger.info("Данные успешно сохранены в localStorage");
    } catch (e) {
      console.error("Ошибка сохранения данных в localStorage:", e);
    }
  }

  // Простой логгер
  const logger = {
    info: function(message) {
      console.log(`[INFO] ${message}`);
    },
    error: function(message) {
      console.error(`[ERROR] ${message}`);
    },
    warning: function(message) {
      console.warn(`[WARNING] ${message}`);
    }
  };

  // DOM Elements
  const navItems = document.querySelectorAll('.nav-item');
  const contentSections = document.querySelectorAll('.content-section');
  
  // Account/Proxy Tabs
  const accountProxyTabs = document.querySelectorAll('.account-proxy-tab');
  const accountProxyContents = document.querySelectorAll('.account-proxy-content');
  
  // Add buttons
  const addAccountBtn = document.getElementById('addAccount');
  const addChatBtn = document.getElementById('addChat');
  const addProxyBtn = document.getElementById('addProxy');
  const addScheduleBtn = document.getElementById('addScheduleGroup');
  
  // Modals
  const accountModal = document.getElementById('accountModal');
  const chatModal = document.getElementById('chatModal');
  const proxyModal = document.getElementById('proxyModal');
  
  // Close buttons
  const closeButtons = document.querySelectorAll('.close');
  
  // Save/Cancel buttons
  const saveAccountBtn = document.getElementById('saveAccount');
  const cancelAccountBtn = document.getElementById('cancelAccount');
  const saveChatBtn = document.getElementById('saveChat');
  const cancelChatBtn = document.getElementById('cancelChat');
  const saveProxyBtn = document.getElementById('saveProxy');
  const cancelProxyBtn = document.getElementById('cancelProxy');
  
  // Config buttons
  const saveConfigBtn = document.getElementById('saveConfig');
  const loadConfigBtn = document.getElementById('loadConfig');
  
  // Lists
  const accountsList = document.getElementById('accountsList');
  const proxyList = document.getElementById('proxyList');
  const chatList = document.getElementById('chatList');
  const scheduleList = document.getElementById('scheduleList');

  // Test Mode Elements
  const enableTestMode = document.getElementById('enableTestMode');
  const testModeOptions = document.getElementById('testModeOptions');
  const testInterval = document.getElementById('testInterval');
  const startTestBtn = document.getElementById('startTestBtn');
  const stopTestBtn = document.getElementById('stopTestBtn');
  const testStatus = document.getElementById('testStatus');

  // Загружаем данные из localStorage при запуске
  loadFromLocalStorage();

  // Navigation
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(nav => nav.classList.remove('active'));
      contentSections.forEach(section => section.classList.remove('active'));
      
      item.classList.add('active');
      document.getElementById(item.dataset.section).classList.add('active');
    });
  });
  
  // Account/Proxy Tabs
  accountProxyTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      accountProxyTabs.forEach(t => t.classList.remove('active'));
      accountProxyContents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // Open modals
  addAccountBtn.addEventListener('click', () => {
    resetAccountForm();
    accountModal.style.display = 'block';
  });
  
  addChatBtn.addEventListener('click', () => {
    resetChatForm();
    populateAccountSelect();
    chatModal.style.display = 'block';
  });
  
  addProxyBtn.addEventListener('click', () => {
    resetProxyForm();
    proxyModal.style.display = 'block';
  });
  
  addScheduleBtn.addEventListener('click', () => {
    showNotification('Schedule feature will be implemented soon!', 'info');
  });

  // Close modals only when clicking the X button
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      if (modal) {
        stopTestMode();
        modal.style.display = 'none';
      }
    });
  });

  // Prevent modal closing when clicking on the modal background
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        // Не закрываем модальное окно при клике на фон
        event.stopPropagation();
      }
    });
  });

  // Cancel buttons
  cancelAccountBtn.addEventListener('click', () => {
    accountModal.style.display = 'none';
  });
  
  cancelChatBtn.addEventListener('click', () => {
    stopTestMode();
    chatModal.style.display = 'none';
  });
  
  cancelProxyBtn.addEventListener('click', () => {
    proxyModal.style.display = 'none';
  });

  // Photo checkbox toggle
  const sendPhotoCheck = document.getElementById('sendPhotoCheck');
  const photoUrlField = document.getElementById('photoUrlField');
  
  if (sendPhotoCheck && photoUrlField) {
    sendPhotoCheck.addEventListener('change', () => {
      if (sendPhotoCheck.checked) {
        photoUrlField.classList.add('visible');
      } else {
        photoUrlField.classList.remove('visible');
      }
    });
  }

  // Test Mode toggle
  if (enableTestMode && testModeOptions) {
    enableTestMode.addEventListener('change', () => {
      if (enableTestMode.checked) {
        testModeOptions.style.display = 'block';
      } else {
        testModeOptions.style.display = 'none';
        stopTestMode();
      }
    });
  }

  // Start Test button
  if (startTestBtn) {
    startTestBtn.addEventListener('click', () => {
      startTestMode();
    });
  }

  // Stop Test button
  if (stopTestBtn) {
    stopTestBtn.addEventListener('click', () => {
      stopTestMode();
    });
  }

  // Proxy toggle
  const useProxyCheck = document.getElementById('useProxyCheck');
  const proxyToggleContent = document.querySelector('.proxy-toggle-content');
  const proxyToggleHeader = document.querySelector('.proxy-toggle-header');
  
  if (useProxyCheck && proxyToggleContent && proxyToggleHeader) {
    useProxyCheck.addEventListener('change', () => {
      toggleProxySelection();
    });
    
    proxyToggleHeader.addEventListener('click', (e) => {
      if (e.target !== useProxyCheck) {
        useProxyCheck.checked = !useProxyCheck.checked;
        toggleProxySelection();
      }
    });
  }

  function toggleProxySelection() {
    if (useProxyCheck.checked) {
      proxyToggleContent.classList.add('expanded');
      proxyToggleHeader.classList.add('expanded');
      populateProxySelect();
    } else {
      proxyToggleContent.classList.remove('expanded');
      proxyToggleHeader.classList.remove('expanded');
    }
  }

  // Add time functionality
  const addChatTime = document.getElementById('addChatTime');
  const chatTimeSelector = document.getElementById('chatTimeSelector');
  
  if (addChatTime && chatTimeSelector) {
    addChatTime.addEventListener('click', () => {
      addTimeItem(chatTimeSelector, addChatTime);
    });
    
    // Add event listeners to existing delete buttons
    document.querySelectorAll('.delete-time').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.closest('.time-item').remove();
      });
    });
  }

  function addTimeItem(container, beforeElement) {
    const timeItem = document.createElement('div');
    timeItem.className = 'time-item';
    timeItem.innerHTML = `
      <input type="number" min="0" max="23" value="9" class="time-hour"> :
      <input type="number" min="0" max="59" value="0" class="time-minute">
      <button class="action-btn delete-time"><i class="fas fa-times"></i></button>
    `;
    
    container.insertBefore(timeItem, beforeElement);
    
    // Add event listener to delete button
    timeItem.querySelector('.delete-time').addEventListener('click', () => {
      timeItem.remove();
    });
  }

  // Link dialog functionality
  const linkDialog = document.getElementById('linkDialog');
  const linkText = document.getElementById('linkText');
  const linkUrl = document.getElementById('linkUrl');
  const insertLinkBtn = document.getElementById('insertLink');
  const cancelLinkBtn = document.getElementById('cancelLink');
  const messageContent = document.getElementById('messageContent');
  
  document.querySelector('.toolbar-btn[data-format="link"]')?.addEventListener('click', () => {
    const selection = getSelectionFromTextarea(messageContent);
    linkText.value = selection;
    linkUrl.value = '';
    
    const rect = document.querySelector('.toolbar-btn[data-format="link"]').getBoundingClientRect();
    linkDialog.style.display = 'block';
    linkDialog.style.top = `${rect.bottom + 5}px`;
    linkDialog.style.left = `${rect.left}px`;
  });
  
  cancelLinkBtn.addEventListener('click', () => {
    linkDialog.style.display = 'none';
  });
  
  insertLinkBtn.addEventListener('click', () => {
    if (linkUrl.value) {
      const linkMarkdown = `[${linkText.value || linkUrl.value}](${linkUrl.value})`;
      insertTextAtCursor(messageContent, linkMarkdown);
      linkDialog.style.display = 'none';
    } else {
      showNotification('Please enter a URL', 'error');
    }
  });

  // Emoji picker functionality
  const emojiPicker = document.getElementById('emojiPicker');
  const emojiContainer = document.getElementById('emojiContainer');
  const emojiCategoryBtns = document.querySelectorAll('.emoji-categories button');
  
  // Полный набор эмодзи для каждой категории
  const emojis = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔'],
    food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊'],
    travel: ['✈️', '🛫', '🛬', '🛩', '💺', '🛰', '🚀', '🛸', '🚁', '🛶', '⛵️', '🚤', '🛥', '🛳', '⛴', '🚢', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩', '💺', '🛰', '🚀', '🛸', '🚁', '🛶', '⛵️', '🚤', '🛥', '🛳', '⛴', '🚢', '⚓️', '⛽️', '🚧', '🚦', '🚥', '🚏', '🗺', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟', '🎡', '🎢', '🎠', '⛲️', '⛱', '🏖', '🏝', '🏜', '🌋', '⛰', '🏔', '🗻', '🏕', '⛺️', '🏠', '🏡', '🏘', '🏚', '🏗', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛', '⛪️', '🕌', '🕍', '🛕', '🕋', '⛩', '🛤', '🛣', '🗾', '🎑', '🏞', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙', '🌃', '🌌', '🌉', '🌁'],
    symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈️', '♉️', '♊️', '♋️', '♌️', '♍️', '♎️', '♏️', '♐️', '♑️', '♒️', '♓️', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚️', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕️', '🛑', '⛔️', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯️', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿️', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸', '⏯', '⏹', '⏺', '⏭', '⏮', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾️', '◽️', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛️', '⬜️', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '👁‍🗨', '💬', '💭', '🗯', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄️', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧']
  };
  
  // Load emojis for a category
  function loadEmojis(category) {
    if (emojiContainer) {
      emojiContainer.innerHTML = '';
      emojis[category].forEach(emoji => {
        const emojiElement = document.createElement('div');
        emojiElement.className = 'emoji';
        emojiElement.textContent = emoji;
        emojiElement.addEventListener('click', () => {
          insertTextAtCursor(messageContent, emoji);
          emojiPicker.style.display = 'none';
        });
        emojiContainer.appendChild(emojiElement);
      });
    }
  }
  
  // Emoji category buttons
  emojiCategoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      emojiCategoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadEmojis(btn.dataset.category);
    });
  });
  
  // Show emoji picker when emoji button is clicked
  document.querySelector('.toolbar-btn[data-format="emoji"]')?.addEventListener('click', () => {
    const rect = document.querySelector('.toolbar-btn[data-format="emoji"]').getBoundingClientRect();
    emojiPicker.style.display = 'block';
    emojiPicker.style.top = `${rect.bottom + 5}px`;
    emojiPicker.style.left = `${rect.left}px`;
    loadEmojis('smileys');
  });
  
  // Close emoji picker when clicking outside
  document.addEventListener('click', (e) => {
    if (emojiPicker && emojiPicker.style.display === 'block') {
      if (!emojiPicker.contains(e.target) && !e.target.closest('.toolbar-btn[data-format="emoji"]')) {
        emojiPicker.style.display = 'none';
      }
    }
    
    if (linkDialog && linkDialog.style.display === 'block') {
      if (!linkDialog.contains(e.target) && !e.target.closest('.toolbar-btn[data-format="link"]')) {
        linkDialog.style.display = 'none';
      }
    }
  });
  
  // Text formatting buttons
  document.querySelector('.toolbar-btn[data-format="bold"]')?.addEventListener('click', () => {
    wrapSelectedText(messageContent, '**', '**');
  });
  
  document.querySelector('.toolbar-btn[data-format="italic"]')?.addEventListener('click', () => {
    wrapSelectedText(messageContent, '_', '_');
  });

  // Save account
  saveAccountBtn.addEventListener('click', () => {
    const accountName = document.getElementById('accountName').value.trim();
    const apiId = document.getElementById('apiId').value.trim();
    const apiHash = document.getElementById('apiHash').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const sessionFile = document.getElementById('sessionFile').value.trim();
    
    if (!accountName || !apiId || !apiHash || !phoneNumber) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    let proxyName = null;
    if (useProxyCheck.checked) {
      proxyName = document.getElementById('proxySelect').value;
      if (!proxyName) {
        showNotification('Please select a proxy or uncheck the proxy option', 'error');
        return;
      }
    }
    
    const accountData = {
      id: appState.currentEditId || generateId(),
      name: accountName,
      apiId: apiId,
      apiHash: apiHash,
      phoneNumber: phoneNumber,
      sessionFile: sessionFile || `${accountName.toLowerCase().replace(/\s+/g, '_')}.session`,
      proxy: proxyName
    };
    
    appState.accounts[accountData.id] = accountData;
    renderAccounts();
    accountModal.style.display = 'none';
    showNotification('Account saved successfully!', 'success');
    appState.currentEditId = null;
    
    // Сохраняем данные в localStorage
    saveToLocalStorage();
  });

  // Save proxy
  saveProxyBtn.addEventListener('click', () => {
    const proxyName = document.getElementById('proxyName').value.trim();
    const proxyType = document.getElementById('proxyType').value;
    const proxyHost = document.getElementById('proxyHost').value.trim();
    const proxyPort = document.getElementById('proxyPort').value.trim();
    const proxyUsername = document.getElementById('proxyUsername').value.trim();
    const proxyPassword = document.getElementById('proxyPassword').value.trim();
    
    if (!proxyName || !proxyHost || !proxyPort) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    const proxyData = {
      id: appState.currentEditId || generateId(),
      name: proxyName,
      type: proxyType,
      host: proxyHost,
      port: proxyPort,
      username: proxyUsername,
      password: proxyPassword
    };
    
    appState.proxies[proxyData.id] = proxyData;
    renderProxies();
    proxyModal.style.display = 'none';
    showNotification('Proxy saved successfully!', 'success');
    appState.currentEditId = null;
    
    // Сохраняем данные в localStorage
    saveToLocalStorage();
  });

  // Save chat
  saveChatBtn.addEventListener('click', () => {
    const chatName = document.getElementById('chatName').value.trim();
    const chatIdInput = document.getElementById('chatId').value.trim();
    const messageContent = document.getElementById('messageContent').value.trim();
    const sendPhoto = document.getElementById('sendPhotoCheck').checked;
    const photoUrl = document.getElementById('photoUrl').value.trim();
    const accountId = document.getElementById('chatAccountSelect').value;
    
    if (!chatName || !chatIdInput || !messageContent || !accountId) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    // Форматируем ID чата
    const chatId = formatChatId(chatIdInput);
    
    // Get posting times
    const times = [];
    document.querySelectorAll('.time-item').forEach(item => {
      const hour = parseInt(item.querySelector('.time-hour').value);
      const minute = parseInt(item.querySelector('.time-minute').value);
      times.push({ hour, minute });
    });
    
    if (times.length === 0) {
      showNotification('Please add at least one posting time', 'error');
      return;
    }
    
    const chatData = {
      id: appState.currentEditId || generateId(),
      name: chatName,
      chatId: chatId, // Используем отформатированный ID
      message: messageContent,
      sendPhoto: sendPhoto,
      photoUrl: sendPhoto ? photoUrl : '',
      accountId: accountId,
      times: times
    };
    
    appState.chats[chatData.id] = chatData;
    renderChats();
    chatModal.style.display = 'none';
    showNotification('Chat saved successfully!', 'success');
    appState.currentEditId = null;
    stopTestMode();
    
    // Сохраняем данные в localStorage
    saveToLocalStorage();
  });

  // Save/Load Config
  saveConfigBtn.addEventListener('click', () => {
    const config = JSON.stringify(appState, null, 2);
    copyToClipboard(config);
    showNotification('Конфигурация скопирована в буфер обмена!', 'success');
  });
  
  loadConfigBtn.addEventListener('click', () => {
    const loadFromClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();
        try {
          const config = JSON.parse(text);
          if (config.accounts || config.proxies || config.chats) {
            Object.assign(appState, config);
            renderAll();
            showNotification('Конфигурация успешно загружена!', 'success');
            
            // Сохраняем данные в localStorage
            saveToLocalStorage();
          } else {
            showNotification('Неверный формат конфигурации', 'error');
          }
        } catch (e) {
          showNotification('Неверный формат JSON', 'error');
        }
      } catch (e) {
        showNotification('Не удалось получить доступ к буферу обмена', 'error');
      }
    };
    
    loadFromClipboard();
  });

  // Test Mode Functions
  function startTestMode() {
    if (appState.testMode.active) return;
    
    const chatName = document.getElementById('chatName').value.trim();
    const chatIdInput = document.getElementById('chatId').value.trim();
    const messageContent = document.getElementById('messageContent').value.trim();
    const sendPhoto = document.getElementById('sendPhotoCheck').checked;
    const photoUrl = document.getElementById('photoUrl').value.trim();
    const accountId = document.getElementById('chatAccountSelect').value;
    const intervalSeconds = parseInt(testInterval.value) || 5;
    
    if (!chatIdInput || !messageContent || !accountId) {
      showNotification('Please fill in chat ID, message and select an account for testing', 'error');
      return;
    }
    
    // Форматируем ID чата
    const chatId = formatChatId(chatIdInput);
    
    appState.testMode.active = true;
    appState.testMode.count = 0;
    appState.testMode.chatId = chatId; // Используем отформатированный ID
    appState.testMode.message = messageContent;
    appState.testMode.accountId = accountId;
    appState.testMode.sendPhoto = sendPhoto;
    appState.testMode.photoUrl = sendPhoto ? photoUrl : null;
    
    startTestBtn.style.display = 'none';
    stopTestBtn.style.display = 'inline-block';
    testStatus.textContent = 'Test mode active. Sending messages...';
    
    // Send first test message immediately
    sendTestMessage(chatId, messageContent, sendPhoto ? photoUrl : null, accountId, chatName);
    
    // Set interval for subsequent messages
    appState.testMode.interval = setInterval(() => {
      sendTestMessage(chatId, messageContent, sendPhoto ? photoUrl : null, accountId, chatName);
    }, intervalSeconds * 1000);
  }
  
  function stopTestMode() {
    if (!appState.testMode.active) return;
    
    clearInterval(appState.testMode.interval);
    appState.testMode.active = false;
    appState.testMode.interval = null;
    
    if (startTestBtn && stopTestBtn && testStatus) {
      startTestBtn.style.display = 'inline-block';
      stopTestBtn.style.display = 'none';
      testStatus.textContent = `Test stopped. Sent ${appState.testMode.count} test messages.`;
    }
  }
  
  function sendTestMessage(chatId, message, photoUrl, accountId, chatName) {
    // In a real implementation, this would send an actual message
    // For this demo, we'll just log it and update the counter
    appState.testMode.count++;
    console.log(`Test message #${appState.testMode.count} to ${chatId}:`, message);
    
    const photoStatus = photoUrl ? 'with photo' : 'without photo';
    testStatus.textContent = `Sent ${appState.testMode.count} test messages to ${chatName} (${photoStatus})`;
    
    showNotification(`Test message #${appState.testMode.count} sent to ${chatName}`, 'success');
  }

  // Helper Functions
  function resetAccountForm() {
    document.getElementById('accountName').value = '';
    document.getElementById('apiId').value = '';
    document.getElementById('apiHash').value = '';
    document.getElementById('phoneNumber').value = '';
    document.getElementById('sessionFile').value = '';
    document.getElementById('useProxyCheck').checked = false;
    document.querySelector('.proxy-toggle-content').classList.remove('expanded');
    document.querySelector('.proxy-toggle-header').classList.remove('expanded');
    appState.currentEditId = null;
  }
  
  function resetProxyForm() {
    document.getElementById('proxyName').value = '';
    document.getElementById('proxyType').value = 'socks5';
    document.getElementById('proxyHost').value = '';
    document.getElementById('proxyPort').value = '';
    document.getElementById('proxyUsername').value = '';
    document.getElementById('proxyPassword').value = '';
    appState.currentEditId = null;
  }
  
  function resetChatForm() {
    document.getElementById('chatName').value = '';
    document.getElementById('chatId').value = '';
    document.getElementById('messageContent').value = '';
    document.getElementById('sendPhotoCheck').checked = true;
    document.getElementById('photoUrl').value = 'https://i.imgur.com/xiLQhFF.png';
    document.getElementById('photoUrlField').classList.add('visible');
    document.getElementById('chatAccountSelect').value = '';
    
    // Reset test mode
    document.getElementById('enableTestMode').checked = false;
    document.getElementById('testModeOptions').style.display = 'none';
    document.getElementById('testInterval').value = '5';
    document.getElementById('startTestBtn').style.display = 'inline-block';
    document.getElementById('stopTestBtn').style.display = 'none';
    document.getElementById('testStatus').textContent = '';
    
    // Reset time selector
    const timeSelector = document.getElementById('chatTimeSelector');
    const addTimeBtn = document.getElementById('addChatTime');
    
    // Remove all time items except the first one
    const timeItems = timeSelector.querySelectorAll('.time-item');
    for (let i = 1; i < timeItems.length; i++) {
      timeItems[i].remove();
    }
    
    // Reset the first time item
    if (timeItems.length > 0) {
      timeItems[0].querySelector('.time-hour').value = '9';
      timeItems[0].querySelector('.time-minute').value = '0';
    } else {
      // Add a default time item if none exists
      addTimeItem(timeSelector, addTimeBtn);
    }
    
    appState.currentEditId = null;
  }
  
  function populateAccountSelect() {
    const select = document.getElementById('chatAccountSelect');
    select.innerHTML = '<option value="">Select an account</option>';
    
    Object.values(appState.accounts).forEach(account => {
      const option = document.createElement('option');
      option.value = account.id;
      option.textContent = account.name;
      select.appendChild(option);
    });
  }
  
  function populateProxySelect() {
    const select = document.getElementById('proxySelect');
    select.innerHTML = '<option value="">No Proxy</option>';
    
    Object.values(appState.proxies).forEach(proxy => {
      const option = document.createElement('option');
      option.value = proxy.id;
      option.textContent = proxy.name;
      select.appendChild(option);
    });
  }
  
  function renderAccounts() {
    if (!accountsList) return;
    
    accountsList.innerHTML = '';
    
    if (Object.keys(appState.accounts).length === 0) {
      accountsList.innerHTML = '<div class="empty-state">No accounts added yet. Click "Add Account" to get started.</div>';
      return;
    }
    
    Object.values(appState.accounts).forEach(account => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">${account.name}</div>
          <div class="card-actions">
            <button class="action-btn edit" data-id="${account.id}"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" data-id="${account.id}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="card-content">
          <div class="card-info"><strong>Phone:</strong> ${account.phoneNumber}</div>
          <div class="card-info"><strong>Session:</strong> ${account.sessionFile}</div>
          ${account.proxy ? `<div class="card-tag">${getProxyTypeForAccount(account.proxy)}</div>` : ''}
        </div>
      `;
      
      accountsList.appendChild(card);
      
      // Add event listeners
      card.querySelector('.edit').addEventListener('click', () => {
        editAccount(account.id);
      });
      
      card.querySelector('.delete').addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete account "${account.name}"?`)) {
          deleteAccount(account.id);
        }
      });
      
      // Добавляем обработчик клика на всю карточку
      card.addEventListener('click', (e) => {
        // Проверяем, что клик не был на кнопках
        if (!e.target.closest('.action-btn')) {
          editAccount(account.id);
        }
      });
    });
  }
  
  function renderProxies() {
    if (!proxyList) return;
    
    proxyList.innerHTML = '';
    
    if (Object.keys(appState.proxies).length === 0) {
      proxyList.innerHTML = '<div class="empty-state">No proxies added yet. Click "Add Proxy" to get started.</div>';
      return;
    }
    
    Object.values(appState.proxies).forEach(proxy => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">${proxy.name}</div>
          <div class="card-actions">
            <button class="action-btn edit" data-id="${proxy.id}"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" data-id="${proxy.id}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="card-content">
          <div class="card-info"><strong>Type:</strong> ${proxy.type.toUpperCase()}</div>
          <div class="card-info"><strong>Host:</strong> ${proxy.host}:${proxy.port}</div>
          <div class="card-tag">${proxy.type.toUpperCase()}</div>
        </div>
      `;
      
      proxyList.appendChild(card);
      
      // Add event listeners
      card.querySelector('.edit').addEventListener('click', () => {
        editProxy(proxy.id);
      });
      
      card.querySelector('.delete').addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete proxy "${proxy.name}"?`)) {
          deleteProxy(proxy.id);
        }
      });
      
      // Добавляем обработчик клика на всю карточку
      card.addEventListener('click', (e) => {
        // Проверяем, что клик не был на кнопках
        if (!e.target.closest('.action-btn')) {
          editProxy(proxy.id);
        }
      });
    });
  }
  
  function renderChats() {
    if (!chatList) return;
    
    chatList.innerHTML = '';
    
    if (Object.keys(appState.chats).length === 0) {
      chatList.innerHTML = '<div class="empty-state">No chats added yet. Click "Add Chat" to get started.</div>';
      return;
    }
    
    Object.values(appState.chats).forEach(chat => {
      const card = document.createElement('div');
      card.className = 'card';
      
      const accountName = appState.accounts[chat.accountId]?.name || 'Unknown Account';
      const timeStrings = chat.times.map(time => `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`);
      
      card.innerHTML = `
        <div class="card-header">
          <div class="card-title">${chat.name}</div>
          <div class="card-actions">
            <button class="action-btn edit" data-id="${chat.id}"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" data-id="${chat.id}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="card-content">
          <div class="card-info"><strong>ID:</strong> ${chat.chatId}</div>
          <div class="card-info"><strong>Message:</strong> ${truncateText(chat.message, 50)}</div>
          <div class="card-info"><strong>Account:</strong> ${accountName}</div>
          <div class="card-info"><strong>Times:</strong> ${timeStrings.join(', ')}</div>
          ${chat.sendPhoto ? `<div class="card-tag success">With Photo</div>` : `<div class="card-tag">Text Only</div>`}
        </div>
      `;
      
      chatList.appendChild(card);
      
      // Add event listeners
      card.querySelector('.edit').addEventListener('click', () => {
        editChat(chat.id);
      });
      
      card.querySelector('.delete').addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete chat "${chat.name}"?`)) {
          deleteChat(chat.id);
        }
      });
      
      // Добавляем обработчик клика на всю карточку
      card.addEventListener('click', (e) => {
        // Проверяем, что клик не был на кнопках
        if (!e.target.closest('.action-btn')) {
          editChat(chat.id);
        }
      });
    });
  }
  
  function renderAll() {
    renderAccounts();
    renderProxies();
    renderChats();
  }
  
  function editAccount(id) {
    const account = appState.accounts[id];
    if (!account) return;
    
    appState.currentEditId = id;
    
    document.getElementById('accountName').value = account.name;
    document.getElementById('apiId').value = account.apiId;
    document.getElementById('apiHash').value = account.apiHash;
    document.getElementById('phoneNumber').value = account.phoneNumber;
    document.getElementById('sessionFile').value = account.sessionFile;
    
    const useProxyCheck = document.getElementById('useProxyCheck');
    useProxyCheck.checked = !!account.proxy;
    
    if (account.proxy) {
      document.querySelector('.proxy-toggle-content').classList.add('expanded');
      document.querySelector('.proxy-toggle-header').classList.add('expanded');
      populateProxySelect();
      document.getElementById('proxySelect').value = account.proxy;
    } else {
      document.querySelector('.proxy-toggle-content').classList.remove('expanded');
      document.querySelector('.proxy-toggle-header').classList.remove('expanded');
    }
    
    accountModal.style.display = 'block';
  }
  
  function editProxy(id) {
    const proxy = appState.proxies[id];
    if (!proxy) return;
    
    appState.currentEditId = id;
    
    document.getElementById('proxyName').value = proxy.name;
    document.getElementById('proxyType').value = proxy.type;
    document.getElementById('proxyHost').value = proxy.host;
    document.getElementById('proxyPort').value = proxy.port;
    document.getElementById('proxyUsername').value = proxy.username || '';
    document.getElementById('proxyPassword').value = proxy.password || '';
    
    proxyModal.style.display = 'block';
  }
  
  function editChat(id) {
    const chat = appState.chats[id];
    if (!chat) return;
    
    appState.currentEditId = id;
    
    document.getElementById('chatName').value = chat.name;
    document.getElementById('chatId').value = chat.chatId;
    document.getElementById('messageContent').value = chat.message;
    
    const sendPhotoCheck = document.getElementById('sendPhotoCheck');
    sendPhotoCheck.checked = chat.sendPhoto;
    
    if (chat.sendPhoto) {
      document.getElementById('photoUrlField').classList.add('visible');
      document.getElementById('photoUrl').value = chat.photoUrl;
    } else {
      document.getElementById('photoUrlField').classList.remove('visible');
    }
    
    populateAccountSelect();
    document.getElementById('chatAccountSelect').value = chat.accountId;
    
    // Reset test mode
    document.getElementById('enableTestMode').checked = false;
    document.getElementById('testModeOptions').style.display = 'none';
    document.getElementById('testInterval').value = '5';
    document.getElementById('startTestBtn').style.display = 'inline-block';
    document.getElementById('stopTestBtn').style.display = 'none';
    document.getElementById('testStatus').textContent = '';
    
    // Set up time selector
    const timeSelector = document.getElementById('chatTimeSelector');
    const addTimeBtn = document.getElementById('addChatTime');
    
    // Remove all existing time items
    timeSelector.querySelectorAll('.time-item').forEach(item => item.remove());
    
    // Add time items from chat data
    chat.times.forEach(time => {
      const timeItem = document.createElement('div');
      timeItem.className = 'time-item';
      timeItem.innerHTML = `
        <input type="number" min="0" max="23" value="${time.hour}" class="time-hour"> :
        <input type="number" min="0" max="59" value="${time.minute}" class="time-minute">
        <button class="action-btn delete-time"><i class="fas fa-times"></i></button>
      `;
      
      timeSelector.insertBefore(timeItem, addTimeBtn);
      
      // Add event listener to delete button
      timeItem.querySelector('.delete-time').addEventListener('click', () => {
        timeItem.remove();
      });
    });
    
    chatModal.style.display = 'block';
  }
  
  function deleteAccount(id) {
    delete appState.accounts[id];
    renderAccounts();
    showNotification('Account deleted successfully!', 'success');
    
    // Check if any chats use this account and update them
    Object.values(appState.chats).forEach(chat => {
      if (chat.accountId === id) {
        chat.accountId = '';
      }
    });
    renderChats();
    
    // Сохраняем данные в localStorage
    saveToLocalStorage();
  }
  
  function deleteProxy(id) {
    delete appState.proxies[id];
    renderProxies();
    showNotification('Proxy deleted successfully!', 'success');
    
    // Check if any accounts use this proxy and update them
    Object.values(appState.accounts).forEach(account => {
      if (account.proxy === id) {
        account.proxy = null;
      }
    });
    renderAccounts();
    
    // Сохраняем данные в localStorage
    saveToLocalStorage();
  }
  
  function deleteChat(id) {
    delete appState.chats[id];
    renderChats();
    showNotification('Chat deleted successfully!', 'success');
    
    // Сохраняем данные в localStorage
    saveToLocalStorage();
  }
  
  function getProxyTypeForAccount(proxyId) {
    const proxy = appState.proxies[proxyId];
    return proxy ? proxy.type.toUpperCase() + ' Proxy' : 'Unknown Proxy';
  }
  
  function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  function getSelectionFromTextarea(textarea) {
    return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
  }
  
  function insertTextAtCursor(textarea, text) {
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const scrollTop = textarea.scrollTop;
    
    textarea.value = textarea.value.substring(0, startPos) + text + textarea.value.substring(endPos, textarea.value.length);
    
    textarea.focus();
    textarea.selectionStart = startPos + text.length;
    textarea.selectionEnd = startPos + text.length;
    textarea.scrollTop = scrollTop;
  }
  
  function wrapSelectedText(textarea, before, after) {
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const scrollTop = textarea.scrollTop;
    const selectedText = textarea.value.substring(startPos, endPos);
    
    if (selectedText) {
      textarea.value = textarea.value.substring(0, startPos) + before + selectedText + after + textarea.value.substring(endPos);
      textarea.focus();
      textarea.selectionStart = startPos + before.length;
      textarea.selectionEnd = startPos + before.length + selectedText.length;
    } else {
      textarea.value = textarea.value.substring(0, startPos) + before + after + textarea.value.substring(endPos);
      textarea.focus();
      textarea.selectionStart = startPos + before.length;
      textarea.selectionEnd = startPos + before.length;
    }
    
    textarea.scrollTop = scrollTop;
  }
  
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
      return false;
    }
  }

  // Show notification function
  function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(notification);
    
    // Add event listener to close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.classList.add('fade-out');
        setTimeout(() => {
          if (document.body.contains(notification)) {
            notification.remove();
          }
        }, 300);
      }
    }, 3000);
  }

  // Initialize the app
  renderAll();
});
