// ========================================
// APP STATE
// ========================================

const state = {
    currentView: 'whiteboard',
    theme: 'light',
    // Whiteboard
    tool: 'pen',
    isDrawing: false,
    brushColor: '#000000',
    brushSize: 3,
    // Schedule
    currentDate: new Date(),
    events: [],
    selectedEventDate: null,
    // Notes
    notes: [],
    currentNoteId: null,
    noteCategories: [],
    noteFilterCategory: 'all',
    // Ideas
    ideas: [],
    ideaFilter: 'all',
    // Visuals
    visuals: []
};

const NOTE_DEFAULT_CATEGORIES = [
    { id: 'general', label: 'General', color: '#F8E08C', builtIn: true },
    { id: 'idea', label: 'Idea', color: '#F7A6D9', builtIn: true },
    { id: 'research', label: 'Research', color: '#8ED1FC', builtIn: true },
    { id: 'action', label: 'Action', color: '#A7E8B4', builtIn: true },
    { id: 'reference', label: 'Reference', color: '#C8B6FF', builtIn: true }
];

const CATEGORY_ORDER = ['general', 'idea', 'research', 'action', 'reference'];

const CATEGORY_META = {
    general: { label: 'General', color: '#F8E08C' },
    idea: { label: 'Idea', color: '#F7A6D9' },
    research: { label: 'Research', color: '#8ED1FC' },
    action: { label: 'Action', color: '#A7E8B4' },
    reference: { label: 'Reference', color: '#C8B6FF' }
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    initTheme();
    initNavigation();
    initWhiteboard();
    initSchedule();
    initNotes();
    initIdeas();
    initVisuals();
    initThemeToggle();
});

// ========================================
// THEME MANAGEMENT
// ========================================

function initTheme() {
    const savedTheme = localStorage.getItem('whiteboard-theme') || 'light';
    state.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    toggle.addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem('whiteboard-theme', state.theme);
        updateThemeIcon();
    });
}

function updateThemeIcon() {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = state.theme === 'light' ? '🌙' : '☀️';
}

// ========================================
// NAVIGATION
// ========================================

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function switchView(view) {
    state.currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
}

// ========================================
// WHITEBOARD
// ========================================

function initWhiteboard() {
    const canvas = document.getElementById('whiteboard-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    function resizeCanvas() {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        loadCanvas();
    }
    
    // Tool selection
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.tool = btn.dataset.tool;
            document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (state.tool === 'text') {
                canvas.style.cursor = 'text';
            } else if (state.tool === 'eraser') {
                canvas.style.cursor = 'cell';
            } else {
                canvas.style.cursor = 'crosshair';
            }
        });
    });
    
    // Color picker
    const colorPicker = document.getElementById('color-picker');
    colorPicker.addEventListener('input', (e) => {
        state.brushColor = e.target.value;
    });
    
    // Brush size
    const brushSize = document.getElementById('brush-size');
    brushSize.addEventListener('input', (e) => {
        state.brushSize = parseInt(e.target.value);
    });
    
    // Drawing
    let lastX = 0;
    let lastY = 0;
    
    canvas.addEventListener('mousedown', (e) => {
        if (state.tool === 'text') {
            showTextInput(e.offsetX, e.offsetY);
            return;
        }
        
        state.isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });
    
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => state.isDrawing = false);
    canvas.addEventListener('mouseout', () => state.isDrawing = false);
    
    function draw(e) {
        if (!state.isDrawing) return;
        
        ctx.lineWidth = state.tool === 'eraser' ? state.brushSize * 3 : state.brushSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = state.tool === 'eraser' ? '#FFFFFF' : state.brushColor;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }
    
    // Text input
    const textInputContainer = document.getElementById('text-input-container');
    const textInput = document.getElementById('text-input');
    const textSubmit = document.getElementById('text-submit');
    let textPosition = { x: 0, y: 0 };
    
    function showTextInput(x, y) {
        textPosition = { x, y };
        textInputContainer.style.display = 'block';
        textInputContainer.style.left = `${x}px`;
        textInputContainer.style.top = `${y}px`;
        textInput.focus();
    }
    
    textSubmit.addEventListener('click', () => {
        if (textInput.value.trim()) {
            ctx.font = '16px Segoe UI';
            ctx.fillStyle = state.brushColor;
            ctx.fillText(textInput.value, textPosition.x, textPosition.y + 20);
            textInput.value = '';
        }
        textInputContainer.style.display = 'none';
    });
    
    // Clear canvas
    document.getElementById('clear-canvas').addEventListener('click', () => {
        if (confirm('Clear the entire canvas?')) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            saveCanvas();
        }
    });
    
    // Save canvas
    document.getElementById('save-canvas').addEventListener('click', () => {
        saveCanvas();
        showNotification('Canvas saved!');
    });

    document.getElementById('save-board').addEventListener('click', saveBoardToIdeas);
}

