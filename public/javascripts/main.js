const viewManager = {
  templates: {},
  currentlyRendering: 'all',
  currentlyRenderingDate: null,

  title: null,
  description: null,
  day: null,
  month: null,
  year: null,

  compileTemplates: function() {
    const scripts = document.querySelectorAll(
      'script[type="text/x-handlebars"]'
    );

    scripts.forEach(script => {
      const template = script.innerHTML;
      const templateScript = Handlebars.compile(template);
      const id = script.id;

      if (script.dataset.type === 'partial') {
        Handlebars.registerPartial(id, template);
      }

      this.templates[id] = templateScript;
    });
  },

  getElementReferences: function() {
    this.title = document.getElementById('title');
    this.description = document.getElementById('description');
    this.day = document.getElementById('due_day');
    this.month = document.getElementById('due_month');
    this.year = document.getElementById('due_year');
  },

  clearForm: function() {
    this.title.value = '';
    this.description.value = '';
    [this.day, this.month, this.year].forEach(input => {
      input.selectedIndex = 0;
    });
  },

  openModal: function() {
    $('#form_modal').fadeIn();
    $('#modal_layer').fadeIn();
  },

  closeModal: function() {
    $('#form_modal').fadeOut();
    $('#modal_layer').fadeOut();
  },

  populateForm: function(data) {
    this.clearForm();
    this.title.value = data.title;
    this.description.value = data.description;

    [this.day, this.month, this.year].forEach(input => {
      const key = input.id.replace('due_', '');
      if (isNaN(parseInt(data[key], 10))) {
        input.selectedIndex = 0;
      } else {
        input.value = data[key];
      }
    });
  },

  renderMain: function() {
    const html = this.templates.main_template({});

    document.body.innerHTML = html;
  },

  addDueDate: function(todos) {
    if (todos) {
      return todos.map(todo => {
        todo.due_date =
          parseInt(todo.year, 10) && parseInt(todo.month, 10)
            ? `${todo.month}/${todo.year.slice(2, 4)}`
            : 'No Due Date';
        return todo;
      });
    }
  },

  orderByCompleted: function(todos) {
    const completed = [];
    const notCompleted = [];

    if (todos) {
      todos.forEach(todo => {
        todo.completed ? completed.push(todo) : notCompleted.push(todo);
      });

      return notCompleted.concat(completed);
    }
  },

  orderByDate: function(todos) {
    if (todos) {
      return todos.sort(function(a, b) {
        if (a.year > b.year) {
          return 1;
        }
        if (a.year < b.year) {
          return -1;
        }
        if (a.month > b.month) {
          return 1;
        }
        if (a.month < b.month) {
          return -1;
        }
      });
    }
  },

  groupTodos: function(todos) {
    const todosWithDueDate = this.addDueDate(todos);
    const ordered = this.orderByDate(todosWithDueDate);
    const grouped = {};

    ordered.forEach(todo => {
      const dueDate = todo.due_date;
      if (Object.keys(grouped).includes(dueDate)) {
        grouped[dueDate].push(todo);
      } else {
        grouped[dueDate] = [todo];
      }
    });

    return grouped;
  },

  getCompletedTodos: function(todos) {
    return todos.filter(todo => todo.completed === true);
  },

  renderAll: function() {
    if (this.currentlyRendering === 'all' && this.currentlyRenderingDate) {
      this.renderAllByDate(this.currentlyRenderingDate);
    } else if (
      this.currentlyRendering === 'completed' &&
      this.currentlyRenderingDate
    ) {
      this.renderCompletedByDate(this.currentlyRenderingDate);
    } else if (this.currentlyRendering === 'completed') {
      this.renderCompletedTodos();
    } else {
      this.renderAllTodos();
    }
  },

  renderTodos: function(todos, headerTitle) {
    const todoTable = $('#todo-table');
    const todosWithDueDate = this.addDueDate(todos);
    const ordered = this.orderByDate(todosWithDueDate);
    const todosOrderedByCompleted = this.orderByCompleted(ordered);

    const html = this.templates.list_template({
      selected: todosOrderedByCompleted
    });

    todoTable.empty();
    todoTable.append(html);
    this.renderHeader(headerTitle, todos ? todos.length : 0);
  },

  addActiveClass: function(selector) {
    document.querySelector(selector).classList.add('active');
  },

  renderAllTodos: async function() {
    const todos = await todoManager.getTodos();

    this.renderSidebar(todos);
    this.renderTodos(todos, 'All Todos');
  },

  renderAllByDate: async function(date, target) {
    const todos = await todoManager.getTodos();
    const grouped = this.groupTodos(todos);

    this.renderSidebar(todos);
    this.renderTodos(grouped[date], date);
  },

  renderCompletedTodos: async function() {
    const todos = await todoManager.getTodos();
    const completed = this.getCompletedTodos(todos);

    this.renderSidebar(todos);
    this.renderTodos(completed, 'Completed');
  },

  renderCompletedByDate: async function(date, target) {
    const todos = await todoManager.getTodos();
    const completed = this.getCompletedTodos(todos);
    const grouped = this.groupTodos(completed);

    this.renderSidebar(todos);
    this.renderTodos(grouped[date], `Completed - ${date}`);
  },

  highlightSidebar: function() {
    if (this.currentlyRendering === 'all' && this.currentlyRenderingDate) {
      $(
        `#all_lists > dl[data-title="${this.currentlyRenderingDate}"]`
      ).addClass('active');
    } else if (
      this.currentlyRendering === 'completed' &&
      this.currentlyRenderingDate
    ) {
      $(
        `#completed_lists > dl[data-title="${this.currentlyRenderingDate}"]`
      ).addClass('active');
    } else if (this.currentlyRendering === 'completed') {
      $('#all_done_header').addClass('active');
    } else {
      $('#all_header').addClass('active');
    }
  },

  renderSidebar: function(todos) {
    this.renderAllTodosList(todos);
    this.renderCompletedTodosList(todos);
    this.highlightSidebar();
  },

  renderHeader: function(title, data) {
    const html = viewManager.templates.title_template({
      current_section: { title, data }
    });

    $('#items > header').empty();
    $('#items > header').append(html);
  },

  renderAllTodosList: function(todos) {
    const headerHtml = viewManager.templates.all_todos_template({
      todos
    });
    const todosByDate = this.groupTodos(todos);
    const listHtml = viewManager.templates.all_list_template({
      todos_by_date: todosByDate
    });

    $('#all_todos').empty();
    $('#all_todos').append(headerHtml);
    $('#all_lists').empty();
    $('#all_lists').append(listHtml);
  },

  renderCompletedTodosList: function(todos) {
    const completed = this.getCompletedTodos(todos);
    const todosByDate = this.groupTodos(completed);
    const headerHtml = viewManager.templates.completed_todos_template({
      done: completed
    });
    const listHtml = viewManager.templates.completed_list_template({
      done_todos_by_date: todosByDate
    });

    $('#completed_todos').empty();
    $('#completed_todos').append(headerHtml);
    $('#completed_lists').empty();
    $('#completed_lists').append(listHtml);
  },

  init: function() {
    this.compileTemplates();
    this.renderMain();
    this.getElementReferences();
    this.renderAll();
  }
};

