const TROPHIES = {
    firstLesson: { name: 'First Steps', desc: 'Complete your first lesson', icon: 'fa-solid fa-shoe-prints' },
    perfectLesson: { name: 'Perfectionist', desc: 'Score 10/10 on a lesson', icon: 'fa-solid fa-crown' },
    streak3: { name: 'On Fire', desc: 'Reach a 3-day streak', icon: 'fa-solid fa-fire' },
    streak7: { name: 'Dedicated', desc: 'Reach a 7-day streak', icon: 'fa-solid fa-calendar-check' },
    streak30: { name: 'Unstoppable', desc: 'Reach a 30-day streak', icon: 'fa-solid fa-bolt' },
    xp100: { name: 'Learner', desc: 'Earn 100 XP', icon: 'fa-solid fa-star' },
    xp500: { name: 'Scholar', desc: 'Earn 500 XP', icon: 'fa-solid fa-graduation-cap' },
    xp1000: { name: 'Master', desc: 'Earn 1000 XP', icon: 'fa-solid fa-hat-wizard' },
    polyglot: { name: 'Polyglot', desc: 'Study 3 language tracks', icon: 'fa-solid fa-language' },
    mathWiz: { name: 'Math Wizard', desc: 'Complete every math topic', icon: 'fa-solid fa-calculator' },
    explorer: { name: 'Explorer', desc: 'Try 10 different subjects', icon: 'fa-solid fa-compass' },
    gamer: { name: 'Gamer', desc: 'Play 3 different games', icon: 'fa-solid fa-gamepad' },
    snakemaster: { name: 'Snake Charmer', desc: 'Score 100+ in Snake', icon: 'fa-solid fa-worm' },
    puzzler: { name: 'Puzzler', desc: 'Score 500+ in 2048', icon: 'fa-solid fa-table-cells-large' },
    minesweep: { name: 'Bomb Squad', desc: 'Win Minesweeper', icon: 'fa-solid fa-bomb' },
    memory: { name: 'Elephant', desc: 'Complete Memory in under 12 moves', icon: 'fa-solid fa-brain' },
    checkmate: { name: 'Grandmaster', desc: 'Win a chess game', icon: 'fa-solid fa-chess-king' }
};

const AVATAR_PRESETS = [
    { id: 'falcon', emoji: 'F', label: 'Falcon' },
    { id: 'fox', emoji: 'X', label: 'Fox' },
    { id: 'otter', emoji: 'O', label: 'Otter' },
    { id: 'panda', emoji: 'P', label: 'Panda' },
    { id: 'frog', emoji: 'R', label: 'Frog' },
    { id: 'tiger', emoji: 'T', label: 'Tiger' }
];

const LANG_CODES = {
    spanish: 'es-ES',
    french: 'fr-FR',
    german: 'de-DE',
    italian: 'it-IT',
    portuguese: 'pt-BR',
    japanese: 'ja-JP',
    chinese: 'zh-CN',
    korean: 'ko-KR',
    russian: 'ru-RU',
    arabic: 'ar-SA',
    hindi: 'hi-IN',
    dutch: 'nl-NL'
};

const LANGUAGE_SUBJECTS = new Set(Object.keys(LANG_CODES));

// Catalog + lazy course packs (replaces the old inline lingo-data.js globals).
// categories is filled from content/catalog.json; questions caches loaded packs.
let categories = {};
const questions = {};
const PACK_CACHE = {};

const PROFILE_KEY = 'lingo.profile';
const PROGRESS_KEY = 'lingo.progress';
const SRS_KEY = 'lingo.srs';

function setAuthCookie() {
    document.cookie = 'lingo_authed=1; path=/; max-age=' + (60 * 60 * 24 * 30) + '; SameSite=Strict';
}
function clearAuthCookie() {
    document.cookie = 'lingo_authed=; path=/; max-age=0';
}

const SUPABASE_URL = 'https://tjsxsqlxjmanwvmywwvw.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqc3hzcWx4am1hbnd2bXl3d3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTc0MDEsImV4cCI6MjA4NjA3MzQwMX0.LphLfho3wdQC20MhtcnBpzQUNuBoTOobrugQbNGxc68';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

let currentUser = null;

const DEFAULT_PROGRESS = {
    xp: 0,
    streak: 0,
    hearts: 5,
    completed_subjects: [],
    lessons_completed: {},
    trophy_ids: [],
    last_played: ''
};

let recognition = null;
let isListening = false;
let selectedAuthAvatar = AVATAR_PRESETS[0].id;

let localProfile = null;

let gameState = {
    selectedCategory: 'languages',
    selectedSubject: null,
    currentQuestion: 0,
    totalQuestions: 10,
    correctAnswers: 0,
    xp: 0,
    streak: 0,
    hearts: 5,
    currentAnswer: null,
    answerWords: [],
    lessonQuestions: [],
    currentQuestionData: null,
    completedSubjects: [],
    selectedLesson: null
};

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    setupEventListeners();
    setupKeyboardNav();
    setupTouchGestures();
    renderAvatarPicker('authAvatarPicker', selectedAuthAvatar, (avatarId) => {
        selectedAuthAvatar = avatarId;
    });
    initSpeechRecognition();
    updateStats();
    await loadCatalog();
    renderSubjects('languages');
    initializeApp();
});

// Fetch the course catalog (course metadata only, not lesson content).
async function loadCatalog() {
    try {
        const res = await fetch('content/catalog.json');
        const data = await res.json();
        categories = data.categories || {};
    } catch (_) {
        categories = {};
    }
}

function findSubjectMeta(subjectId) {
    for (const cat of Object.values(categories)) {
        const found = (cat.subjects || []).find((subject) => subject.id === subjectId);
        if (found) return found;
    }
    return null;
}

// Lazily fetch and flatten a course pack into the SRS-ready exercise array.
async function loadCourse(subjectId) {
    if (questions[subjectId]) return questions[subjectId];
    const meta = findSubjectMeta(subjectId);
    const path = meta && meta.packPath ? meta.packPath : `content/courses/${subjectId}.json`;
    let pack;
    try {
        const res = await fetch(path);
        pack = await res.json();
    } catch (_) {
        questions[subjectId] = [];
        return questions[subjectId];
    }
    const flat = [];
    (pack.units || []).forEach((unit) => {
        (unit.lessons || []).forEach((lesson) => {
            (lesson.exercises || []).forEach((exercise) => flat.push(exercise));
        });
    });
    flat.forEach((exercise, index) => {
        if (!exercise.id) exercise.id = `${subjectId}_${index}`;
    });
    questions[subjectId] = flat;
    PACK_CACHE[subjectId] = pack;
    return flat;
}