function saveCanvas() {
    const canvas = document.getElementById('whiteboard-canvas');
    const dataURL = canvas.toDataURL();
    localStorage.setItem('whiteboard-canvas', dataURL);
}

function loadCanvas() {
    const canvas = document.getElementById('whiteboard-canvas');
    const ctx = canvas.getContext('2d');
    const dataURL = localStorage.getItem('whiteboard-canvas');
    
    if (dataURL) {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
        };
        img.src = dataURL;
    }
}

// ========================================
// SCHEDULE
// ========================================

function initSchedule() {
    renderCalendar();
    
    document.getElementById('prev-month').addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    document.getElementById('add-event-btn').addEventListener('click', () => {
        openEventModal();
    });
    
    document.getElementById('save-event').addEventListener('click', saveEvent);
    document.getElementById('cancel-event').addEventListener('click', closeEventModal);
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthYearLabel = document.getElementById('current-month-year');
    
    grid.innerHTML = '';
    
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearLabel.textContent = `${months[month]} ${year}`;
    
    // Day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Calendar days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const today = new Date();
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayEl = createDayElement(daysInPrevMonth - i, true, month - 1, year);
        grid.appendChild(dayEl);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && 
                       month === today.getMonth() && 
                       year === today.getFullYear();
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEntries = getCalendarEntries(dateStr);
        const hasEvent = dayEntries.some(entry => entry.type === 'event');
        const hasNote = dayEntries.some(entry => entry.type === 'note');
        
        const dayEl = createDayElement(day, false, month, year, isToday, hasEvent, hasNote, dateStr, dayEntries);
        grid.appendChild(dayEl);
    }
    
    // Next month days
    const totalCells = grid.children.length;
    const remaining = 42 - totalCells;
    for (let i = 1; i <= remaining; i++) {
        const dayEl = createDayElement(i, true, month + 1, year);
        grid.appendChild(dayEl);
    }
    
    renderEvents();
}

function createDayElement(day, isOtherMonth, month, year, isToday = false, hasEvent = false, hasNote = false, dateStr = null, entries = []) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.innerHTML = `<span class="calendar-day-number">${day}</span>`;
    
    if (isOtherMonth) dayEl.classList.add('other-month');
    if (isToday) dayEl.classList.add('today');
    if (hasEvent) dayEl.classList.add('has-event');
    if (hasNote) dayEl.classList.add('has-note');
    if (!isOtherMonth && entries.length > 0) {
        const list = document.createElement('div');
        list.className = 'calendar-entry-list';
        entries.slice(0, 3).forEach(entry => {
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = `calendar-entry-pill ${entry.type}`;
            pill.style.background = entry.color;
            pill.title = entry.type === 'note'
                ? `${entry.title} · ${getNoteCategoryMeta(entry.category).label}`
                : entry.title;
            pill.textContent = entry.title;
            if (entry.type === 'note') {
                pill.addEventListener('click', (event) => {
                    event.stopPropagation();
                    loadNote(entry.id);
                    switchView('notes');
                });
            }
            list.appendChild(pill);
        });
        if (entries.length > 3) {
            const more = document.createElement('div');
            more.className = 'calendar-entry-more';
            more.textContent = `+${entries.length - 3} more`;
            list.appendChild(more);
        }
        dayEl.appendChild(list);
    }
    
    if (dateStr && !isOtherMonth) {
        dayEl.addEventListener('click', () => {
            state.selectedEventDate = dateStr;
            openEventModal(dateStr);
        });
    }
    
    return dayEl;
}

