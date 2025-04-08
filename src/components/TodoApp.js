import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import '../App.css';

function TodoApp({ username }) {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editId, setEditId] = useState(null);
  const [time, setTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // User key
  const getUserStorageKey = () => {
    return `todos_${username}`;
  };
  
  const CONFIG = {
    appTitle: "Get Things Done!",
    localStorage: {
      enabled: true,
      key: getUserStorageKey() // User key
    },
    clock: {
      enabled: true,
      updateInterval: 1000, 
      format: {
        showDate: true,
        showTime: true
      }
    },
    placeholders: {
      newTask: "Upcoming tasks??",
      editTask: "Update task"
    },
    emptyMessage: "No tasks yet! Add a task to get started."
  };

  // Handle responsive design
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (CONFIG.localStorage.enabled) {
      const savedTodos = JSON.parse(localStorage.getItem(CONFIG.localStorage.key)) || [];
      setTodos(savedTodos);
    }
  }, [CONFIG.localStorage.key]); // On storage key change

  useEffect(() => {
    if (CONFIG.localStorage.enabled) {
      localStorage.setItem(CONFIG.localStorage.key, JSON.stringify(todos));
    }
  }, [todos, CONFIG.localStorage.key]);

  useEffect(() => {
    if (CONFIG.clock.enabled) {
      const intervalId = setInterval(() => {
        setTime(new Date());
      }, CONFIG.clock.updateInterval);

      return () => clearInterval(intervalId); // Cleanup interval
    }
  }, []);

  const addTodo = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const newTodo = {
        id: uuidv4(),
        task: inputValue,
        completed: false
      };
      setTodos([...todos, newTodo]);
      setInputValue('');
    }
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleComplete = (id) => {
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const startEditing = (todo) => {
    setEditId(todo.id);
    setEditValue(todo.task);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (editValue.trim()) {
      setTodos(
        todos.map(todo =>
          todo.id === editId ? { ...todo, task: editValue } : todo
        )
      );
      setEditId(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditValue('');
  };

  const renderTime = () => {
    if (!CONFIG.clock.enabled) return null;

    let timeString = '';
    if (CONFIG.clock.format.showDate) {
      timeString += time.toLocaleDateString() + ' ';
    }
    if (CONFIG.clock.format.showTime) {
      timeString += time.toLocaleTimeString();
    }

    return (
      <div className="current-time">
        <p>{timeString}</p>
      </div>
    );
  };

  const renderAddTodoForm = () => {
    return (
      <form onSubmit={addTodo} className={`todo-form ${isMobile ? 'mobile-form' : ''}`}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="todo-input"
          placeholder={CONFIG.placeholders.newTask}
        />
        <button type="submit" className="todo-btn add-btn">{isMobile ? '+' : '+Task'}</button>
      </form>
    );
  };

  const renderEditForm = (todo) => {
    return (
      <form onSubmit={saveEdit} className={`todo-form edit-form ${isMobile ? 'mobile-edit-form' : ''}`}>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="todo-input"
          placeholder={CONFIG.placeholders.editTask}
        />
        <div className="edit-buttons">
          <button type="submit" className="todo-btn save-btn">{isMobile ? '✓' : 'Save'}</button>
          <button type="button" className="todo-btn cancel-btn" onClick={cancelEdit}>{isMobile ? '✕' : 'Cancel'}</button>
        </div>
      </form>
    );
  };

  const renderTodoItem = (todo) => {
    if (editId === todo.id) {
      return renderEditForm(todo);
    }

    return (
      <div className={`todo-item ${isMobile ? 'mobile-todo-item' : ''}`} key={todo.id}>
        <p
          className={`todo-text ${todo.completed ? "completed" : ""}`}
          onClick={() => toggleComplete(todo.id)}
        >
          {todo.task}
        </p>
        <div className="todo-actions">
          <button className="action-btn edit-btn" onClick={() => startEditing(todo)}>
            {isMobile ? '✎' : 'Edit'}
          </button>
          <button className="action-btn delete-btn" onClick={() => deleteTodo(todo.id)}>
            {isMobile ? '🗑️' : 'Delete'}
          </button>
        </div>
      </div>
    );
  };

  const renderTodoList = () => {
    if (todos.length === 0) {
      return <p className="empty-message">{CONFIG.emptyMessage}</p>;
    }

    return (
      <div className={`todo-list ${isMobile ? 'mobile-todo-list' : ''}`}>
        {todos.map(todo => (
          <div key={todo.id}>
            {renderTodoItem(todo)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`todo-app ${isMobile ? 'mobile-todo-app' : ''}`}>
      <h1 className={isMobile ? 'mobile-title' : ''}>{CONFIG.appTitle}</h1>
      {renderTime()}
      {renderAddTodoForm()}
      {renderTodoList()}
    </div>
  );
}

export { TodoApp };
export default TodoApp;