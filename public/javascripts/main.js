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

  renderTodos: async function() {
    const todos = await todoManager.getTodos();
    const html = this.templates.list_template({
      selected: todos
    });
    const todoTable = $('#todo-table');

    todoTable.empty();
    todoTable.append(html);
    this.renderHeader('All Todos', todos.length);
  },

  renderHeader: function(title, data) {
    const html = viewManager.templates.title_template({
      current_section: { title, data }
    });

    $('header').empty();
    $('header').append(html);
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
    this.renderTodos();
  }
};

const todoManager = {
  editingId: null,

  handleClickAddTodo: function() {
    viewManager.clearForm();
    viewManager.openModal();
  },

  handleClickModalLayer: function(e) {
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
      viewManager.renderTodos();
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
      viewManager.renderTodos();
    });
  },

  update: async function(id, data) {
    try {
      const response = await this.postData(`/api/todos/${id}`, 'PUT', data);
      viewManager.closeModal();
      viewManager.renderTodos();
      this.editingId = null;
      console.log(response);
      return response;
    } catch (err) {
      console.log(err);
    }
  },

  handleEditTodo: function(e) {
    e.preventDefault();
    viewManager.openModal();
    const item = e.currentTarget.parentNode.parentNode;
    const itemId = parseInt(item.dataset.id, 10);
    const todo = todoList.getTodoById(itemId);

    viewManager.populateForm(todo);
    this.editingId = itemId;
  },

  bindEventListeners: function() {
    const addTodoLabel = document.querySelector('label[for="new_item"]');
    const form = document.querySelector('form');

    addTodoLabel.addEventListener('click', this.handleClickAddTodo.bind(this));
    document.body.addEventListener(
      'click',
      this.handleClickModalLayer.bind(this)
    );
    // form.addEventListener('submit', this.handleAddTodo.bind(this));
    form.addEventListener('submit', this.handleSubmitForm.bind(this));
    $('body').on('click', '.delete', this.handleDeleteTodo.bind(this));
    $('#todo-table').on('click', 'label', this.handleEditTodo.bind(this));
  },

  init: function() {
    this.bindEventListeners();
  }
};

document.addEventListener('DOMContentLoaded', function() {
  viewManager.init();
  todoManager.init();
});