function renderEvents() {
    const container = document.getElementById('events-container');
    container.innerHTML = '';
    
    const agendaEntries = getAgendaEntries().sort((a, b) => {
        return new Date(a.date + ' ' + (a.time || '00:00')) - new Date(b.date + ' ' + (b.time || '00:00'));
    });
    
    const upcoming = agendaEntries.filter(e => new Date(e.date) >= new Date().setHours(0, 0, 0, 0));
    
    if (upcoming.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No upcoming events or scheduled notes</p>';
        return;
    }
    
    upcoming.forEach(event => {
        const eventEl = document.createElement('div');
        eventEl.className = event.type === 'note' ? 'event-item calendar-note-item' : 'event-item';
        const meta = event.type === 'note' ? getNoteCategoryMeta(event.category) : null;
        eventEl.style.borderLeftColor = event.type === 'note' ? meta.color : 'var(--accent-primary)';
        eventEl.innerHTML = event.type === 'note'
            ? `
                <h4>${escapeHtml(event.title || 'Untitled Note')}</h4>
                <p>📌 ${formatDate(event.date)}${event.time ? ' ⏰ ' + event.time : ''}</p>
                <p>${escapeHtml(meta.label)} note</p>
              `
            : `
                <h4>${escapeHtml(event.title)}</h4>
                <p>📅 ${formatDate(event.date)}${event.time ? ' ⏰ ' + event.time : ''}</p>
                ${event.description ? '<p>' + escapeHtml(event.description) + '</p>' : ''}
              `;

        if (event.type === 'event') {
            eventEl.addEventListener('click', () => {
                if (confirm('Delete this event?')) {
                    state.events = state.events.filter(e => e.id !== event.id);
                    saveToStorage();
                    renderCalendar();
                }
            });
        } else {
            eventEl.addEventListener('click', () => {
                loadNote(event.id);
                switchView('notes');
            });
        }
        container.appendChild(eventEl);
    });
}

function openEventModal(date = null) {
    const modal = document.getElementById('event-modal');
    modal.classList.add('active');
    
    document.getElementById('event-title').value = '';
    document.getElementById('event-date').value = date || '';
    document.getElementById('event-time').value = '';
    document.getElementById('event-description').value = '';
}

function closeEventModal() {
    document.getElementById('event-modal').classList.remove('active');
}

