// Static site JavaScript — no backend required
let currentUser = null;
let isLoggedIn = false;
let appData = null;
let mediaItems = [];
let selectedMediaItems = [];
let bulkSelectMode = false;
let mediaPageInitialized = false;

const STORAGE_KEYS = {
    user: 'currentUser',
    media: 'mediaItems',
    favourites: 'favourites'
};

const DEFAULT_DATA = {
    users: [
        { id: 1, email: 'jan.devries@grafischlyceum.nl', password: 'demo123', naam: 'Jan de Vries', rol: 'ICT_PERSONEEL', userType: 'ict' },
        { id: 2, email: 'maria.jansen@grafischlyceum.nl', password: 'demo123', naam: 'Maria Jansen', rol: 'ICT_PERSONEEL', userType: 'ict' },
        { id: 3, email: 'demo@globalsource.com', password: 'demo123', naam: 'Demo Student', rol: 'STUDENT', userType: 'student' },
        { id: 4, email: 'student@grafischlyceum.nl', password: 'student123', naam: 'Demo Student', rol: 'STUDENT', userType: 'student' },
        { id: 5, email: 'leraar@grafischlyceum.nl', password: 'leraar123', naam: 'Demo Leraar', rol: 'LERAAR', userType: 'leraar' },
        { id: 6, email: 'ict@grafischlyceum.nl', password: 'ict123', naam: 'ICT Beheerder', rol: 'ICT_PERSONEEL', userType: 'ict' }
    ],
    dashboard: {
        totalServers: 3,
        servers: [
            { naam: 'Web Server', ipAdres: '192.168.1.10', beschrijving: 'Hoofd web server voor de leeromgeving', status: 'ACTIEF' },
            { naam: 'Database Server', ipAdres: '192.168.1.20', beschrijving: 'Database server voor applicatie data', status: 'ACTIEF' },
            { naam: 'Backup Server', ipAdres: '192.168.1.30', beschrijving: 'Server voor dagelijkse backups', status: 'ACTIEF' }
        ],
        stats: { totalUsers: 150, activeServers: 3, totalProjects: 25 }
    },
    shop: [
        { id: 1, title: 'Digital Dreams Print', description: 'Hoge kwaliteit print van mijn populairste artwork', price: '€25.00', image: 'assets/shop-print.png' },
        { id: 2, title: 'Character Stickers', description: 'Set van 5 vinyl stickers', price: '€8.50', image: 'assets/shop-sticker.png' },
        { id: 3, title: 'Custom Commission', description: 'Persoonlijk artwork op maat', price: '€75.00', image: 'assets/shop-commission.png' }
    ],
    media: [
        { id: 1, name: 'shadow-co-saber.jpg', size: '2.3 MB', type: 'image', date: '2024-01-20', url: 'assets/media-anime.png' },
        { id: 2, name: 'shadow-co-tactical.png', size: '1.8 MB', type: 'image', date: '2024-01-19', url: 'assets/media-character.png' },
        { id: 3, name: 'project-presentation.pdf', size: '4.2 MB', type: 'pdf', date: '2024-01-18', url: null },
        { id: 4, name: 'video-tutorial.mp4', size: '15.7 MB', type: 'video', date: '2024-01-17', url: null },
        { id: 5, name: 'assignment-document.docx', size: '856 KB', type: 'doc', date: '2024-01-16', url: null },
        { id: 6, name: 'shadow-co-operator.jpg', size: '3.1 MB', type: 'image', date: '2024-01-15', url: 'assets/media-artwork.png' }
    ]
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    await loadAppData();
    setupEventListeners();
    setupHashRouting();
    checkLoginStatus();
});

async function loadAppData() {
    try {
        const response = await fetch('assets/data.json');
        if (response.ok) {
            appData = await response.json();
            return;
        }
    } catch (error) {
        // Expected when opening index.html directly (file://)
    }
    appData = DEFAULT_DATA;
}

