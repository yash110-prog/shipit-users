// Task manager - corrected and improved

// Data
let tasks = [];
let currentFilter = 'all';
let currentSort = 'none';

// Utility: generate unique IDs (uses crypto.randomUUID if available)
function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

// Persistence
function saveTasksToStorage() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (e) {
        console.warn('Could not save tasks to localStorage:', e);
    }
}
function loadTasksFromStorage() {
    try {
        const raw = localStorage.getItem('tasks');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) tasks = parsed;
        }
    } catch (e) {
        console.warn('Could not load tasks from localStorage:', e);
    }
}

// Add task (handles Enter key via init wiring)
function addTask() {
    const taskInput = document.getElementById('task-input');
    const prioritySelect = document.getElementById('priority-select');
    const dueDateInput = document.getElementById('due-date');
    const dueTimeInput = document.getElementById('due-time');

    if (!taskInput) return;

    const taskText = taskInput.value.trim();
    if (!taskText) {
        alert('Please enter a task!');
        return;
    }

    const newTask = {
        id: generateId(),
        text: taskText,
        completed: false,
        priority: (prioritySelect && prioritySelect.value) ? prioritySelect.value.toLowerCase() : 'low',
        dueDate: dueDateInput ? dueDateInput.value : '',
        dueTime: dueTimeInput ? dueTimeInput.value : '',
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);

    // clear inputs
    taskInput.value = '';
    if (dueDateInput) dueDateInput.value = '';
    if (dueTimeInput) dueTimeInput.value = '';

    saveTasksToStorage();
    renderTasks();
    updateCounts();
}

// Render tasks according to currentFilter and currentSort
function renderTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    taskList.innerHTML = '';

    // Start with a copy of tasks
    let filteredTasks = tasks.slice();

    // Filtering
    if (currentFilter === 'pending') {
        filteredTasks = filteredTasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = filteredTasks.filter(t => t.completed);
    } // 'all' -> no filter

    // If a sort is currently chosen, apply it to the displayed list (non-destructive)
    if (currentSort === 'priority') {
        const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
        filteredTasks.sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));
    } else if (currentSort === 'date') {
        const parseDate = (t) => {
            if (!t.dueDate) return new Date('9999-12-31');
            const dateString = t.dueTime ? `${t.dueDate}T${t.dueTime}` : t.dueDate;
            const d = new Date(dateString);
            return isNaN(d.getTime()) ? new Date('9999-12-31') : d;
        };
        filteredTasks.sort((a, b) => parseDate(a) - parseDate(b));
    }

    // Create DOM elements safely (no inline JS)
    filteredTasks.forEach(task => {
        const el = createTaskElement(task);
        taskList.appendChild(el);
    });
}

// Create a task DOM element (using DOM APIs to avoid injection issues)
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `p-4 border rounded-lg mb-3 flex items-center justify-between ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`;

    // Left section: checkbox + text
    const left = document.createElement('div');
    left.className = 'flex items-center gap-3 flex-1';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!task.completed;
    checkbox.className = 'w-5 h-5 text-indigo-600';
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const info = document.createElement('div');
    info.className = 'flex-1';

    const title = document.createElement('div');
    title.className = `${task.completed ? 'line-through text-gray-500' : 'text-gray-800'} font-medium`;
    title.textContent = task.text;

    // Priority color mapping
    let priorityClass = 'text-gray-600';
    const pr = (task.priority || '').toLowerCase();
    if (pr === 'high') priorityClass = 'text-red-600';
    else if (pr === 'medium') priorityClass = 'text-yellow-600';
    else if (pr === 'low') priorityClass = 'text-green-600';

    // Due date formatting with validation
    let dueDateText = '';
    if (task.dueDate) {
        const dateString = task.dueTime ? `${task.dueDate}T${task.dueTime}` : task.dueDate;
        const d = new Date(dateString);
        if (!isNaN(d.getTime())) {
            const datePart = d.toLocaleDateString();
            const timePart = task.dueTime ? ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            dueDateText = ` | Due: ${datePart}${timePart}`;
        } else {
            dueDateText = ' | Due: Invalid date';
        }
    }

    const meta = document.createElement('div');
    meta.className = `text-sm ${priorityClass}`;
    meta.textContent = `Priority: ${task.priority || 'low'}${dueDateText}`;

    info.appendChild(title);
    info.appendChild(meta);

    left.appendChild(checkbox);
    left.appendChild(info);

    // Right section: Edit/Delete buttons
    const right = document.createElement('div');
    right.className = 'flex gap-2';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'text-blue-500 hover:text-blue-700 text-sm';
    editBtn.addEventListener('click', () => editTask(task.id));

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'text-red-500 hover:text-red-700 text-sm';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    right.appendChild(editBtn);
    right.appendChild(delBtn);

    taskDiv.appendChild(left);
    taskDiv.appendChild(right);

    return taskDiv;
}

// Toggle completion
function toggleTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    tasks[idx].completed = !tasks[idx].completed;
    saveTasksToStorage();
    renderTasks();
    updateCounts();
}