function saveEvent() {
    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const description = document.getElementById('event-description').value.trim();
    
    if (!title || !date) {
        alert('Please fill in title and date');
        return;
    }
    
    const event = {
        id: Date.now(),
        title,
        date,
        time,
        description
    };
    
    state.events.push(event);
    saveToStorage();
    closeEventModal();
    renderCalendar();
    showNotification('Event saved!');
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ========================================
// NOTES
// ========================================

function initNotes() {
    syncNoteCategoryUI();
    renderNotesList();
    
    document.getElementById('add-note-btn').addEventListener('click', () => {
        createNewNote();
    });

    document.getElementById('add-note-category-btn').addEventListener('click', addNoteCategory);
    
    document.getElementById('save-note').addEventListener('click', saveNote);

    document.getElementById('note-category').addEventListener('change', (e) => {
        if (!state.currentNoteId) return;
        const note = state.notes.find(n => n.id === state.currentNoteId);
        if (!note) return;
        note.category = e.target.value;
        saveToStorage();
        syncNoteCategoryUI();
        renderNotesList(document.getElementById('search-notes').value);
    });

    document.getElementById('place-note-calendar').addEventListener('click', scheduleCurrentNote);

    document.getElementById('clear-note-calendar').addEventListener('click', () => {
        if (!state.currentNoteId) {
            alert('Please create or select a note first');
            return;
        }

        const note = state.notes.find(n => n.id === state.currentNoteId);
        if (!note) return;

        note.scheduledDate = '';
        note.scheduledTime = '';
        note.updatedAt = Date.now();
        saveToStorage();
        loadNote(note.id);
        renderCalendar();
        showNotification('Removed from calendar');
    });
    
    document.getElementById('delete-note').addEventListener('click', () => {
        if (state.currentNoteId && confirm('Delete this note?')) {
            state.notes = state.notes.filter(n => n.id !== state.currentNoteId);
            state.currentNoteId = null;
            saveToStorage();
            renderNotesList();
            clearNoteEditor();
        }
    });
    
    document.getElementById('search-notes').addEventListener('input', (e) => {
        renderNotesList(e.target.value);
    });
}

function renderNotesList(searchTerm = '') {
    const list = document.getElementById('notes-list');
    list.innerHTML = '';
    
    const filtered = state.notes.filter(note => {
        if (!searchTerm) return true;
        const title = (note.title || '').toLowerCase();
        const content = (note.content || '').toLowerCase();
        return title.includes(searchTerm.toLowerCase()) ||
               content.includes(searchTerm.toLowerCase());
    });

    const categoryFiltered = state.noteFilterCategory === 'all'
        ? filtered
        : filtered.filter(note => (note.category || 'general') === state.noteFilterCategory);

    categoryFiltered.sort((a, b) => {
        const categoryDiff = getNoteCategoryMeta(a.category).label.localeCompare(getNoteCategoryMeta(b.category).label);
        if (categoryDiff !== 0) return categoryDiff;
        return new Date(b.updatedAt || b.createdAt || b.date || 0) - new Date(a.updatedAt || a.createdAt || a.date || 0);
    });

    if (categoryFiltered.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No notes yet</p>';
        return;
    }

    categoryFiltered.forEach(note => {
        const noteEl = document.createElement('div');
        const categoryMeta = getNoteCategoryMeta(note.category);
        noteEl.className = 'note-item note-blob';
        noteEl.style.setProperty('--sticky-color', categoryMeta.color);
        if (note.id === state.currentNoteId) noteEl.classList.add('active');
        noteEl.style.setProperty('--sticky-rotate', `${((note.id || 0) % 5) - 2}deg`);
        noteEl.title = `${note.title || 'Untitled'} · ${categoryMeta.label}`;
        noteEl.innerHTML = `<h4>${escapeHtml(note.title || 'Untitled')}</h4>`;
        
        noteEl.addEventListener('click', () => {
            loadNote(note.id);
        });
        
        list.appendChild(noteEl);
    });
}

function createNewNote() {
    const defaultCategory = state.noteFilterCategory !== 'all'
        ? state.noteFilterCategory
        : (state.noteCategories[0]?.id || 'general');
    const note = {
        id: Date.now(),
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        category: defaultCategory,
        scheduledDate: '',
        scheduledTime: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    state.notes.push(note);
    state.currentNoteId = note.id;
    saveToStorage();
    syncNoteCategoryUI();
    renderNotesList();
    loadNote(note.id);
}

function loadNote(id) {
    const note = state.notes.find(n => n.id === id);
    if (!note) return;
    
    state.currentNoteId = id;
    
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = note.content;
    document.getElementById('note-date').value = note.date;
    document.getElementById('note-category').value = note.category || 'general';
    document.getElementById('note-calendar-date').value = note.scheduledDate || '';
    document.getElementById('note-calendar-time').value = note.scheduledTime || '';
    
    renderNotesList(document.getElementById('search-notes').value);
    syncNoteCategoryUI();
}

function saveNote() {
    if (!state.currentNoteId) {
        alert('Please create or select a note first');
        return;
    }
    
    const note = state.notes.find(n => n.id === state.currentNoteId);
    if (!note) return;
    
    note.title = document.getElementById('note-title').value.trim();
    note.content = document.getElementById('note-content').value;
    note.date = document.getElementById('note-date').value;
    note.category = document.getElementById('note-category').value;
    note.scheduledDate = document.getElementById('note-calendar-date').value;
    note.scheduledTime = document.getElementById('note-calendar-time').value;
    note.updatedAt = Date.now();
    
    saveToStorage();
    syncNoteCategoryUI();
    renderNotesList(document.getElementById('search-notes').value);
    renderCalendar();
    showNotification('Note saved!');
}

function clearNoteEditor() {
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    document.getElementById('note-date').value = '';
    document.getElementById('note-calendar-date').value = '';
    document.getElementById('note-calendar-time').value = '';
    document.getElementById('note-category').value = state.noteCategories[0]?.id || 'general';
}

function scheduleCurrentNote() {
    if (!state.currentNoteId) {
        alert('Please create or select a note first');
        return;
    }

    const note = state.notes.find(n => n.id === state.currentNoteId);
    if (!note) return;

    const date = document.getElementById('note-calendar-date').value;
    const time = document.getElementById('note-calendar-time').value;

    if (!date) {
        alert('Pick a calendar date first');
        return;
    }

    note.scheduledDate = date;
    note.scheduledTime = time;
    note.updatedAt = Date.now();
    saveToStorage();
    renderCalendar();
    renderNotesList(document.getElementById('search-notes').value);
    showNotification('Note placed on the calendar');
}

function addNoteCategory() {
    const nameInput = document.getElementById('new-note-category-name');
    const colorInput = document.getElementById('new-note-category-color');
    const label = nameInput.value.trim();

    if (!label) {
        alert('Enter a category name');
        return;
    }

    const existingIds = new Set(state.noteCategories.map(category => category.id));
    let id = createCategoryId(label);
    let suffix = 2;
    while (existingIds.has(id)) {
        id = `${createCategoryId(label)}-${suffix}`;
        suffix += 1;
    }

    state.noteCategories.push({
        id,
        label,
        color: colorInput.value || '#F8E08C',
        builtIn: false
    });

    nameInput.value = '';
    saveToStorage();
    syncNoteCategoryUI();
    renderNotesList(document.getElementById('search-notes').value);
    showNotification('Category added');
}

function syncNoteCategoryUI() {
    state.noteCategories = normalizeNoteCategories(state.noteCategories);
    renderNoteCategorySelect(document.getElementById('note-category'));
    renderNoteCategoryFilters();
}

function renderNoteCategorySelect(selectEl) {
    if (!selectEl) return;
    const selected = selectEl.value || state.currentNoteId && state.notes.find(n => n.id === state.currentNoteId)?.category || 'general';
    selectEl.innerHTML = state.noteCategories.map(category => {
        return `<option value="${category.id}">${escapeHtml(category.label)}</option>`;
    }).join('');
    selectEl.value = state.noteCategories.some(category => category.id === selected) ? selected : (state.noteCategories[0]?.id || 'general');
}

function renderNoteCategoryFilters() {
    const container = document.getElementById('note-category-filters');
    if (!container) return;

    const counts = state.noteCategories.reduce((acc, category) => {
        acc[category.id] = state.notes.filter(note => (note.category || 'general') === category.id).length;
        return acc;
    }, {});

    container.innerHTML = [
        `<button class="note-filter-chip ${state.noteFilterCategory === 'all' ? 'active' : ''}" data-category="all">All <span>${state.notes.length}</span></button>`,
        ...state.noteCategories.map(category => {
            return `<button class="note-filter-chip ${state.noteFilterCategory === category.id ? 'active' : ''}" data-category="${category.id}" style="--chip-color:${category.color}">
                ${escapeHtml(category.label)} <span>${counts[category.id] || 0}</span>
            </button>`;
        })
    ].join('');

    container.querySelectorAll('.note-filter-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            state.noteFilterCategory = btn.dataset.category;
            renderNoteCategoryFilters();
            renderNotesList(document.getElementById('search-notes').value);
        });
    });
}