function setupHashRouting() {
    window.addEventListener('hashchange', handleHashChange);
    if (isLoggedIn && window.location.hash) {
        const page = window.location.hash.replace('#', '');
        if (page) showPage(page);
    }
}

function handleHashChange() {
    if (!isLoggedIn) return;
    const page = window.location.hash.replace('#', '');
    if (page) showPage(page);
}

function setupEventListeners() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', openLoginModal);
    }

    // Modal close
    const modal = document.getElementById('loginModal');
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLoginModal);
    }
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeLoginModal();
            }
        });
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }


    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            showPage(page);
        });
    });

    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSave);
    }

    // Profile button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            showPage('profile');
        });
    }

    // Quick links
    const quickLinks = document.querySelectorAll('.quick-links a');
    quickLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const page = href.substring(1);
            showPage(page);
        });
    });

    // Media page functionality
    setupMediaPage();

    // Main login form
    const mainLoginForm = document.getElementById('mainLoginForm');
    if (mainLoginForm) {
        mainLoginForm.addEventListener('submit', handleMainLogin);
    }

    // Fill test data button for main form
    const fillMainTestDataBtn = document.getElementById('fillMainTestData');
    if (fillMainTestDataBtn) {
        fillMainTestDataBtn.addEventListener('click', fillMainTestData);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}


function authenticateUser(email, password, userType) {
    const users = appData?.users || DEFAULT_DATA.users;
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        return { success: false, message: 'Gebruiker niet gevonden' };
    }
    if (user.password !== password) {
        return { success: false, message: 'Ongeldig wachtwoord' };
    }

    return {
        success: true,
        user: {
            id: user.id,
            email: user.email,
            naam: user.naam,
            rol: user.rol,
            userType: userType || user.userType
        }
    };
}

function processLogin(email, password, userType) {
    const result = authenticateUser(email, password, userType);
    if (!result.success) {
        return result;
    }

    currentUser = result.user;
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(currentUser));
    return { success: true, user: currentUser };
}

async function handleLogin(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const userTypeSelect = document.getElementById('userType');

    if (!emailInput || !passwordInput || !userTypeSelect) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const userType = userTypeSelect.value;

    if (!email || !password) {
        showAlert('Vul alle velden in', 'error');
        return;
    }

    showAlert('Inloggen...', 'info');
    
    const result = processLogin(email, password, userType);
    
    if (result.success) {
        showAlert('Succesvol ingelogd!', 'success');
        setTimeout(() => {
            closeLoginModal();
            showMainInterface();
            showPage('home');
        }, 500);
    } else {
        showAlert(result.message || 'Inloggen mislukt', 'error');
    }
}

function getDisplayName(userType) {
    switch(userType) {
        case 'student':
            return 'Student';
        case 'leraar':
            return 'Leraar';
        case 'ict':
            return 'ICT Personeel';
        default:
            return 'Gebruiker';
    }
}

function updateUIForLoggedInUser() {
    // Update user name in top nav
    const userName = document.querySelector('.user-name');
    if (userName && currentUser) {
        userName.textContent = currentUser.naam;
    }

    // Update user avatar in sidebar
    const userAvatarLarge = document.querySelector('.user-avatar-large');
    if (userAvatarLarge && currentUser) {
        userAvatarLarge.src = 'assets/avatar.png';
        userAvatarLarge.alt = currentUser.naam;
    }

    // Update sidebar user info
    const sidebarUserName = document.querySelector('.user-info h3');
    if (sidebarUserName && currentUser) {
        sidebarUserName.textContent = currentUser.naam;
    }

    // Show user menu and logout button, hide login button
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileBtn = document.getElementById('profileBtn');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'flex';
    if (profileBtn) profileBtn.style.display = 'block';
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'alert alert-success';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.zIndex = '3000';
    toast.style.minWidth = '240px';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // Insert alert in modal body
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
        modalBody.insertBefore(alert, modalBody.firstChild);
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
    }

    if (isLoggedIn) {
        history.replaceState(null, '', '#' + pageId);
    }

    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId) {
            link.classList.add('active');
        }
    });

    // Load page-specific data
    switch(pageId) {
        case 'gallery':
            loadGallery();
            break;
        case 'favourites':
            loadFavourites();
            break;
        case 'about':
            loadAbout();
            break;
        case 'shop':
            loadShop();
            break;
        case 'watch':
            loadWatch();
            break;
        case 'submit':
            // Ensure media is set up and rendered
            setTimeout(() => {
                setupMediaPage();
                renderMediaGrid();
            }, 100);
            break;
    }
}