async function initializeApp() {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        currentUser = session.user;
        setAuthCookie();
        await hydrateFromDb(session.user.id);
    }
    localProfile = loadProfile();
    if (localProfile) {
        syncGameStateFromProgress();
        updateHeaderProfile();
        updateStats();
    }
    updateShellForAuth();
    renderSubjects(gameState.selectedCategory);
}

async function hydrateFromDb(uid) {
    const [{ data: prof }, { data: prog }] = await Promise.all([
        sb.from('lingo_profiles').select('*').eq('id', uid).maybeSingle(),
        sb.from('lingo_progress').select('*').eq('id', uid).maybeSingle(),
    ]);
    if (prof) {
        localStorage.setItem(PROFILE_KEY, JSON.stringify({ display_name: prof.display_name, avatar_id: prof.avatar_id }));
    }
    if (prog) {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify({
            xp: prog.xp, streak: prog.streak, hearts: prog.hearts,
            completed_subjects: prog.completed_subjects,
            lessons_completed: prog.lessons_completed,
            trophy_ids: prog.trophy_ids,
            last_played: prog.last_played || '',
        }));
        if (prog.srs) localStorage.setItem(SRS_KEY, JSON.stringify(prog.srs));
    }
}

function loadProfile() {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
}

function saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    if (currentUser) {
        sb.from('lingo_profiles').upsert({ id: currentUser.id, ...profile }).then(() => {});
    }
}

function loadProgress() {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    try { return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) }; } catch (_) { return { ...DEFAULT_PROGRESS }; }
}

function saveProgress(patch) {
    const current = loadProgress();
    const next = { ...current, ...patch };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    if (currentUser) {
        sb.from('lingo_progress').upsert({
            id: currentUser.id,
            xp: next.xp, streak: next.streak, hearts: next.hearts,
            completed_subjects: next.completed_subjects,
            lessons_completed: next.lessons_completed,
            trophy_ids: next.trophy_ids,
            last_played: next.last_played || null,
            srs: getSrsData(),
            updated_at: new Date().toISOString(),
        }).then(() => {});
    }
}

function syncGameStateFromProgress() {
    const progress = loadProgress();
    gameState.xp = progress.xp;
    gameState.streak = progress.streak;
    gameState.hearts = progress.hearts;
    gameState.completedSubjects = [...progress.completed_subjects];
}

function getUnlockedAchievements() {
    return loadProgress().trophy_ids;
}

function getSrsData() {
    const raw = localStorage.getItem(SRS_KEY);
    if (!raw) return {};
    try { return JSON.parse(raw); } catch (_) { return {}; }
}

function saveSrsData(srs) {
    localStorage.setItem(SRS_KEY, JSON.stringify(srs));
}