function normalizeNoteCategories(categories = []) {
    const custom = Array.isArray(categories) ? categories.filter(Boolean) : [];
    const combined = [...NOTE_DEFAULT_CATEGORIES, ...custom];
    const seen = new Set();

    return combined.filter(category => {
        if (!category || !category.id || seen.has(category.id)) return false;
        seen.add(category.id);
        return true;
    }).map(category => ({
        ...category,
        label: category.label || category.id,
        color: category.color || '#F8E08C',
        builtIn: Boolean(category.builtIn)
    }));
}

function getNoteCategoryMeta(categoryId) {
    return state.noteCategories.find(category => category.id === categoryId) || state.noteCategories[0] || NOTE_DEFAULT_CATEGORIES[0];
}

function createCategoryId(label) {
    return label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'category';
}

function getCalendarEntries(dateStr) {
    const scheduledNotes = state.notes
        .filter(note => note.scheduledDate === dateStr)
        .map(note => ({
            id: note.id,
            type: 'note',
            title: note.title || 'Untitled Note',
            date: note.scheduledDate,
            time: note.scheduledTime || '',
            category: note.category || 'general',
            color: getNoteCategoryMeta(note.category).color
        }));

    const events = state.events
        .filter(event => event.date === dateStr)
        .map(event => ({
            id: event.id,
            type: 'event',
            title: event.title,
            date: event.date,
            time: event.time || '',
            color: 'var(--accent-primary)',
            description: event.description || ''
        }));

    return [...scheduledNotes, ...events].sort((a, b) => {
        return (a.time || '').localeCompare(b.time || '');
    });
}