function handleProfileSave(e) {
    e.preventDefault();
    showAlert('Profiel opgeslagen! (Dit is een demo)', 'success');
}

function loadSampleData() {
    loadGallery();
    loadFavourites();
    loadAbout();
    loadShop();
    loadWatch();
    loadSampleMedia(); // Ensure media is loaded when main interface is shown
}

function loadModules() {
    const modulesList = document.getElementById('modulesList');
    if (!modulesList) return;

    const sampleModules = [
        { name: 'Web Development', code: 'WEB101', status: 'ACTIEF', progress: 75, description: 'Leer moderne web development technieken met HTML, CSS en JavaScript' },
        { name: 'Database Design', code: 'DB201', status: 'ACTIEF', progress: 60, description: 'Ontwerp en beheer databases met SQL en NoSQL' },
        { name: 'Java Programming', code: 'JAVA301', status: 'VOLTOOID', progress: 100, description: 'Programmeren in Java voor enterprise applicaties' },
        { name: 'Project Management', code: 'PM401', status: 'ACTIEF', progress: 30, description: 'Project management vaardigheden en methodologieën' }
    ];

    modulesList.innerHTML = '';
    sampleModules.forEach(module => {
        const moduleCard = document.createElement('div');
        moduleCard.className = 'module-card';
        moduleCard.innerHTML = `
            <h3>${module.name}</h3>
            <p><strong>Code:</strong> ${module.code}</p>
            <p>${module.description}</p>
            <p><strong>Status:</strong> <span class="badge ${module.status === 'ACTIEF' ? 'badge-success' : 'badge-primary'}">${module.status}</span></p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${module.progress}%"></div>
            </div>
            <p><strong>Voortgang:</strong> ${module.progress}%</p>
        `;
        modulesList.appendChild(moduleCard);
    });
}

function loadGrades() {
    const gradesList = document.getElementById('gradesList');
    if (!gradesList) return;

    const sampleGrades = [
        { module: 'Web Development', grade: 8.5, date: '2024-01-15', type: 'Tentamen' },
        { module: 'Database Design', grade: 7.2, date: '2024-01-20', type: 'Project' },
        { module: 'Java Programming', grade: 9.1, date: '2024-01-10', type: 'Tentamen' },
        { module: 'Project Management', grade: null, date: null, type: 'Tentamen' }
    ];

    gradesList.innerHTML = '';
    sampleGrades.forEach(grade => {
        const gradeCard = document.createElement('div');
        gradeCard.className = 'grade-card';
        
        let gradeBadge = '';
        if (grade.grade) {
            let badgeClass = 'grade-excellent';
            if (grade.grade < 6) badgeClass = 'grade-poor';
            else if (grade.grade < 8) badgeClass = 'grade-good';
            
            gradeBadge = `<span class="grade-badge ${badgeClass}">${grade.grade}</span>`;
        } else {
            gradeBadge = '<span class="grade-badge grade-good">Nog geen cijfer</span>';
        }

        gradeCard.innerHTML = `
            <h3>${grade.module}</h3>
            <p><strong>Type:</strong> ${grade.type}</p>
            <p><strong>Cijfer:</strong> ${gradeBadge}</p>
            ${grade.date ? `<p><strong>Datum:</strong> ${grade.date}</p>` : ''}
        `;
        gradesList.appendChild(gradeCard);
    });
}

