const STORAGE_KEY = 'task-tracker:v1';

const state = {
  tasks: [],
  filter: 'all',
  query: '',
};

const dom = {
  form: document.getElementById('new-task-form'),
  input: document.getElementById('new-task-input'),
  list: document.getElementById('tasks'),
  count: document.getElementById('task-count'),
  clearCompleted: document.getElementById('clear-completed'),
  filters: document.querySelectorAll('[data-filter]'),
  search: document.getElementById('task-search'),
};

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.tasks = raw ? JSON.parse(raw) : [];
  } catch (_) {
    state.tasks = [];
  }
}

function persistTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function updateCount() {
  const total = state.tasks.length;
  const remaining = state.tasks.filter((t) => !t.completed).length;
  dom.count.textContent = total === 0 ? 'No tasks' : `${remaining}/${total} remaining`;
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task${task.completed ? ' completed' : ''}`;
  li.dataset.id = task.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', 'Mark task completed');

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'text';
  input.value = task.text;
  input.readOnly = true;

  const actions = document.createElement('div');
  actions.className = 'actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'btn edit';
  editBtn.textContent = 'Edit';

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn delete';
  deleteBtn.textContent = 'Delete';

  actions.append(editBtn, deleteBtn);
  li.append(checkbox, input, actions);
  return li;
}

function renderTasks() {
  dom.list.innerHTML = '';
  const fragment = document.createDocumentFragment();
  const query = state.query.toLowerCase();
  state.tasks
    .filter((task) => {
      if (state.filter === 'active' && task.completed) return false;
      if (state.filter === 'completed' && !task.completed) return false;
      if (query && !task.text.toLowerCase().includes(query)) return false;
      return true;
    })
    .forEach((task) => fragment.append(createTaskElement(task)));
  dom.list.append(fragment);
  updateCount();
  updateFilterUI();
}

function addTask(text) {
  const task = {
    id: crypto.randomUUID(),
    text: text.trim(),
    completed: false,
  };
  state.tasks.unshift(task);
  persistTasks();
  renderTasks();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  persistTasks();
  renderTasks();
}

function toggleTask(id, completed) {
  const task = state.tasks.find((t) => t.id === id);
  if (task) {
    task.completed = completed;
    persistTasks();
    renderTasks();
  }
}

function updateTaskText(id, text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const task = state.tasks.find((t) => t.id === id);
  if (task) {
    task.text = trimmed;
    persistTasks();
    renderTasks();
  }
}

function clearCompleted() {
  state.tasks = state.tasks.filter((t) => !t.completed);
  persistTasks();
  renderTasks();
}

function setFilter(filter) {
  state.filter = filter;
  updateHashFromView();
  renderTasks();
}

function setQuery(query) {
  state.query = query;
  updateHashFromView();
  renderTasks();
}

function updateFilterUI() {
  dom.filters.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.filter === state.filter);
  });
  if (dom.search) {
    dom.search.value = state.query;
  }
}

function parseHash() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const filter = params.get('filter');
  const query = params.get('q') || '';
  state.filter = ['all', 'active', 'completed'].includes(filter) ? filter : 'all';
  state.query = query;
}

function updateHashFromView() {
  const params = new URLSearchParams();
  if (state.filter !== 'all') params.set('filter', state.filter);
  if (state.query) params.set('q', state.query);
  const next = params.toString();
  const targetHash = next ? `#${next}` : '';
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash || '#';
  }
}

function handleFormSubmit(event) {
  event.preventDefault();
  const value = dom.input.value.trim();
  if (!value) return;
  addTask(value);
  dom.input.value = '';
  dom.input.focus();
}

function handleListClick(event) {
  const target = event.target;
  const taskEl = target.closest('.task');
  if (!taskEl) return;
  const { id } = taskEl.dataset;

  if (target.matches('.delete')) {
    deleteTask(id);
    return;
  }

  if (target.matches('.edit')) {
    const input = taskEl.querySelector('.text');
    const inEditMode = !input.readOnly;
    if (inEditMode) {
      updateTaskText(id, input.value);
      input.readOnly = true;
      target.textContent = 'Edit';
    } else {
      input.readOnly = false;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      target.textContent = 'Save';
    }
  }
}

function handleCheckboxChange(event) {
  const target = event.target;
  if (target.type !== 'checkbox') return;
  const taskEl = target.closest('.task');
  if (!taskEl) return;
  toggleTask(taskEl.dataset.id, target.checked);
}

function bindEvents() {
  dom.form.addEventListener('submit', handleFormSubmit);
  dom.list.addEventListener('click', handleListClick);
  dom.list.addEventListener('change', handleCheckboxChange);
  dom.clearCompleted.addEventListener('click', clearCompleted);
  dom.filters.forEach((btn) =>
    btn.addEventListener('click', () => setFilter(btn.dataset.filter))
  );
  dom.search.addEventListener('input', (e) => setQuery(e.target.value.trim()));
  window.addEventListener('hashchange', () => {
    parseHash();
    renderTasks();
  });
}

function bootstrap() {
  loadTasks();
  parseHash();
  bindEvents();
  renderTasks();
}

document.addEventListener('DOMContentLoaded', bootstrap);