function getAgendaEntries() {
    const scheduledNotes = state.notes
        .filter(note => note.scheduledDate)
        .map(note => ({
            id: note.id,
            type: 'note',
            title: note.title || 'Untitled Note',
            date: note.scheduledDate,
            time: note.scheduledTime || '',
            category: note.category || 'general',
            color: getNoteCategoryMeta(note.category).color
        }));

    const events = state.events.map(event => ({
        ...event,
        type: 'event',
        color: 'var(--accent-primary)'
    }));

    return [...scheduledNotes, ...events];
}

// ========================================
// IDEAS
// ========================================

function initIdeas() {
    renderIdeas();
    
    document.getElementById('add-idea-btn').addEventListener('click', () => {
        openIdeaModal();
    });
    
    document.getElementById('save-idea').addEventListener('click', saveIdea);
    document.getElementById('cancel-idea').addEventListener('click', closeIdeaModal);
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.ideaFilter = btn.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderIdeas();
        });
    });
}

function renderIdeas() {
    const grid = document.getElementById('ideas-grid');
    grid.innerHTML = '';
    
    let filtered = state.ideas;
    if (state.ideaFilter === 'active') {
        filtered = state.ideas.filter(i => !i.archived);
    } else if (state.ideaFilter === 'archived') {
        filtered = state.ideas.filter(i => i.archived);
    }
    
    filtered.sort((a, b) => {
        const categoryDiff = CATEGORY_ORDER.indexOf(a.category || 'general') - CATEGORY_ORDER.indexOf(b.category || 'general');
        if (categoryDiff !== 0) return categoryDiff;
        return b.createdAt - a.createdAt;
    });
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 40px;">No ideas yet</p>';
        return;
    }
    
    filtered.forEach(idea => {
        const ideaEl = document.createElement('div');
        const categoryMeta = getCategoryMeta(idea.category);
        ideaEl.className = 'idea-card sticky-tile';
        ideaEl.style.setProperty('--sticky-color', categoryMeta.color);
        ideaEl.style.setProperty('--sticky-rotate', `${((idea.id || 0) % 5) - 2}deg`);
        ideaEl.innerHTML = `
            <div class="sticky-card-header">
                <span class="sticky-label">${escapeHtml(categoryMeta.label)}</span>
                ${idea.source === 'whiteboard' ? '<span class="sticky-source">Board</span>' : ''}
            </div>
            <h3>${escapeHtml(idea.title)}</h3>
            <p>${escapeHtml(idea.description || 'No description yet')}</p>
            ${idea.snapshot ? `<img class="idea-snapshot" src="${idea.snapshot}" alt="${escapeHtml(idea.title)} snapshot">` : ''}
            <span class="idea-priority ${idea.priority}">${escapeHtml(idea.priority.toUpperCase())}</span>
            <label class="sticky-category-control">
                <span>Category</span>
                <select class="idea-category-select">
                    ${renderCategoryOptions(idea.category)}
                </select>
            </label>
            <div class="idea-actions">
                <button class="btn-secondary" onclick="toggleArchiveIdea(${idea.id})">
                    ${idea.archived ? 'Unarchive' : 'Archive'}
                </button>
                <button class="btn-danger" onclick="deleteIdea(${idea.id})">Delete</button>
            </div>
        `;
        const select = ideaEl.querySelector('.idea-category-select');
        select.value = idea.category || 'general';
        select.addEventListener('change', (e) => {
            idea.category = e.target.value;
            saveToStorage();
            renderIdeas();
        });
        grid.appendChild(ideaEl);
    });
}