function loadMessages() {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;

    const sampleMessages = [
        { from: 'Dhr. Jansen', subject: 'Belangrijke mededeling', date: '2024-01-22', read: false, content: 'Er is een belangrijke wijziging in het rooster voor volgende week. Controleer je agenda.' },
        { from: 'Mevr. de Vries', subject: 'Project deadline', date: '2024-01-21', read: true, content: 'De deadline voor het web development project is verlengd tot vrijdag 26 januari.' },
        { from: 'Dhr. Bakker', subject: 'Tentamen resultaten', date: '2024-01-20', read: true, content: 'De resultaten van het Java tentamen zijn beschikbaar in de leeromgeving.' }
    ];

    messagesList.innerHTML = '';
    sampleMessages.forEach(message => {
        const messageCard = document.createElement('div');
        messageCard.className = `message-card ${!message.read ? 'unread' : ''}`;
        messageCard.innerHTML = `
            <h4>${message.subject}</h4>
            <p><strong>Van:</strong> ${message.from}</p>
            <p><strong>Datum:</strong> ${message.date}</p>
            <p>${message.content}</p>
            ${!message.read ? '<span class="badge badge-primary">Nieuw</span>' : ''}
        `;
        messagesList.appendChild(messageCard);
    });
}

function loadProfile() {
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');

    if (currentUser) {
        if (profileName) profileName.value = currentUser.naam || 'Gebruiker';
        if (profileEmail) profileEmail.value = currentUser.email || '';
        if (profilePhone) profilePhone.value = '';
    } else {
        if (profileName) profileName.value = 'Gebruiker';
        if (profileEmail) profileEmail.value = '';
        if (profilePhone) profilePhone.value = '';
    }
}

// Globalsource Comics Page Functions
function loadGallery() {
    const galleryContainer = document.querySelector('#gallery-page .page-content');
    if (!galleryContainer) return;

    const images = mediaItems.filter(item => item.type === 'image' && item.url);

    if (images.length === 0) {
        galleryContainer.innerHTML = `
        <div class="gallery-grid">
            <div class="artwork-card">
                <img src="assets/media-character.png" alt="Geen projecten">
                <h3>Geen projecten</h3>
                <p>Begin met je eerste project</p>
                <div class="artwork-stats">
                    <span><i class="fas fa-plus"></i> Nieuw</span>
                    <span><i class="fas fa-upload"></i> Upload</span>
                </div>
            </div>
        </div>
    `;
        return;
    }

    galleryContainer.innerHTML = `
        <div class="gallery-grid">
            ${images.map(item => `
                <div class="artwork-card">
                    <img src="${item.url}" alt="${item.name}">
                    <h3>${item.name}</h3>
                    <p>Geüpload op ${item.date}</p>
                    <div class="artwork-stats">
                        <span><i class="fas fa-image"></i> ${item.size}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getFavourites() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.favourites) || '[]');
    } catch (error) {
        return [];
    }
}

function saveFavourites(favourites) {
    localStorage.setItem(STORAGE_KEYS.favourites, JSON.stringify(favourites));
}