// Edit task
function editTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    const task = tasks[idx];
    const newText = prompt('Edit task:', task.text);
    if (newText === null) return; // cancelled
    const trimmed = newText.trim();
    if (!trimmed) {
        alert('Task cannot be empty.');
        return;
    }
    tasks[idx].text = trimmed;
    saveTasksToStorage();
    renderTasks();
}

// Delete task with confirmation
function deleteTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    const confirmed = confirm('Are you sure you want to delete this task?');
    if (!confirmed) return;
    tasks.splice(idx, 1);
    saveTasksToStorage();
    renderTasks();
    updateCounts();
}

// Filtering
function filterTasks(filter) {
    currentFilter = filter || 'all';

    // Manage active class on filter buttons (robust detection)
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        // Determine this button's filter via data-filter attribute or id like filter-<name>
        const btnFilter = (btn.dataset && btn.dataset.filter) ? btn.dataset.filter :
                          (btn.getAttribute('data-filter')) ? btn.getAttribute('data-filter') :
                          (btn.id && btn.id.replace(/^filter-/, '')) || '';
        if (btnFilter === currentFilter) {
            btn.classList.add('active');
        }
    });

    renderTasks();
    updateCounts();
}

// Sorting
function sortTasks(sortBy) {
    currentSort = sortBy || 'none';

    if (currentSort === 'priority') {
        // high first, then medium, then low
        const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
        tasks.sort((a, b) => (priorityOrder[(a.priority || '').toLowerCase()] || 99) - (priorityOrder[(b.priority || '').toLowerCase()] || 99));
    } else if (currentSort === 'date') {
        const parseDate = (t) => {
            if (!t.dueDate) return new Date('9999-12-31');
            const dateString = t.dueTime ? `${t.dueDate}T${t.dueTime}` : t.dueDate;
            const d = new Date(dateString);
            return isNaN(d.getTime()) ? new Date('9999-12-31') : d;
        };
        tasks.sort((a, b) => parseDate(a) - parseDate(b));
    } else if (currentSort === 'none') {
        // If you want to restore original order you'd need to persist createdAt or an index.
        // We'll simply leave the current order as-is when 'none' is chosen.
    }

    saveTasksToStorage();
    renderTasks();
}

// Count display
function updateCounts() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    const allEl = document.getElementById('count-all');
    const pendingEl = document.getElementById('count-pending');
    const completedEl = document.getElementById('count-completed');

    if (allEl) allEl.textContent = totalTasks;
    if (pendingEl) pendingEl.textContent = pendingTasks;
    if (completedEl) completedEl.textContent = completedTasks;
}

// Bulk operations
function markAllComplete() {
    if (tasks.length === 0) return;
    tasks.forEach(t => (t.completed = true));
    saveTasksToStorage();
    renderTasks();
    updateCounts();
}

function deleteCompleted() {
    const confirmed = confirm('Delete all completed tasks?');
    if (!confirmed) return;
    tasks = tasks.filter(t => !t.completed);
    saveTasksToStorage();
    renderTasks();
    updateCounts();
}

function clearAllTasks() {
    if (tasks.length === 0) return;
    const confirmed = confirm('This will remove all tasks. Are you sure?');
    if (!confirmed) return;
    tasks = [];
    saveTasksToStorage();
    renderTasks();
    updateCounts();
}

// Initialization: hook UI, keyboard Enter, filter/sort buttons, load storage
function initApp() {
    loadTasksFromStorage();

    // Wire add button (if exists)
    const addBtn = document.getElementById('add-task-btn');
    if (addBtn) addBtn.addEventListener('click', addTask);

    // Wire Enter key on input
    const taskInput = document.getElementById('task-input');
    if (taskInput) {
        taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTask();
            }
        });
    }

    // Wire filter buttons (elements should have class 'filter-btn' and data-filter='<all|pending|completed>')
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const filter = btn.dataset.filter || btn.getAttribute('data-filter') || (btn.id && btn.id.replace(/^filter-/, '')) || 'all';
        btn.addEventListener('click', () => filterTasks(filter));
    });

    // Wire sort select (if exists)
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => sortTasks(e.target.value));
    }

    // Wire sort buttons (class 'sort-btn' with data-sort)
    document.querySelectorAll('.sort-btn').forEach(btn => {
        const s = btn.dataset.sort || btn.getAttribute('data-sort');
        if (s) btn.addEventListener('click', () => sortTasks(s));
    });

    // Wire bulk action buttons (optional ids)
    const markAllBtn = document.getElementById('mark-all-btn');
    if (markAllBtn) markAllBtn.addEventListener('click', markAllComplete);

    const deleteCompletedBtn = document.getElementById('delete-completed-btn');
    if (deleteCompletedBtn) deleteCompletedBtn.addEventListener('click', deleteCompleted);

    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllTasks);

    // Initial render and counts and set active filter button
    renderTasks();
    updateCounts();
    filterTasks(currentFilter);
}

// Kick off on DOM ready
window.addEventListener('DOMContentLoaded', initApp);

// Expose functions globally if other inline handlers expect them
window.addTask = addTask;
window.toggleTask = toggleTask;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.filterTasks = filterTasks;
window.sortTasks = sortTasks;
window.markAllComplete = markAllComplete;
window.deleteCompleted = deleteCompleted;
window.clearAllTasks = clearAllTasks;