function openIdeaModal() {
    document.getElementById('idea-modal').classList.add('active');
    document.getElementById('idea-title').value = '';
    document.getElementById('idea-description').value = '';
    document.getElementById('idea-priority').value = 'medium';
    document.getElementById('idea-category').value = 'idea';
}

function closeIdeaModal() {
    document.getElementById('idea-modal').classList.remove('active');
}

function saveIdea() {
    const title = document.getElementById('idea-title').value.trim();
    const description = document.getElementById('idea-description').value.trim();
    const priority = document.getElementById('idea-priority').value;
    
    if (!title) {
        alert('Please enter a title');
        return;
    }
    
    const idea = {
        id: Date.now(),
        title,
        description,
        priority,
        archived: false,
        createdAt: Date.now(),
        category: document.getElementById('idea-category').value,
        source: 'manual'
    };
    
    state.ideas.push(idea);
    saveToStorage();
    closeIdeaModal();
    renderIdeas();
    showNotification('Idea saved!');
}

function toggleArchiveIdea(id) {
    const idea = state.ideas.find(i => i.id === id);
    if (idea) {
        idea.archived = !idea.archived;
        saveToStorage();
        renderIdeas();
    }
}

function saveBoardToIdeas() {
    const canvas = document.getElementById('whiteboard-canvas');
    saveCanvas();

    const boardIdea = {
        id: Date.now(),
        title: `Whiteboard Snapshot ${new Date().toLocaleDateString('en-US')}`,
        description: 'Captured from the whiteboard and saved as a sticky note.',
        priority: 'medium',
        archived: false,
        createdAt: Date.now(),
        category: 'general',
        source: 'whiteboard',
        snapshot: canvas.toDataURL()
    };

    state.ideas.push(boardIdea);
    saveToStorage();
    renderIdeas();
    switchView('ideas');
    showNotification('Board saved to Ideas!');
}

function deleteIdea(id) {
    if (confirm('Delete this idea?')) {
        state.ideas = state.ideas.filter(i => i.id !== id);
        saveToStorage();
        renderIdeas();
    }
}

// ========================================
// VISUALS
// ========================================

function initVisuals() {
    renderVisuals();
    
    document.getElementById('upload-visual-btn').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.addEventListener('change', handleVisualUpload);
        input.click();
    });
}