function loadFavourites() {
    const favouritesContainer = document.querySelector('#favourites-page .page-content');
    if (!favouritesContainer) return;

    const favourites = getFavourites();

    if (favourites.length === 0) {
        favouritesContainer.innerHTML = `
        <div class="favourites-grid">
            <div class="favourite-item">
                <img src="assets/media-anime.png" alt="Geen favorieten">
                <h4>Geen favorieten</h4>
                <p>Voeg je eerste favoriet toe</p>
            </div>
        </div>
    `;
        return;
    }

    favouritesContainer.innerHTML = `
        <div class="favourites-grid">
            ${favourites.map(item => `
                <div class="favourite-item">
                    <img src="${item.url || 'assets/placeholder-favourites.svg'}" alt="${item.name}">
                    <h4>${item.name}</h4>
                    <p>${item.date || ''}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function loadAbout() {
    const aboutContainer = document.querySelector('#about-page .page-content');
    if (!aboutContainer) return;
    
    const stats = appData?.dashboard?.stats || DEFAULT_DATA.dashboard.stats;
    const projectCount = mediaItems.filter(item => item.type === 'image').length || stats.totalProjects;

    aboutContainer.innerHTML = `
        <div class="about-content">
            <h2>Over de Leeromgeving</h2>
            <p>Welkom bij de Grafisch Lyceum Leeromgeving. Hier kun je je projecten beheren, cursussen volgen en samenwerken met andere studenten.</p>
            
            <h3>Functies</h3>
            <ul>
                <li>Project Management</li>
                <li>Cursus Materiaal</li>
                <li>Oefeningen</li>
                <li>Hulpmiddelen</li>
            </ul>
            
            <h3>Statistieken</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="number">${projectCount}</span>
                    <span class="label">Projecten</span>
                </div>
                <div class="stat-item">
                    <span class="number">${stats.totalUsers}</span>
                    <span class="label">Gebruikers</span>
                </div>
                <div class="stat-item">
                    <span class="number">${stats.activeServers}</span>
                    <span class="label">Servers actief</span>
                </div>
            </div>
        </div>
    `;
}

function loadShop() {
    const shopContainer = document.querySelector('#shop-page .page-content');
    if (!shopContainer) return;

    const shopItems = appData?.shop || DEFAULT_DATA.shop;

    shopContainer.innerHTML = `
        <div class="shop-grid">
            ${shopItems.map(item => `
                <div class="shop-item">
                    <img src="${item.image}" alt="${item.title}">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <div class="price">${item.price}</div>
                    <button class="btn btn-primary" onclick="showToast('Demo: ${item.title} is toegevoegd aan je winkelwagen.')">Koop nu</button>
                </div>
            `).join('')}
        </div>
    `;
}

function loadWatch() {
    const watchContainer = document.querySelector('#watch-page .page-content');
    if (!watchContainer) return;
    
    watchContainer.innerHTML = `
        <div class="watch-feed">
            <div class="watch-item">
                <img src="assets/shadow-project-logo.png" alt="Geen activiteit">
                <div class="watch-info">
                    <h4>Geen activiteit</h4>
                    <p>Volg andere gebruikers om updates te zien</p>
                    <span class="time">-</span>
                </div>
            </div>
        </div>
    `;
}

// Media Page Functionality

function setupMediaPage() {
    const mediaGrid = document.getElementById('mediaGrid');
    if (!mediaGrid) return;

    if (mediaPageInitialized) {
        renderMediaGrid();
        return;
    }
    mediaPageInitialized = true;

    // Upload button
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', openUploadModal);
    }

    // Bulk select button
    const bulkSelectBtn = document.getElementById('bulkSelectBtn');
    if (bulkSelectBtn) {
        bulkSelectBtn.addEventListener('click', toggleBulkSelect);
    }

    // Upload modal
    const uploadModal = document.getElementById('uploadModal');
    const uploadCloseBtn = uploadModal?.querySelector('.close');
    if (uploadCloseBtn) {
        uploadCloseBtn.addEventListener('click', closeUploadModal);
    }
    if (uploadModal) {
        uploadModal.addEventListener('click', function(e) {
            if (e.target === uploadModal) {
                closeUploadModal();
            }
        });
    }

    // File input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    // Upload area drag and drop
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput?.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }

    // Media filter
    const mediaFilter = document.getElementById('mediaFilter');
    if (mediaFilter) {
        mediaFilter.addEventListener('change', filterMedia);
    }

    // Media search
    const mediaSearch = document.getElementById('mediaSearch');
    if (mediaSearch) {
        mediaSearch.addEventListener('input', filterMedia);
    }

    // Load sample media
    loadSampleMedia();
    
    console.log('Media page setup completed');
}

