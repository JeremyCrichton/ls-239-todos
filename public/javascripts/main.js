// class Todo {
//   constructor({ title, dueDate, description }) {
//     this.id = currentId;
//     this.title = title;
//     this.dueDate = dueDate;
//     this.description = description;
//   }
// }

const todoList = {
  list: [],
  saveTodos: function(todos) {
    this.list = todos;
  },
  getTodoById: function(id) {
    return this.list.find(todo => todo.id === id);
  }
};

const viewManager = {
  templates: {},

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

  renderMain: function() {
    const html = this.templates.main_template({});

    document.body.innerHTML = html;
  },

  addDueDate: function(todos) {
    return todos.map(todo => {
      todo.due_date =
        parseInt(todo.year, 10) && parseInt(todo.month, 10)
          ? `${todo.month}/${todo.year}`
          : 'No Due Date';
      return todo;
    });
  },

  orderByCompleted: function(todos) {
    const completed = [];
    const notCompleted = [];

    todos.forEach(todo => {
      todo.completed ? completed.push(todo) : notCompleted.push(todo);
    });

    return notCompleted.concat(completed);
  },

  orderByDate: function(todos) {
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

  renderAll: async function() {
    const todos = await todoManager.getTodos();
    this.renderTodos(todos);
    this.renderHeader('All Todos', todos.length);
    this.renderAllTodosList(todos);
    this.renderCompletedTodosList(todos);
  },

  renderTodos: function(todos) {
    const todoTable = $('#todo-table');
    const todosWithDueDate = this.addDueDate(todos);
    const ordered = this.orderByDate(todosWithDueDate);
    const todosOrderedByCompleted = this.orderByCompleted(ordered);

    const html = this.templates.list_template({
      selected: todosOrderedByCompleted
    });

    todoTable.empty();
    todoTable.append(html);
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

  init: function() {
    this.compileTemplates();
    this.renderMain();
    this.getElementReferences();
    this.renderAll();
  }
};

const todoManager = {
  editingId: null,

  handleClickAddTodo: function() {
    viewManager.clearForm();
    viewManager.openModal();
  },

  handleCloseModal: function(e) {
    if (e.target.id === 'modal_layer') {
      viewManager.closeModal();
    }
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

  // getTodo: async function(id) {
  //   try {
  //     const resp = await fetch(`/api/todos/${id}`);
  //     const json = await resp.json();
  //     return json;
  //   } catch (err) {
  //     console.log('Fetch failed', err);
  //   }
  // },

  getTodos: async function() {
    try {
      const resp = await fetch('/api/todos');
      const json = await resp.json();
      todoList.saveTodos(json);
      return json;
    } catch (err) {
      console.log('Fetch failed', err);
    }
  },

  add: async function(data) {
    try {
      const response = await this.postData(`/api/todos`, 'POST', data);
      viewManager.closeModal();
      viewManager.renderAll();
      return response;
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

  handleDeleteTodo: function(e) {
    const item = e.currentTarget.parentNode;
    const itemId = item.dataset.id;

    this.delete(itemId).then(() => {
      viewManager.renderAll();
    });
  },

  update: async function(id, data) {
    try {
      const response = await this.postData(`/api/todos/${id}`, 'PUT', data);
      viewManager.closeModal();
      viewManager.renderTodos();
      this.editingId = null;
      return response;
    } catch (err) {
      console.log(err);
    }
  },

  getIdFromTodoElement: function(e) {
    const item = e.currentTarget.parentNode.parentNode;
    return parseInt(item.dataset.id, 10);
  },

  handleEditTodo: function(e) {
    e.preventDefault();
    viewManager.openModal();
    const itemId = this.getIdFromTodoElement(e);
    const todo = todoList.getTodoById(itemId);

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
    const id = this.getIdFromTodoElement(e);
    const checked = e.target.previousElementSibling.checked;

    this.update(id, { completed: !checked });
  },

  bindEventListeners: function() {
    const addTodoLabel = document.querySelector('label[for="new_item"]');
    const form = document.querySelector('form');
    const completeBtn = document.getElementById('complete-btn');
    const $todoTable = $('#todo-table');

    addTodoLabel.addEventListener('click', this.handleClickAddTodo.bind(this));
    document.body.addEventListener('click', this.handleCloseModal.bind(this));
    form.addEventListener('submit', this.handleSubmitForm.bind(this));
    $('body').on('click', '.delete', this.handleDeleteTodo.bind(this));
    $todoTable.on('click', 'label', this.handleEditTodo.bind(this));
    $todoTable.on('click', '.check', this.handleToggleComplete.bind(this));
    completeBtn.addEventListener('click', this.handleComplete.bind(this));
  },

  init: function() {
    this.bindEventListeners();
  }
};

document.addEventListener('DOMContentLoaded', function() {
  viewManager.init();
  todoManager.init();
});