function handleVisualUpload(e) {
    const files = e.target.files;
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const visual = {
                id: Date.now() + Math.random(),
                src: event.target.result,
                name: file.name,
                date: new Date().toISOString()
            };
            
            state.visuals.push(visual);
            saveToStorage();
            renderVisuals();
            showNotification('Image uploaded!');
        };
        reader.readAsDataURL(file);
    });
}

function renderVisuals() {
    const grid = document.getElementById('visuals-grid');
    grid.innerHTML = '';
    
    if (state.visuals.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 40px;">No visuals yet. Upload images to get started!</p>';
        return;
    }
    
    state.visuals.forEach(visual => {
        const visualEl = document.createElement('div');
        visualEl.className = 'visual-card';
        visualEl.innerHTML = `
            <img src="${visual.src}" alt="${visual.name}">
            <div class="visual-info">
                <h4>${visual.name}</h4>
                <p>${formatDate(visual.date.split('T')[0])}</p>
            </div>
        `;
        
        visualEl.addEventListener('click', () => {
            openVisualModal(visual);
        });
        
        grid.appendChild(visualEl);
    });
}

function openVisualModal(visual) {
    const modal = document.getElementById('visual-modal');
    modal.classList.add('active');
    
    document.getElementById('visual-preview').src = visual.src;
    document.getElementById('visual-caption').textContent = `${visual.name} - ${formatDate(visual.date.split('T')[0])}`;
    
    document.getElementById('close-visual').onclick = () => {
        modal.classList.remove('active');
    };
}

// ========================================
// STORAGE
// ========================================

function saveToStorage() {
    localStorage.setItem('whiteboard-events', JSON.stringify(state.events));
    localStorage.setItem('whiteboard-notes', JSON.stringify(state.notes));
    localStorage.setItem('whiteboard-note-categories', JSON.stringify(state.noteCategories));
    localStorage.setItem('whiteboard-ideas', JSON.stringify(state.ideas));
    localStorage.setItem('whiteboard-visuals', JSON.stringify(state.visuals));
}

function loadFromStorage() {
    try {
        state.events = JSON.parse(localStorage.getItem('whiteboard-events')) || [];
        state.noteCategories = normalizeNoteCategories(JSON.parse(localStorage.getItem('whiteboard-note-categories')) || []);
        state.notes = (JSON.parse(localStorage.getItem('whiteboard-notes')) || []).map(note => ({
            ...note,
            category: note.category || 'general',
            date: note.date || new Date().toISOString().split('T')[0],
            scheduledDate: note.scheduledDate || '',
            scheduledTime: note.scheduledTime || '',
            createdAt: note.createdAt || Date.now(),
            updatedAt: note.updatedAt || Date.now()
        }));
        state.ideas = (JSON.parse(localStorage.getItem('whiteboard-ideas')) || []).map(idea => ({
            ...idea,
            category: idea.category || 'general',
            source: idea.source || 'manual',
            priority: idea.priority || 'medium',
            createdAt: idea.createdAt || Date.now()
        }));
        state.visuals = JSON.parse(localStorage.getItem('whiteboard-visuals')) || [];
        if (!state.noteCategories.length) {
            state.noteCategories = normalizeNoteCategories();
        }
    } catch (e) {
        console.error('Error loading from storage:', e);
        state.noteCategories = normalizeNoteCategories();
    }
}

// ========================================
// UTILITIES
// ========================================

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--accent-primary);
        color: var(--bg-primary);
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: 600;
        box-shadow: 0 4px 12px var(--shadow-medium);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

function getCategoryMeta(category) {
    return CATEGORY_META[category] || CATEGORY_META.general;
}

function renderCategoryOptions(selectedCategory = 'general') {
    return CATEGORY_ORDER.map(category => {
        const meta = getCategoryMeta(category);
        return `<option value="${category}" ${category === selectedCategory ? 'selected' : ''}>${escapeHtml(meta.label)}</option>`;
    }).join('');
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