function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'none';
        // Reset upload area
        const uploadArea = document.getElementById('uploadArea');
        const uploadProgress = document.getElementById('uploadProgress');
        if (uploadArea) uploadArea.style.display = 'block';
        if (uploadProgress) uploadProgress.style.display = 'none';
    }
}

function handleDragOver(e) {
    e.preventDefault();
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.classList.add('dragover');
    }
}

function handleDragLeave(e) {
    e.preventDefault();
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.classList.remove('dragover');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.classList.remove('dragover');
    }
    
    const files = e.dataTransfer.files;
    handleFiles(files);
}

function handleFileUpload(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length === 0) return;

    const uploadArea = document.getElementById('uploadArea');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (uploadArea) uploadArea.style.display = 'none';
    if (uploadProgress) uploadProgress.style.display = 'block';

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        
        if (progressFill) progressFill.style.width = progress + '%';
        if (progressText) progressText.textContent = Math.round(progress) + '%';

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                // Add files to media library
                Array.from(files).forEach(file => {
                    addMediaItem(file);
                });
                
                closeUploadModal();
                showAlert('Bestanden succesvol geüpload!', 'success');
            }, 500);
        }
    }, 200);
}

function addMediaItem(file) {
    const mediaItem = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: formatFileSize(file.size),
        type: getFileType(file.type),
        date: new Date().toLocaleDateString('nl-NL'),
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    };

    mediaItems.unshift(mediaItem);
    saveMediaItems();
    renderMediaGrid();
}

function getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'doc';
    return 'other';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function saveMediaItems() {
    const storable = mediaItems.map(item => ({
        id: item.id,
        name: item.name,
        size: item.size,
        type: item.type,
        date: item.date,
        url: item.url || null
    }));
    localStorage.setItem(STORAGE_KEYS.media, JSON.stringify(storable));
}

function loadSampleMedia() {
    const saved = localStorage.getItem(STORAGE_KEYS.media);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            const hasLegacyAssets = parsed.some(item => item.url && item.url.endsWith('.svg'));
            if (!hasLegacyAssets) {
                mediaItems = parsed;
                renderMediaGrid();
                return;
            }
        } catch (error) {
            // Fall through to default data
        }
    }

    mediaItems = JSON.parse(JSON.stringify(appData?.media || DEFAULT_DATA.media));
    saveMediaItems();
    renderMediaGrid();
}

function renderMediaGrid() {
    const mediaGrid = document.getElementById('mediaGrid');
    if (!mediaGrid) {
        console.log('Media grid not found for rendering');
        return;
    }

    console.log('Rendering media grid with', mediaItems.length, 'items');

    mediaGrid.innerHTML = '';

    if (mediaItems.length === 0) {
        mediaGrid.innerHTML = '<div class="no-media">Geen mediabestanden gevonden. Upload je eerste bestand!</div>';
        return;
    }

    mediaItems.forEach(item => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        mediaItem.dataset.id = item.id;
        mediaItem.dataset.type = item.type;

        let previewContent = '';
        if (item.type === 'image' && item.url) {
            previewContent = `<img src="${item.url}" alt="${item.name}">`;
        } else {
            const iconClass = getFileIconClass(item.type);
            previewContent = `<i class="fas ${iconClass} file-icon ${item.type}"></i>`;
        }

        mediaItem.innerHTML = `
            <div class="media-preview">
                ${previewContent}
                <div class="media-actions-overlay">
                    <button class="media-action-btn" onclick="viewMedia(${item.id})">
                        <i class="fas fa-eye"></i> Bekijk
                    </button>
                    <button class="media-action-btn" onclick="downloadMedia(${item.id})">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="media-action-btn delete" onclick="deleteMedia(${item.id})">
                        <i class="fas fa-trash"></i> Verwijder
                    </button>
                </div>
            </div>
            <div class="media-info">
                <div class="media-title">${item.name}</div>
                <div class="media-meta">
                    <span class="media-size">${item.size}</span>
                    <span class="media-date">${item.date}</span>
                </div>
            </div>
        `;

        // Add click handler for selection
        mediaItem.addEventListener('click', function(e) {
            if (bulkSelectMode) {
                toggleMediaSelection(item.id);
            }
        });

        mediaGrid.appendChild(mediaItem);
    });
}