function updateSrs(questionId, quality) {
    const srs = getSrsData();
    const card = srs[questionId] || { easiness: 2.5, interval: 1, repetitions: 0, nextReview: new Date().toISOString() };

    if (quality >= 3) {
        if (card.repetitions === 0) card.interval = 1;
        else if (card.repetitions === 1) card.interval = 6;
        else card.interval = Math.round(card.interval * card.easiness);
        card.repetitions += 1;
    } else {
        card.repetitions = 0;
        card.interval = 1;
    }

    card.easiness = Math.max(1.3, card.easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    const next = new Date();
    next.setDate(next.getDate() + card.interval);
    card.nextReview = next.toISOString();
    srs[questionId] = card;
    saveSrsData(srs);
}

function getDueCount(subjectId) {
    const srs = getSrsData();
    const subjectQuestions = questions[subjectId] || [];
    const now = new Date();
    return subjectQuestions.filter((question) => {
        const card = srs[question.id];
        return card && new Date(card.nextReview) <= now;
    }).length;
}

function getQuestionsForLesson(subjectId, subset) {
    // When a skill-tree lesson is chosen, play exactly its exercises; otherwise
    // draw from the whole subject (review mode), due cards first.
    if (Array.isArray(subset)) {
        const ordered = [...subset];
        shuffle(ordered);
        return ordered;
    }
    const subjectQuestions = questions[subjectId] || [];
    const srs = getSrsData();
    const now = new Date();
    const due = [];
    const rest = [];

    subjectQuestions.forEach((question) => {
        const card = srs[question.id];
        if (card && new Date(card.nextReview) <= now) due.push(question);
        else rest.push(question);
    });

    shuffle(due);
    shuffle(rest);
    return [...due, ...rest].slice(0, gameState.totalQuestions);
}

function saveAchievement(id) {
    const progress = loadProgress();
    if (progress.trophy_ids.includes(id)) return;
    saveProgress({ trophy_ids: [...progress.trophy_ids, id] });
    showAchievementToast(id);
}

function checkAchievements() {
    const completed = gameState.completedSubjects;
    const unlocked = getUnlockedAchievements();

    if (completed.length > 0 && !unlocked.includes('firstLesson')) saveAchievement('firstLesson');
    if (gameState.streak >= 3 && !unlocked.includes('streak3')) saveAchievement('streak3');
    if (gameState.streak >= 7 && !unlocked.includes('streak7')) saveAchievement('streak7');
    if (gameState.streak >= 30 && !unlocked.includes('streak30')) saveAchievement('streak30');
    if (gameState.xp >= 100 && !unlocked.includes('xp100')) saveAchievement('xp100');
    if (gameState.xp >= 500 && !unlocked.includes('xp500')) saveAchievement('xp500');
    if (gameState.xp >= 1000 && !unlocked.includes('xp1000')) saveAchievement('xp1000');

    const langSubjects = completed.filter((subjectId) => LANGUAGE_SUBJECTS.has(subjectId));
    if (langSubjects.length >= 3 && !unlocked.includes('polyglot')) saveAchievement('polyglot');

    const mathIds = categories.math.subjects.map((subject) => subject.id);
    if (mathIds.every((id) => completed.includes(id)) && !unlocked.includes('mathWiz')) saveAchievement('mathWiz');
    if (completed.length >= 10 && !unlocked.includes('explorer')) saveAchievement('explorer');
}

function showAchievementToast(id) {
    const trophy = TROPHIES[id];
    if (!trophy) return;
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.setAttribute('role', 'alert');
    const iconDiv = document.createElement('div');
    iconDiv.className = 'achievement-toast-icon';
    const iconEl = document.createElement('i');
    iconEl.className = trophy.icon;
    iconDiv.appendChild(iconEl);
    const contentDiv = document.createElement('div');
    contentDiv.className = 'achievement-toast-content';
    const titleDiv = document.createElement('div');
    titleDiv.className = 'achievement-toast-title';
    titleDiv.textContent = 'Trophy unlocked';
    const nameDiv = document.createElement('div');
    nameDiv.className = 'achievement-toast-name';
    nameDiv.textContent = trophy.name;
    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(nameDiv);
    toast.appendChild(iconDiv);
    toast.appendChild(contentDiv);
    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function renderAchievementPanel() {
    const unlocked = getUnlockedAchievements();
    const panel = document.getElementById('achievementPanel');
    panel.textContent = '';

    const header = document.createElement('div');
    header.className = 'achievement-panel-header';
    const h2 = document.createElement('h2');
    h2.textContent = 'Trophies';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn achievement-close';
    closeBtn.id = 'closeTrophiesBtn';
    closeBtn.setAttribute('aria-label', 'Close trophies');
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    header.appendChild(h2);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    const list = document.createElement('div');
    list.className = 'achievement-list';
    Object.entries(TROPHIES).forEach(([id, trophy]) => {
        const item = document.createElement('div');
        item.className = 'achievement-item ' + (unlocked.includes(id) ? 'unlocked' : 'locked');
        const iconDiv = document.createElement('div');
        iconDiv.className = 'achievement-icon';
        const iconEl = document.createElement('i');
        iconEl.className = trophy.icon;
        iconDiv.appendChild(iconEl);
        const info = document.createElement('div');
        info.className = 'achievement-info';
        const name = document.createElement('div');
        name.className = 'achievement-name';
        name.textContent = trophy.name;
        const desc = document.createElement('div');
        desc.className = 'achievement-desc';
        desc.textContent = trophy.desc;
        info.appendChild(name);
        info.appendChild(desc);
        item.appendChild(iconDiv);
        item.appendChild(info);
        if (unlocked.includes(id)) {
            const check = document.createElement('i');
            check.className = 'fa-solid fa-check achievement-check';
            item.appendChild(check);
        }
        list.appendChild(item);
    });
    panel.appendChild(list);

    panel.classList.add('active');
    trapFocus(panel);
    document.getElementById('closeTrophiesBtn').addEventListener('click', () => panel.classList.remove('active'));
}

function renderProfilePanel() {
    if (!localProfile) return;

    const panel = document.getElementById('profilePanel');
    const avatar = getAvatarById(localProfile.avatar_id);
    panel.textContent = '';

    const panelHeader = document.createElement('div');
    panelHeader.className = 'profile-panel-header';
    const headerLeft = document.createElement('div');
    const kicker = document.createElement('div');
    kicker.className = 'profile-panel-kicker';
    kicker.textContent = 'Profile';
    const h2 = document.createElement('h2');
    h2.textContent = localProfile.display_name;
    headerLeft.appendChild(kicker);
    headerLeft.appendChild(h2);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn achievement-close';
    closeBtn.id = 'closeProfileBtn';
    closeBtn.setAttribute('aria-label', 'Close profile');
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    panelHeader.appendChild(headerLeft);
    panelHeader.appendChild(closeBtn);
    panel.appendChild(panelHeader);

    const summary = document.createElement('div');
    summary.className = 'profile-summary';
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'profile-summary-avatar';
    avatarDiv.textContent = avatar.emoji;
    const summaryInfo = document.createElement('div');
    summaryInfo.className = 'profile-summary-copy';
    const summaryName = document.createElement('div');
    summaryName.className = 'profile-summary-name';
    summaryName.textContent = localProfile.display_name;
    const summaryMeta = document.createElement('div');
    summaryMeta.className = 'profile-summary-meta';
    summaryMeta.textContent = currentUser ? currentUser.email : 'Local profile';
    summaryInfo.appendChild(summaryName);
    summaryInfo.appendChild(summaryMeta);
    summary.appendChild(avatarDiv);
    summary.appendChild(summaryInfo);
    panel.appendChild(summary);

    const form = document.createElement('form');
    form.className = 'profile-form';
    form.id = 'profileForm';

    const nameLabel = document.createElement('label');
    nameLabel.className = 'auth-field';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = 'Display name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'profileDisplayName';
    nameInput.value = localProfile.display_name;
    nameInput.maxLength = 50;
    nameInput.required = true;
    nameLabel.appendChild(nameSpan);
    nameLabel.appendChild(nameInput);
    form.appendChild(nameLabel);

    const avatarPickerDiv = document.createElement('div');
    avatarPickerDiv.className = 'avatar-picker';
    avatarPickerDiv.id = 'profileAvatarPicker';
    form.appendChild(avatarPickerDiv);

    const statsGrid = document.createElement('div');
    statsGrid.className = 'profile-stats-grid';
    [
        [gameState.xp, 'Total XP'],
        [gameState.streak, 'Day streak'],
        [gameState.completedSubjects.length, 'Courses tried'],
        [getUnlockedAchievements().length, 'Trophies']
    ].forEach(([val, label]) => {
        const stat = document.createElement('div');
        stat.className = 'profile-stat';
        const strong = document.createElement('strong');
        strong.textContent = val;
        const span = document.createElement('span');
        span.textContent = label;
        stat.appendChild(strong);
        stat.appendChild(span);
        statsGrid.appendChild(stat);
    });
    form.appendChild(statsGrid);

    const schoolLink = document.createElement('a');
    schoolLink.href = 'school/index.html';
    schoolLink.className = 'btn';
    schoolLink.style.display = 'block';
    schoolLink.style.textAlign = 'center';
    schoolLink.style.marginBottom = '12px';
    schoolLink.textContent = 'School dashboard';
    form.appendChild(schoolLink);

    const actions = document.createElement('div');
    actions.className = 'profile-actions';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.type = 'submit';
    saveBtn.textContent = 'Save profile';
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn';
    resetBtn.type = 'button';
    resetBtn.id = 'resetProfileBtn';
    resetBtn.textContent = 'Reset progress';
    const signOutBtn = document.createElement('button');
    signOutBtn.className = 'btn';
    signOutBtn.type = 'button';
    signOutBtn.id = 'signOutBtn';
    signOutBtn.textContent = 'Sign out';
    signOutBtn.style.display = currentUser ? '' : 'none';
    actions.appendChild(saveBtn);
    actions.appendChild(resetBtn);
    actions.appendChild(signOutBtn);
    form.appendChild(actions);

    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'auth-feedback';
    feedbackDiv.id = 'profileFeedback';
    feedbackDiv.setAttribute('aria-live', 'polite');
    form.appendChild(feedbackDiv);

    panel.appendChild(form);

    let selectedAvatar = localProfile.avatar_id;
    renderAvatarPicker('profileAvatarPicker', selectedAvatar, (avatarId) => {
        selectedAvatar = avatarId;
    });

    panel.classList.add('active');
    trapFocus(panel);

    document.getElementById('closeProfileBtn').addEventListener('click', () => panel.classList.remove('active'));
    document.getElementById('resetProfileBtn').addEventListener('click', async () => {
        if (confirm('Reset all progress? This cannot be undone.')) {
            localStorage.removeItem(PROGRESS_KEY);
            localStorage.removeItem(SRS_KEY);
            if (currentUser) {
                await sb.from('lingo_progress').upsert({ id: currentUser.id, ...DEFAULT_PROGRESS, srs: {} });
            }
            gameState.xp = 0;
            gameState.streak = 0;
            gameState.hearts = 5;
            gameState.completedSubjects = [];
            updateHeaderProfile();
            updateStats();
            panel.classList.remove('active');
        }
    });
    document.getElementById('signOutBtn').addEventListener('click', async () => {
        await sb.auth.signOut();
        clearAuthCookie();
        currentUser = null;
        localProfile = null;
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem(PROGRESS_KEY);
        localStorage.removeItem(SRS_KEY);
        gameState.xp = 0;
        gameState.streak = 0;
        gameState.hearts = 5;
        gameState.completedSubjects = [];
        updateHeaderProfile();
        updateStats();
        panel.classList.remove('active');
        updateShellForAuth();
    });
    document.getElementById('profileForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const feedback = document.getElementById('profileFeedback');
        localProfile.display_name = document.getElementById('profileDisplayName').value.trim();
        localProfile.avatar_id = selectedAvatar;
        saveProfile(localProfile);
        updateHeaderProfile();
        feedback.textContent = 'Profile saved.';
        feedback.className = 'auth-feedback success';
    });
}

function setupEventListeners() {
    document.querySelectorAll('.category-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach((item) => item.classList.remove('active'));
            tab.classList.add('active');
            gameState.selectedCategory = tab.dataset.category;
            renderSubjects(gameState.selectedCategory);
        });
    });

    document.getElementById('treeBackBtn').addEventListener('click', resetToHome);
    document.getElementById('checkBtn').addEventListener('click', checkAnswer);
    document.getElementById('skipBtn').addEventListener('click', skipQuestion);
    document.getElementById('continueBtn').addEventListener('click', continueLearning);
    document.getElementById('achievementBtn').addEventListener('click', renderAchievementPanel);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('profileBtn').addEventListener('click', () => {
        if (localProfile) {
            renderProfilePanel();
        } else {
            const dialog = document.getElementById('authShell');
            dialog.showModal();
            setTimeout(() => document.getElementById('signinEmail')?.focus(), 100);
        }
    });
    document.getElementById('authCloseBtn').addEventListener('click', () => {
        document.getElementById('authShell').close();
    });

    // Auth tab switching
    document.getElementById('tabSignup').addEventListener('click', () => {
        document.getElementById('formSignup').style.display = '';
        document.getElementById('formSignin').style.display = 'none';
        document.getElementById('tabSignup').classList.add('active');
        document.getElementById('tabSignin').classList.remove('active');
    });
    document.getElementById('tabSignin').addEventListener('click', () => {
        document.getElementById('formSignin').style.display = '';
        document.getElementById('formSignup').style.display = 'none';
        document.getElementById('tabSignin').classList.add('active');
        document.getElementById('tabSignup').classList.remove('active');
    });

    document.getElementById('formSignup').addEventListener('submit', async (event) => {
        event.preventDefault();
        const feedback = document.getElementById('authFeedback');
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        if (!name || !email || !password) return;
        feedback.textContent = 'Creating account…';
        feedback.className = 'auth-feedback';
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) { feedback.textContent = error.message; feedback.className = 'auth-feedback error'; return; }
        currentUser = data.user;
        setAuthCookie();
        const profile = { display_name: name, avatar_id: selectedAuthAvatar };
        await sb.from('lingo_profiles').upsert({ id: currentUser.id, ...profile });
        await sb.from('lingo_progress').upsert({ id: currentUser.id, ...DEFAULT_PROGRESS });
        localProfile = profile;
        saveProfile(profile);
        updateHeaderProfile();
        updateStats();
        updateShellForAuth();
        renderSubjects(gameState.selectedCategory);
    });

    document.getElementById('formSignin').addEventListener('submit', async (event) => {
        event.preventDefault();
        const feedback = document.getElementById('authFeedback');
        const email = document.getElementById('signinEmail').value.trim();
        const password = document.getElementById('signinPassword').value;
        feedback.textContent = 'Signing in…';
        feedback.className = 'auth-feedback';
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) { feedback.textContent = error.message; feedback.className = 'auth-feedback error'; return; }
        currentUser = data.user;
        setAuthCookie();
        await hydrateFromDb(currentUser.id);
        localProfile = loadProfile();
        syncGameStateFromProgress();
        updateHeaderProfile();
        updateStats();
        updateShellForAuth();
        renderSubjects(gameState.selectedCategory);
    });
}