const todoManager = {
  editingId: null,

  getIdFromTodoElement: function(e) {
    const item = e.currentTarget.parentNode.parentNode;
    return parseInt(item.dataset.id, 10);
  },

  getFormData: function() {
    const data = $('form').serializeArray();
    let dataObj = {};

    data.forEach(el => {
      const key = el.name.replace('due_', '');
      if (el.value.toLowerCase() !== key) {
        dataObj[key] = el.value;
      } else {
        dataObj[key] = '';
      }
    });

    return dataObj;
  },

  postData: async function(url, method, data) {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    return await response.json();
  },

  getTodo: async function(id) {
    try {
      const resp = await fetch(`/api/todos/${id}`);
      const json = await resp.json();

      return json;
    } catch (err) {
      console.log('Fetch failed', err);
    }
  },

  getTodos: async function() {
    try {
      const resp = await fetch('/api/todos');
      const json = await resp.json();

      return json;
    } catch (err) {
      console.log('Fetch failed', err);
    }
  },

  add: async function(data) {
    try {
      const response = await this.postData(`/api/todos`, 'POST', data);
      viewManager.closeModal();
      viewManager.currentlyRendering = 'all';
      viewManager.currentlyRenderingDate = null;
      viewManager.renderAll();
      return response;
    } catch (err) {
      console.log(err);
    }
  },

  update: async function(id, data) {
    try {
      const response = await this.postData(`/api/todos/${id}`, 'PUT', data);
      viewManager.closeModal();
      viewManager.renderAll();
      this.editingId = null;
      return response;
    } catch (err) {
      console.log(err);
    }
  },

  delete: async function(id) {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE'
      });
      return await response;
    } catch (err) {
      console.log(err);
    }
  },

  handleSubmitForm: function(e) {
    const data = this.getFormData();
    const title = document.getElementById('title');

    e.preventDefault();

    if (!title.validity.valid) {
      alert('You must enter a title at least 3 characters long.');
    } else {
      if (!this.editingId) {
        this.add(data);
      } else {
        this.update(this.editingId, data);
      }
    }
  },

  handleDeleteTodo: function(e) {
    const item = e.currentTarget.parentNode;
    const itemId = item.dataset.id;

    e.stopPropagation();

    this.delete(itemId).then(() => {
      viewManager.renderAll();
    });
  },

  handleClickAddTodo: function() {
    viewManager.clearForm();
    viewManager.openModal();
  },

  handleCloseModal: function(e) {
    if (e.target.id === 'modal_layer') {
      viewManager.closeModal();
    }
  },

  handleEditTodo: async function(e) {
    e.preventDefault();
    e.stopPropagation();

    const itemId = this.getIdFromTodoElement(e);
    const todo = await this.getTodo(itemId);

    viewManager.openModal();
    viewManager.populateForm(todo);
    this.editingId = itemId;
  },

  handleComplete: function(e) {
    if (!this.editingId) {
      alert('You have to add the todo before you complete it :D');
    } else {
      this.update(this.editingId, { completed: true });
    }
  },

  handleToggleComplete: function(e) {
    const id = parseInt(e.currentTarget.parentNode.dataset.id, 10);
    const checked = $(e.currentTarget)
      .children()
      .filter('input')
      .is(':checked');

    this.update(id, { completed: !checked });
  },

  handleRenderAll: function(e) {
    viewManager.currentlyRendering = 'all';
    viewManager.currentlyRenderingDate = null;
    viewManager.renderAllTodos();
  },

  handleRenderCompleted: function(e) {
    viewManager.currentlyRendering = 'completed';
    viewManager.currentlyRenderingDate = null;
    viewManager.renderCompletedTodos();
  },

  handleRenderAllByDate: function(e) {
    const date = e.currentTarget.dataset.title;

    viewManager.currentlyRendering = 'all';
    viewManager.currentlyRenderingDate = date;
    viewManager.renderAllByDate(date, e.currentTarget);
  },

  handleRenderCompletedByDate: function(e) {
    const date = e.currentTarget.dataset.title;

    viewManager.currentlyRendering = 'completed';
    viewManager.currentlyRenderingDate = date;
    viewManager.renderCompletedByDate(date, e.currentTarget);
  },

  handleKeyPress: function(e) {
    if (this.editingId && e.key === 'Escape') {
      viewManager.closeModal();
    }
  },

  bindEventListeners: function() {
    const addTodoLabel = document.querySelector('label[for="new_item"]');
    const form = document.querySelector('form');
    const completeBtn = document.getElementById('complete-btn');
    const $todoTable = $('#todo-table');

    addTodoLabel.addEventListener('click', this.handleClickAddTodo.bind(this));
    document.body.addEventListener('click', this.handleCloseModal.bind(this));
    form.addEventListener('submit', this.handleSubmitForm.bind(this));
    $todoTable.on('click', '.delete', this.handleDeleteTodo.bind(this));
    $todoTable.on('click', 'label', this.handleEditTodo.bind(this));
    $todoTable.on('click', '.list_item', this.handleToggleComplete.bind(this));
    completeBtn.addEventListener('click', this.handleComplete.bind(this));
    $('#completed_todos').on('click', this.handleRenderCompleted.bind(this));
    $('#all_todos').on('click', this.handleRenderAll.bind(this));
    $('#all_lists').on('click', 'dl', this.handleRenderAllByDate.bind(this));
    $('#completed_lists').on(
      'click',
      'dl',
      this.handleRenderCompletedByDate.bind(this)
    );
    $(document).on('keydown', this.handleKeyPress.bind(this));
  },

  init: function() {
    this.bindEventListeners();
  }
};

document.addEventListener('DOMContentLoaded', function() {
  viewManager.init();
  todoManager.init();
});