function getFileIconClass(type) {
    switch(type) {
        case 'image': return 'fa-image';
        case 'video': return 'fa-video';
        case 'pdf': return 'fa-file-pdf';
        case 'doc': return 'fa-file-word';
        default: return 'fa-file';
    }
}

function toggleBulkSelect() {
    bulkSelectMode = !bulkSelectMode;
    const bulkSelectBtn = document.getElementById('bulkSelectBtn');
    const bulkActions = document.querySelector('.bulk-actions');
    
    if (bulkSelectBtn) {
        bulkSelectBtn.textContent = bulkSelectMode ? 'Annuleer selectie' : 'Bulk selectie';
        bulkSelectBtn.classList.toggle('active', bulkSelectMode);
    }

    if (bulkActions) {
        bulkActions.classList.toggle('active', bulkSelectMode);
    }

    // Clear selections when exiting bulk mode
    if (!bulkSelectMode) {
        selectedMediaItems = [];
        updateMediaSelection();
    }
}

function toggleMediaSelection(id) {
    const index = selectedMediaItems.indexOf(id);
    if (index > -1) {
        selectedMediaItems.splice(index, 1);
    } else {
        selectedMediaItems.push(id);
    }
    updateMediaSelection();
}

function updateMediaSelection() {
    const mediaItems = document.querySelectorAll('.media-item');
    mediaItems.forEach(item => {
        const id = parseInt(item.dataset.id);
        item.classList.toggle('selected', selectedMediaItems.includes(id));
    });

    // Update bulk actions info
    const bulkActionsInfo = document.querySelector('.bulk-actions-info');
    if (bulkActionsInfo) {
        bulkActionsInfo.textContent = `${selectedMediaItems.length} item(s) geselecteerd`;
    }
}

function filterMedia() {
    const filter = document.getElementById('mediaFilter')?.value || 'all';
    const search = document.getElementById('mediaSearch')?.value.toLowerCase() || '';
    
    const mediaItems = document.querySelectorAll('.media-item');
    mediaItems.forEach(item => {
        const type = item.dataset.type;
        const name = item.querySelector('.media-title')?.textContent.toLowerCase() || '';
        
        const typeMatch = filter === 'all' || type === filter;
        const searchMatch = name.includes(search);
        
        item.style.display = (typeMatch && searchMatch) ? 'block' : 'none';
    });
}

function viewMedia(id) {
    const item = mediaItems.find(item => item.id === id);
    if (item) {
        if (item.type === 'image' && item.url) {
            window.open(item.url, '_blank');
        } else {
            showAlert('Voorvertoning niet beschikbaar voor dit bestandstype', 'error');
        }
    }
}

function downloadMedia(id) {
    const item = mediaItems.find(item => item.id === id);
    if (item) {
        if (item.url) {
            const link = document.createElement('a');
            link.href = item.url;
            link.download = item.name;
            link.click();
        } else {
            showAlert('Download niet beschikbaar voor dit bestand', 'error');
        }
    }
}

function deleteMedia(id) {
    if (confirm('Weet je zeker dat je dit bestand wilt verwijderen?')) {
        mediaItems = mediaItems.filter(item => item.id !== id);
        selectedMediaItems = selectedMediaItems.filter(item => item !== id);
        saveMediaItems();
        renderMediaGrid();
        showToast('Bestand verwijderd');
    }
}

// Login Gate Functionality
function checkLoginStatus() {
    const savedUser = localStorage.getItem(STORAGE_KEYS.user);
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isLoggedIn = true;
        showMainInterface();
        loadDashboardData();
        if (window.location.hash) {
            const page = window.location.hash.replace('#', '');
            if (page) showPage(page);
        }
    } else {
        showLoginPage();
    }
}

