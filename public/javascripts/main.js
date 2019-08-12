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
  getTodos: async function() {
    try {
      const resp = await fetch('/api/todos');
      console.log(await resp.json());
    } catch (err) {
      console.log('Fetch failed', err);
    }
  },
  renderTodos: function() {
    this.getTodos();
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
        console.log(response);
      } catch (err) {
        console.log(err);
      }
    }
  },
  bindEventListeners: function() {
    const addTodoLabel = document.querySelector('label[for="new_item"]');
    const form = document.querySelector('form');

    addTodoLabel.addEventListener('click', this.handleOpenModal.bind(this));
    document.body.addEventListener('click', this.handleCloseModal.bind(this));
    form.addEventListener('submit', this.handleAddTodo.bind(this));
  },
  init: function() {
    this.bindEventListeners();
    this.renderTodos();
  }
};

document.addEventListener('DOMContentLoaded', function() {
  ui.init();
  todoManager.init();
});

// Test
// document.addEventListener('DOMContentLoaded', function() {
// const getTodos = async () => {
//   const data = await fetch(`${devHost}/api/todos`);
//   console.log('todos', await data.json());
// };
//   getTodos();
// });
