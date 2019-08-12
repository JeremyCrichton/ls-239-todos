// class Todo {
//   constructor({ title, dueDate, description }) {
//     this.id = currentId;
//     this.title = title;
//     this.dueDate = dueDate;
//     this.description = description;
//   }
// }

const todoList = {
  list: []
};

const viewManager = {
  templates: {},

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

  renderMain: function() {
    const html = this.templates.main_template({});

    document.body.innerHTML = html;
  },

  renderTodos: async function() {
    const todos = await todoManager.getTodos();
    const todoTable = $('#todo-table');
    const html = this.templates.list_template({
      selected: todos
    });

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
    const title = document.getElementById('title');
    const description = document.getElementById('description');
    const day = document.getElementById('due_day');
    const month = document.getElementById('due_month');
    const year = document.getElementById('due_year');

    title.value = '';
    description.value = '';
    [day, month, year].forEach(input => {
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

  init: function() {
    this.compileTemplates();
    this.renderMain();
    this.renderTodos();
  }
};

const todoManager = {
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
      dataObj[key] = el.value;
    });

    let { day, month, year } = dataObj;

    if (day === 'Day' || month === 'Month' || year === 'Year') {
      delete dataObj.day;
      delete dataObj.month;
      delete dataObj.year;
    }

    return dataObj;
  },

  postData: async function(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    return await response.json();
  },

  getTodos: async function() {
    try {
      const resp = await fetch('/api/todos');
      return await resp.json();
    } catch (err) {
      console.log('Fetch failed', err);
    }
  },

  add: async function(data) {
    try {
      const response = await this.postData(`/api/todos`, data);
      viewManager.closeModal();
      viewManager.renderTodos();
      return response;
    } catch (err) {
      console.log(err);
    }
  },

  handleAddTodo: function(e) {
    const data = this.getFormData();
    const title = document.getElementById('title');

    e.preventDefault();

    if (!title.validity.valid) {
      alert('You must enter a title at least 3 characters long.');
    } else {
      this.add(data);
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

  bindEventListeners: function() {
    const addTodoLabel = document.querySelector('label[for="new_item"]');
    const form = document.querySelector('form');

    addTodoLabel.addEventListener('click', this.handleClickAddTodo.bind(this));
    document.body.addEventListener(
      'click',
      this.handleClickModalLayer.bind(this)
    );
    form.addEventListener('submit', this.handleAddTodo.bind(this));
    $('body').on('click', '.delete', this.handleDeleteTodo.bind(this));
  },

  init: function() {
    this.bindEventListeners();
  }
};

document.addEventListener('DOMContentLoaded', function() {
  viewManager.init();
  todoManager.init();
});
