// Temporary use during development to get around CORS
const devHost = 'http://localhost:3000';
let currentId = 0;

// Responsible for generating new todos
class Todo {
  constructor({ title, dueDate, description }) {
    this.id = currentId;
    this.title = title;
    this.dueDate = dueDate;
    this.description = description;
  }
}

// Responsible for processing list of todos
const todoList = {};

// Responsible for rendering
const ui = {
  templates: [],
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

      this.templates.push({ id, script: templateScript });
    });
  },
  renderMain: function() {
    const mainTemplate = this.templates.find(
      template => template.id === 'main_template'
    );
    const html = mainTemplate.script({});

    document.body.innerHTML = html;
  },
  init: function() {
    this.compileTemplates();
    this.renderMain();
  }
};

// Responsibile for handling events
const todoManager = {
  handleOpenModal: function() {
    $('#form_modal').fadeIn();
    $('#modal_layer').fadeIn();
  },
  handleCloseModal: function(e) {
    if (e.target.id === 'modal_layer') {
      $('#form_modal').fadeOut();
      $('#modal_layer').fadeOut();
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
  delete: async function(id) {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'DELETE'
    });

    return await response;
  },
  getTodos: async function() {
    try {
      const resp = await fetch('/api/todos');
      return await resp.json();
    } catch (err) {
      console.log('Fetch failed', err);
    }
  },
  renderHeader: function(title, data) {
    const titleTemplate = ui.templates.find(
      template => template.id === 'title_template'
    );
    const html = titleTemplate.script({
      current_section: { title, data }
    });

    $('header').empty();
    $('header').append(html);
  },
  renderTodos: async function() {
    const todos = await this.getTodos();
    const todoTable = $('#todo-table');
    const numberOFTodos = todos.length;
    const listTemplate = ui.templates.find(
      template => template.id === 'list_template'
    );
    const html = listTemplate.script({
      selected: todos
    });

    todoTable.empty();
    todoTable.append(html);
    this.renderHeader('All Todos', numberOFTodos);
  },
  handleAddTodo: async function(e) {
    const data = this.getFormData();
    const title = document.getElementById('title');

    e.preventDefault();

    if (!title.validity.valid) {
      alert('You must enter a title at least 3 characters long.');
    } else {
      try {
        const response = await this.postData(`/api/todos`, data);
        this.renderTodos();
      } catch (err) {
        console.log(err);
      }
    }
  },
  handleDeleteTodo: function(e) {
    const item = e.currentTarget.parentNode;
    const itemId = item.dataset.id;
    this.delete(itemId);
    this.renderTodos();
  },
  bindEventListeners: function() {
    const addTodoLabel = document.querySelector('label[for="new_item"]');
    const form = document.querySelector('form');

    addTodoLabel.addEventListener('click', this.handleOpenModal.bind(this));
    document.body.addEventListener('click', this.handleCloseModal.bind(this));
    form.addEventListener('submit', this.handleAddTodo.bind(this));
    $('body').on('click', '.delete', this.handleDeleteTodo.bind(this));
  },
  init: function() {
    this.renderTodos();
    this.bindEventListeners();
  }
};

document.addEventListener('DOMContentLoaded', function() {
  ui.init();
  todoManager.init();
});