function updateShellForAuth() {
    const dialog = document.getElementById('authShell');
    if (localProfile && dialog.open) dialog.close();
}

function getAvatarById(id) {
    return AVATAR_PRESETS.find((avatar) => avatar.id === id) || AVATAR_PRESETS[0];
}

function updateHeaderProfile() {
    const label = localProfile ? localProfile.display_name : 'Start';
    const avatar = getAvatarById(localProfile ? localProfile.avatar_id : null);
    document.getElementById('profileName').textContent = label;
    const chip = document.getElementById('profileAvatar');
    const avId = localProfile ? localProfile.avatar_id : null;
    if (isDataAvatar(avId)) {
        chip.textContent = '';
        chip.style.backgroundImage = `url("${avId}")`;
        chip.style.backgroundSize = 'cover';
    } else {
        chip.style.backgroundImage = '';
        chip.textContent = avatar.emoji;
    }
}


function generatePixelArtSVG() {
    const palettes = [
        ['#e63946','#457b9d','#1d3557'],
        ['#7b2d8b','#c77dff','#e0aaff'],
        ['#0077b6','#00b4d8','#90e0ef'],
        ['#d62828','#f77f00','#fcbf49'],
        ['#2d6a4f','#52b788','#b7e4c7']
    ];
    const bgs = ['#111','#0d0d0d','#1a1a1a','#0f0f1a','#0a1a0a'];
    const palette = palettes[Math.floor(Math.random() * palettes.length)];
    const bg = bgs[Math.floor(Math.random() * bgs.length)];
    const px = 8, size = 8, total = size * px;
    const grid = Array.from({length: size}, () =>
        Array.from({length: Math.ceil(size / 2)}, () =>
            Math.random() > 0.45 ? Math.floor(Math.random() * 3) : -1
        )
    );
    let rects = '';
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const ci = grid[row][col < size / 2 ? col : size - 1 - col];
            if (ci >= 0) rects += `<rect x="${col*px}" y="${row*px}" width="${px}" height="${px}" fill="${palette[ci]}"/>`;
        }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="${bg}"/>${rects}</svg>`;
}

function svgDataUri(svg) {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

function isDataAvatar(id) {
    return typeof id === 'string' && id.startsWith('data:');
}

function renderAvatarPicker(containerId, selectedId, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.textContent = '';
    let current = isDataAvatar(selectedId) ? selectedId : svgDataUri(generatePixelArtSVG());
    onSelect(current);
    const img = document.createElement('img');
    img.src = current;
    img.alt = 'Avatar — tap to generate a new one';
    img.title = 'Tap to generate a new avatar';
    img.style.cssText = 'width:56px;height:56px;border-radius:12px;cursor:pointer;display:block;';
    img.addEventListener('click', () => {
        current = svgDataUri(generatePixelArtSVG());
        img.src = current;
        onSelect(current);
    });
    const upload = document.createElement('button');
    upload.type = 'button';
    upload.className = 'avatar-option';
    upload.textContent = 'Upload';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.hidden = true;
    upload.addEventListener('click', () => file.click());
    file.addEventListener('change', () => {
        const f = file.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
            const im = new Image();
            im.onload = () => {
                const c = document.createElement('canvas');
                c.width = c.height = 64;
                const sq = Math.min(im.width, im.height);
                c.getContext('2d').drawImage(im, (im.width - sq) / 2, (im.height - sq) / 2, sq, sq, 0, 0, 64, 64);
                current = c.toDataURL('image/jpeg', 0.85);
                img.src = current;
                onSelect(current);
            };
            im.src = reader.result;
        };
        reader.readAsDataURL(f);
    });
    container.append(img, upload, file);
}

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    return recognition;
}

function startListening(langCode, callback) {
    if (!recognition) return;
    recognition.lang = langCode;
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        isListening = false;
        callback(transcript);
        updateMicButton(false);
    };
    recognition.onerror = recognition.onend = () => {
        isListening = false;
        updateMicButton(false);
    };
    isListening = true;
    updateMicButton(true);
    recognition.start();
}

function updateMicButton(active) {
    const button = document.getElementById('micBtn');
    if (button) button.classList.toggle('listening', active);
}

function trapFocus(element) {
    const focusable = element.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first.focus();
    element._trapHandler = (event) => {
        if (event.key === 'Tab') {
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
        if (event.key === 'Escape') {
            element.classList.remove('active');
            element.removeEventListener('keydown', element._trapHandler);
        }
    };
    element.addEventListener('keydown', element._trapHandler);
}

function initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeColor(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeColor(next);
}

function updateThemeColor(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#111' : '#fafafa');
}

function setupKeyboardNav() {
    document.addEventListener('keydown', (event) => {
        const lesson = document.getElementById('lessonContainer');
        const result = document.getElementById('resultContainer');
        if (lesson.classList.contains('active')) {
            if (event.key === 'Enter' || (event.key === ' ' && event.target.tagName !== 'INPUT')) {
                event.preventDefault();
                const button = document.getElementById('checkBtn');
                if (!button.disabled) button.click();
            }
            if (['1', '2', '3', '4'].includes(event.key)) {
                const choices = document.querySelectorAll('.choice-btn');
                const index = parseInt(event.key, 10) - 1;
                if (choices[index]) {
                    choices[index].click();
                    choices[index].focus();
                }
            }
            if (event.key === 'Escape') resetToHome();
        }
        if (result.classList.contains('active')) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                document.getElementById('continueBtn').click();
            }
            if (event.key === 'Escape') resetToHome();
        }
    });
}

function setupTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    document.addEventListener('touchstart', (event) => {
        touchStartX = event.changedTouches[0].screenX;
        touchStartY = event.changedTouches[0].screenY;
    }, { passive: true });
    document.addEventListener('touchend', (event) => {
        const dx = event.changedTouches[0].screenX - touchStartX;
        const dy = event.changedTouches[0].screenY - touchStartY;
        if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            const result = document.getElementById('resultContainer');
            if (result.classList.contains('active')) {
                if (dx > 0) resetToHome();
                else continueLearning();
            }
        }
    }, { passive: true });
    document.addEventListener('click', (event) => {
        const target = event.target.closest('.btn, .choice-btn, .subject-card, .word-chip, .avatar-option, .profile-chip');
        if (!target) return;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = target.getBoundingClientRect();
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        target.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
    });
}

function renderSubjects(category) {
    if (isGameCategory(category)) {
        document.getElementById('categoryTitle').textContent = 'Choose a game';
        const grid = document.getElementById('subjectGrid');
        grid.textContent = '';
        Object.entries(GAMES_REGISTRY).forEach(([id, game]) => {
            const card = document.createElement('div');
            card.className = 'subject-card';
            card.dataset.subject = id;
            card.dataset.game = 'true';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', game.name);
            const iconDiv = document.createElement('div');
            iconDiv.className = 'subject-icon';
            const iconEl = document.createElement('i');
            iconEl.className = game.icon;
            iconEl.setAttribute('aria-hidden', 'true');
            iconDiv.appendChild(iconEl);
            const nameDiv = document.createElement('div');
            nameDiv.className = 'subject-name';
            nameDiv.textContent = game.name;
            const levelDiv = document.createElement('div');
            levelDiv.className = 'subject-level';
            levelDiv.textContent = game.level;
            card.appendChild(iconDiv);
            card.appendChild(nameDiv);
            card.appendChild(levelDiv);
            card.addEventListener('click', () => selectSubject(card));
            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectSubject(card); }
            });
            grid.appendChild(card);
        });
        return;
    }
    const categoryData = categories[category];
    if (!categoryData) return;
    document.getElementById('categoryTitle').textContent = categoryData.title;
    const grid = document.getElementById('subjectGrid');
    grid.textContent = '';
    categoryData.subjects.forEach((subject) => {
        const dueCount = getDueCount(subject.id);
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.dataset.subject = subject.id;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', subject.name);
        const iconDiv = document.createElement('div');
        iconDiv.className = 'subject-icon';
        const iconEl = document.createElement('i');
        iconEl.className = subject.icon;
        iconEl.setAttribute('aria-hidden', 'true');
        iconDiv.appendChild(iconEl);
        const nameDiv = document.createElement('div');
        nameDiv.className = 'subject-name';
        nameDiv.textContent = subject.name;
        const levelDiv = document.createElement('div');
        levelDiv.className = 'subject-level';
        levelDiv.textContent = subject.level;
        card.appendChild(iconDiv);
        card.appendChild(nameDiv);
        card.appendChild(levelDiv);
        if (dueCount > 0) {
            const badge = document.createElement('div');
            badge.className = 'review-badge';
            badge.textContent = dueCount + ' due';
            card.appendChild(badge);
        }
        card.addEventListener('click', () => selectSubject(card));
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectSubject(card);
            }
        });
        grid.appendChild(card);
    });
}

function selectSubject(card) {
    if (!localProfile) {
        document.getElementById('authShell').showModal();
        return;
    }
    document.querySelectorAll('.subject-card').forEach((subjectCard) => subjectCard.classList.remove('selected'));
    card.classList.add('selected');
    gameState.selectedSubject = card.dataset.subject;
    if (card.dataset.game === 'true') {
        setTimeout(() => startGame(card.dataset.subject), 300);
    } else {
        setTimeout(() => showSkillTree(card.dataset.subject), 300);
    }
}

// Ordered list of every lesson in a course (units flattened), with unit titles.
function getLessonOrder(pack) {
    const order = [];
    (pack.units || []).forEach((unit) => {
        (unit.lessons || []).forEach((lesson) => {
            order.push({ unitId: unit.id, unitTitle: unit.title, lesson });
        });
    });
    return order;
}

function lessonKey(subjectId, lessonId) {
    return `${subjectId}/${lessonId}`;
}

function isLessonComplete(subjectId, lessonId) {
    return Boolean(loadProgress().lessons_completed[lessonKey(subjectId, lessonId)]);
}

// A lesson unlocks when it is first in the course or the previous lesson is done.
function isLessonUnlocked(subjectId, order, index) {
    if (index === 0) return true;
    return isLessonComplete(subjectId, order[index - 1].lesson.id);
}

function makeIcon(faClass) {
    const icon = document.createElement('i');
    icon.className = faClass;
    icon.setAttribute('aria-hidden', 'true');
    return icon;
}

async function showSkillTree(subjectId) {
    gameState.selectedSubject = subjectId;
    await loadCourse(subjectId);
    const pack = PACK_CACHE[subjectId];
    if (!pack) { startLesson(); return; }
    document.getElementById('subjectSelection').style.display = 'none';
    document.getElementById('resultContainer').classList.remove('active');
    document.getElementById('lessonContainer').classList.remove('active');
    document.getElementById('skillTree').classList.add('active');
    renderSkillTree(pack);
}

function renderSkillTree(pack) {
    const meta = findSubjectMeta(pack.id) || {};
    const treeIcon = document.getElementById('treeIcon');
    treeIcon.textContent = '';
    treeIcon.appendChild(makeIcon(meta.icon || pack.icon || 'fa-solid fa-book'));
    document.getElementById('treeTitle').textContent = pack.name;
    const order = getLessonOrder(pack);
    const done = order.filter((entry) => isLessonComplete(pack.id, entry.lesson.id)).length;
    document.getElementById('treeSub').textContent = `${done} / ${order.length} lessons complete`;

    const host = document.getElementById('treeUnits');
    host.textContent = '';
    let flatIndex = 0;
    (pack.units || []).forEach((unit) => {
        const unitEl = document.createElement('div');
        unitEl.className = 'tree-unit';
        const heading = document.createElement('div');
        heading.className = 'tree-unit-title';
        heading.textContent = unit.title;
        unitEl.appendChild(heading);

        (unit.lessons || []).forEach((lesson) => {
            const index = flatIndex;
            flatIndex += 1;
            const complete = isLessonComplete(pack.id, lesson.id);
            const unlocked = isLessonUnlocked(pack.id, order, index);
            const node = document.createElement('button');
            node.className = 'tree-node' + (complete ? ' complete' : '') + (unlocked ? '' : ' locked');
            node.disabled = !unlocked;
            node.setAttribute('aria-label', `${lesson.title}${complete ? ', complete' : unlocked ? '' : ', locked'}`);
            const dot = document.createElement('span');
            dot.className = 'tree-node-dot';
            dot.appendChild(makeIcon(complete ? 'fa-solid fa-crown' : unlocked ? 'fa-solid fa-play' : 'fa-solid fa-lock'));
            const label = document.createElement('span');
            label.className = 'tree-node-label';
            label.textContent = lesson.title;
            node.appendChild(dot);
            node.appendChild(label);
            if (unlocked) node.addEventListener('click', () => startLesson(lesson.id));
            unitEl.appendChild(node);
        });
        host.appendChild(unitEl);
    });
}

function resetToHome() {
    document.getElementById('lessonContainer').classList.remove('active');
    document.getElementById('resultContainer').classList.remove('active');
    document.getElementById('skillTree').classList.remove('active');
    document.getElementById('subjectSelection').style.display = 'block';
    gameState.selectedLesson = null;
    document.querySelectorAll('.subject-card').forEach((card) => card.classList.remove('selected'));
    renderSubjects(gameState.selectedCategory);
}

// Speak text aloud with the course's language voice (real audio, no asset files).
function speak(text, lang) {
    if (!text || !('speechSynthesis' in window)) return;
    try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        if (lang) utter.lang = lang;
        utter.rate = 0.9;
        window.speechSynthesis.speak(utter);
    } catch (_) { /* TTS unavailable */ }
}

function currentLang() {
    const meta = findSubjectMeta(gameState.selectedSubject);
    return (meta && meta.lang) || LANG_CODES[gameState.selectedSubject] || 'en-US';
}

async function startLesson(lessonId) {
    gameState.selectedLesson = lessonId || null;
    document.getElementById('subjectSelection').style.display = 'none';
    document.getElementById('skillTree').classList.remove('active');
    document.getElementById('lessonContainer').classList.add('active');
    gameState.currentQuestion = 0;
    gameState.correctAnswers = 0;
    gameState.hearts = 5;
    await loadCourse(gameState.selectedSubject);
    const subset = lessonId ? getLessonExercises(gameState.selectedSubject, lessonId) : null;
    gameState.lessonQuestions = getQuestionsForLesson(gameState.selectedSubject, subset);
    gameState.totalQuestions = gameState.lessonQuestions.length || 10;
    updateStats();
    loadQuestion();
}

// Pull a single lesson's exercises (stamped with ids) from a cached pack.
function getLessonExercises(subjectId, lessonId) {
    const pack = PACK_CACHE[subjectId];
    if (!pack) return [];
    for (const unit of pack.units || []) {
        const lesson = (unit.lessons || []).find((entry) => entry.id === lessonId);
        if (lesson) return lesson.exercises;
    }
    return [];
}

function loadQuestion() {
    const question = gameState.lessonQuestions[gameState.currentQuestion];
    if (!question) {
        showResults();
        return;
    }
    const progress = (gameState.currentQuestion / gameState.totalQuestions) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressLabel').textContent = `${gameState.currentQuestion} / ${gameState.totalQuestions}`;
    const feedback = document.getElementById('feedback');
    feedback.classList.remove('show', 'correct', 'incorrect');
    feedback.textContent = '';
    gameState.currentAnswer = null;
    gameState.answerWords = [];
    const button = document.getElementById('checkBtn');
    button.textContent = 'Check';
    button.onclick = checkAnswer;
    button.disabled = false;
    renderQuestion(question);
}

function renderQuestion(question) {
    const container = document.getElementById('questionContainer');
    container.textContent = '';
    const isLanguage = LANGUAGE_SUBJECTS.has(gameState.selectedSubject);
    const hasSpeech = recognition && isLanguage;

    const typeDiv = document.createElement('div');
    typeDiv.className = 'question-type';

    if (question.type === 'translation' || question.type === 'mathChoice') {
        typeDiv.textContent = question.type === 'mathChoice' ? 'Choose the correct answer' : 'Select the correct translation';
        container.appendChild(typeDiv);

        const questionText = document.createElement('div');
        questionText.className = 'question-text';
        questionText.textContent = question.question;
        container.appendChild(questionText);

        if (hasSpeech && question.type === 'translation') {
            const micBtn = document.createElement('button');
            micBtn.className = 'mic-btn';
            micBtn.id = 'micBtn';
            micBtn.setAttribute('aria-label', 'Speak your answer');
            micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            container.appendChild(micBtn);
        }

        const choicesDiv = document.createElement('div');
        choicesDiv.className = 'choices-container';
        choicesDiv.setAttribute('role', 'radiogroup');
        question.choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.dataset.choice = choice;
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-checked', 'false');
            btn.setAttribute('tabindex', index === 0 ? '0' : '-1');
            btn.textContent = choice;
            btn.addEventListener('click', () => selectChoice(btn));
            choicesDiv.appendChild(btn);
        });
        container.appendChild(choicesDiv);

        if (hasSpeech && question.type === 'translation') {
            const micBtn = document.getElementById('micBtn');
            if (micBtn) {
                micBtn.addEventListener('click', () => {
                    if (isListening) { recognition.stop(); return; }
                    startListening(LANG_CODES[gameState.selectedSubject] || 'en-US', (transcript) => {
                        const normalized = transcript.toLowerCase().trim();
                        const btn = [...container.querySelectorAll('.choice-btn')].find((b) => b.dataset.choice.toLowerCase() === normalized);
                        if (btn) selectChoice(btn);
                    });
                });
            }
        }
    } else if (question.type === 'sentence') {
        typeDiv.textContent = 'Translate this sentence';
        container.appendChild(typeDiv);

        const questionText = document.createElement('div');
        questionText.className = 'question-text';
        questionText.textContent = question.question;
        container.appendChild(questionText);

        if (hasSpeech) {
            const micBtn = document.createElement('button');
            micBtn.className = 'mic-btn';
            micBtn.id = 'micBtn';
            micBtn.setAttribute('aria-label', 'Speak your answer');
            micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            container.appendChild(micBtn);
        }

        const answerBox = document.createElement('div');
        answerBox.className = 'answer-box';
        answerBox.id = 'answerBox';
        answerBox.setAttribute('aria-live', 'polite');
        container.appendChild(answerBox);

        const wordBank = document.createElement('div');
        wordBank.className = 'word-bank';
        question.words.forEach((word) => {
            const chip = document.createElement('div');
            chip.className = 'word-chip';
            chip.dataset.word = word;
            chip.setAttribute('role', 'button');
            chip.setAttribute('tabindex', '0');
            chip.textContent = word;
            chip.addEventListener('click', () => toggleWord(chip));
            chip.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleWord(chip); }
            });
            wordBank.appendChild(chip);
        });
        container.appendChild(wordBank);

        if (hasSpeech) {
            const micBtn = document.getElementById('micBtn');
            if (micBtn) {
                micBtn.addEventListener('click', () => {
                    if (isListening) { recognition.stop(); return; }
                    startListening(LANG_CODES[gameState.selectedSubject] || 'en-US', (transcript) => {
                        const words = transcript.toLowerCase().split(/\s+/);
                        words.forEach((word) => {
                            const chip = [...container.querySelectorAll('.word-chip:not(.used)')].find((c) => c.dataset.word.toLowerCase() === word);
                            if (chip) toggleWord(chip);
                        });
                    });
                });
            }
        }
    } else if (question.type === 'listening') {
        typeDiv.textContent = 'Type what you hear';
        container.appendChild(typeDiv);

        const questionText = document.createElement('div');
        questionText.className = 'question-text';
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-volume-high';
        icon.style.marginRight = '0.5rem';
        icon.style.opacity = '0.5';
        icon.setAttribute('aria-hidden', 'true');
        questionText.appendChild(icon);
        const replayBtn = document.createElement('button');
        replayBtn.type = 'button';
        replayBtn.className = 'btn tts-btn';
        replayBtn.setAttribute('aria-label', 'Play audio');
        replayBtn.appendChild(makeIcon('fa-solid fa-volume-high'));
        replayBtn.appendChild(document.createTextNode(' Play'));
        replayBtn.addEventListener('click', () => speak(question.audio || question.answer, currentLang()));
        questionText.appendChild(replayBtn);
        container.appendChild(questionText);
        speak(question.audio || question.answer, currentLang());

        if (hasSpeech) {
            const micBtn = document.createElement('button');
            micBtn.className = 'mic-btn';
            micBtn.id = 'micBtn';
            micBtn.setAttribute('aria-label', 'Speak your answer');
            micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            container.appendChild(micBtn);
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'translation-input';
        input.id = 'listeningInput';
        input.placeholder = 'Type your answer here...';
        input.setAttribute('aria-label', 'Your answer');
        container.appendChild(input);
        setTimeout(() => input.focus(), 100);

        if (hasSpeech) {
            const micBtn = document.getElementById('micBtn');
            if (micBtn) {
                micBtn.addEventListener('click', () => {
                    if (isListening) { recognition.stop(); return; }
                    startListening(LANG_CODES[gameState.selectedSubject] || 'en-US', (transcript) => {
                        document.getElementById('listeningInput').value = transcript;
                    });
                });
            }
        }
    } else if (question.type === 'math') {
        typeDiv.textContent = 'Solve the problem';
        container.appendChild(typeDiv);

        const eq = document.createElement('div');
        eq.className = 'math-equation';
        eq.textContent = question.question;
        container.appendChild(eq);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'math-input';
        input.id = 'mathInput';
        input.placeholder = 'Enter your answer';
        input.setAttribute('aria-label', 'Your answer');
        container.appendChild(input);
        setTimeout(() => input.focus(), 100);
    }

    gameState.currentQuestionData = question;
}

function selectChoice(button) {
    document.querySelectorAll('.choice-btn').forEach((item) => {
        item.classList.remove('selected');
        item.setAttribute('aria-checked', 'false');
    });
    button.classList.add('selected');
    button.setAttribute('aria-checked', 'true');
    gameState.currentAnswer = button.dataset.choice;
}

function toggleWord(chip) {
    const word = chip.dataset.word;
    const answerBox = document.getElementById('answerBox');
    if (chip.classList.contains('used')) {
        chip.classList.remove('used');
        const index = gameState.answerWords.lastIndexOf(word);
        if (index >= 0) gameState.answerWords.splice(index, 1);
    } else {
        chip.classList.add('used');
        gameState.answerWords.push(word);
    }
    answerBox.textContent = '';
    gameState.answerWords.forEach((item) => {
        const chip2 = document.createElement('div');
        chip2.className = 'word-chip';
        chip2.textContent = item;
        answerBox.appendChild(chip2);
    });
    gameState.currentAnswer = gameState.answerWords.join(' ');
}

function checkAnswer() {
    const question = gameState.currentQuestionData;
    let isCorrect = false;

    if (question.type === 'translation' || question.type === 'mathChoice' || question.type === 'sentence') {
        isCorrect = gameState.currentAnswer === question.answer;
    } else if (question.type === 'listening') {
        const input = document.getElementById('listeningInput')?.value.trim();
        isCorrect = input?.toLowerCase() === question.answer.toLowerCase();
    } else if (question.type === 'math') {
        const input = document.getElementById('mathInput')?.value.trim();
        isCorrect = input?.replace(/\s/g, '').toLowerCase() === question.answer.replace(/\s/g, '').toLowerCase();
    }

    if (question.id) updateSrs(question.id, isCorrect ? 5 : 1);

    const feedback = document.getElementById('feedback');
    const questionCard = document.querySelector('.question-card');
    if (isCorrect) {
        feedback.className = 'feedback correct show';
        feedback.textContent = 'Correct.';
        gameState.correctAnswers += 1;
        gameState.xp += 10;
        vibrate(50);
        questionCard.classList.add('correct-anim');
        setTimeout(() => questionCard.classList.remove('correct-anim'), 600);
        const xpStat = document.querySelector('.stat-xp');
        if (xpStat) {
            xpStat.style.position = 'relative';
            const floater = document.createElement('span');
            floater.className = 'xp-float';
            floater.textContent = '+10';
            xpStat.appendChild(floater);
            setTimeout(() => floater.remove(), 1000);
        }
    } else {
        feedback.className = 'feedback incorrect show';
        feedback.textContent = 'Incorrect. The answer is: ';
        const strong = document.createElement('strong');
        strong.textContent = question.answer;
        feedback.appendChild(strong);
        gameState.hearts -= 1;
        vibrate([50, 30, 50]);
        questionCard.classList.add('incorrect-anim');
        setTimeout(() => questionCard.classList.remove('incorrect-anim'), 600);
    }

    updateStats();
    const button = document.getElementById('checkBtn');
    button.textContent = 'Continue';
    button.onclick = nextQuestion;

    if (question.type === 'translation' || question.type === 'mathChoice') {
        document.querySelectorAll('.choice-btn').forEach((item) => {
            item.style.pointerEvents = 'none';
            if (item.dataset.choice === question.answer) item.classList.add('correct');
            else if (item.classList.contains('selected')) item.classList.add('incorrect');
        });
    }

    if (gameState.hearts <= 0) {
        setTimeout(() => showResults(), 1500);
    }
}

function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
}

function spawnConfetti() {
    const colors = ['#3d9e6a', '#d4a843', '#e8e4da', '#8a9e90', '#5a8a6a'];
    for (let index = 0; index < 30; index += 1) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}vw`;
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        piece.style.width = `${Math.random() * 6 + 5}px`;
        piece.style.height = `${Math.random() * 6 + 5}px`;
        piece.style.animationDelay = `${Math.random() * 0.8}s`;
        piece.style.animationDuration = `${Math.random() * 1.5 + 1.5}s`;
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 3000);
    }
}