function showLoginPage() {
    const loginPage = document.getElementById('login-page-full');
    const mainContainer = document.getElementById('mainContainer');
    
    if (loginPage) loginPage.style.display = 'flex';
    if (mainContainer) mainContainer.style.display = 'none';
    
    // Hide user menu elements
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileBtn = document.getElementById('profileBtn');
    
    if (loginBtn) loginBtn.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (profileBtn) profileBtn.style.display = 'none';
    
    isLoggedIn = false;
    currentUser = null;
}

function showMainInterface() {
    const loginPage = document.getElementById('login-page-full');
    const mainContainer = document.getElementById('mainContainer');
    
    if (loginPage) loginPage.style.display = 'none';
    if (mainContainer) mainContainer.style.display = 'flex';
    
    isLoggedIn = true;
    
    // Update UI for logged in user
    updateUIForLoggedInUser();
    
    // Load sample data
    loadSampleData();
    
    // Ensure media functionality is set up
    setTimeout(() => {
        setupMediaPage();
    }, 100);
}

async function handleMainLogin(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('mainEmail');
    const passwordInput = document.getElementById('mainPassword');
    const userTypeSelect = document.getElementById('mainUserType');

    if (!emailInput || !passwordInput || !userTypeSelect) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const userType = userTypeSelect.value;

    if (!email || !password) {
        showMainAlert('Vul alle velden in', 'error');
        return;
    }

    showMainAlert('Inloggen...', 'info');

    const result = processLogin(email, password, userType);

    if (result.success) {
        showMainAlert('Succesvol ingelogd!', 'success');
        setTimeout(() => {
            showMainInterface();
            loadDashboardData();
            showPage('home');
        }, 500);
    } else {
        showMainAlert(result.message || 'Inloggen mislukt', 'error');
    }
}

function fillMainTestData() {
    const emailInput = document.getElementById('mainEmail');
    const passwordInput = document.getElementById('mainPassword');
    const userTypeSelect = document.getElementById('mainUserType');

    if (emailInput && passwordInput && userTypeSelect) {
        emailInput.value = 'demo@globalsource.com';
        passwordInput.value = 'demo123';
        userTypeSelect.value = 'student';
    }
}

function loadDashboardData() {
    const dashboard = appData?.dashboard || DEFAULT_DATA.dashboard;
    updateDashboardWithData(dashboard);
}

function updateDashboardWithData(data) {
    if (data.stats) {
        updateStatistics(data.stats);
    }
}

function updateStatistics(stats) {
    const statProjects = document.getElementById('statProjects');
    if (statProjects) {
        const imageCount = mediaItems.filter(item => item.type === 'image').length;
        statProjects.textContent = imageCount || stats.totalProjects || 0;
    }
}

function handleLogout() {
    if (confirm('Weet je zeker dat je wilt uitloggen?')) {
        // Clear localStorage
        localStorage.removeItem(STORAGE_KEYS.user);
        
        // Reset state
        currentUser = null;
        isLoggedIn = false;
        
        // Show login page
        showLoginPage();
        
        // Hide user menu elements
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        const logoutBtn = document.getElementById('logoutBtn');
        const profileBtn = document.getElementById('profileBtn');
        
        if (loginBtn) loginBtn.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'none';
        
        // Clear form
        const emailInput = document.getElementById('mainEmail');
        const passwordInput = document.getElementById('mainPassword');
        const userTypeSelect = document.getElementById('mainUserType');
        
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (userTypeSelect) userTypeSelect.value = 'student';
    }
}

function showMainAlert(message, type) {
    const existingAlerts = document.querySelectorAll('#mainErrorAlert, #mainSuccessAlert');
    existingAlerts.forEach(alert => alert.style.display = 'none');

    if (type === 'info') return;

    const alertId = type === 'error' ? 'mainErrorAlert' : 'mainSuccessAlert';
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.textContent = message;
        alert.style.display = 'block';
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert) alert.style.display = 'none';
    }, 5000);
}