function skipQuestion() {
    nextQuestion();
}

function nextQuestion() {
    gameState.currentQuestion += 1;
    if (gameState.currentQuestion >= gameState.totalQuestions || gameState.hearts <= 0) {
        showResults();
    } else {
        loadQuestion();
    }
}

function showResults() {
    document.getElementById('lessonContainer').classList.remove('active');
    document.getElementById('resultContainer').classList.add('active');
    document.getElementById('correctCount').textContent = gameState.correctAnswers;
    document.getElementById('xpEarned').textContent = gameState.correctAnswers * 10;

    const progress = loadProgress();
    const today = new Date().toISOString().slice(0, 10);
    if (progress.last_played !== today) {
        if (!progress.last_played) {
            gameState.streak += 1;
        } else {
            const diff = Math.floor((new Date(today) - new Date(progress.last_played)) / (1000 * 60 * 60 * 24));
            gameState.streak = diff > 1 ? 1 : gameState.streak + 1;
        }
    }

    if (gameState.selectedSubject && !gameState.completedSubjects.includes(gameState.selectedSubject)) {
        gameState.completedSubjects.push(gameState.selectedSubject);
    }

    // Crown a skill-tree lesson only when the player survived (hearts remaining).
    const lessonsCompleted = { ...progress.lessons_completed };
    if (gameState.selectedLesson && gameState.hearts > 0) {
        lessonsCompleted[lessonKey(gameState.selectedSubject, gameState.selectedLesson)] = true;
    }

    saveProgress({
        xp: gameState.xp,
        streak: gameState.streak,
        hearts: Math.max(gameState.hearts, 0),
        completed_subjects: [...gameState.completedSubjects],
        lessons_completed: lessonsCompleted,
        last_played: today
    });

    if (gameState.correctAnswers === gameState.totalQuestions) {
        saveAchievement('perfectLesson');
    }
    checkAchievements();

    spawnConfetti();
    updateStats();
    renderSubjects(gameState.selectedCategory);
    setTimeout(() => document.getElementById('continueBtn').focus(), 100);
}

function continueLearning() {
    document.getElementById('resultContainer').classList.remove('active');
    document.getElementById('lessonContainer').classList.remove('active');
    // Came from a skill-tree lesson: return to the tree so the new crown and the
    // next unlocked lesson are visible. Otherwise fall back to subject select.
    const pack = PACK_CACHE[gameState.selectedSubject];
    if (gameState.selectedLesson && pack) {
        gameState.selectedLesson = null;
        document.getElementById('skillTree').classList.add('active');
        renderSkillTree(pack);
        return;
    }
    document.getElementById('subjectSelection').style.display = 'block';
    document.querySelectorAll('.subject-card').forEach((card) => card.classList.remove('selected'));
    renderSubjects(gameState.selectedCategory);
}

function updateStats() {
    document.getElementById('xp').textContent = gameState.xp;
    document.getElementById('streak').textContent = gameState.streak;
    document.getElementById('hearts').textContent = gameState.hearts;
}

function shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
    return items;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

window.resetToHome = resetToHome;
