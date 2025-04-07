import React, {useState} from 'react'

export const EditTL = ({editTodo, task}) => {
    const [value, setValue] = useState(task.task);

    const handleSubmit = (e) => {
      editTodo(value, task.id);
      e.preventDefault();
      };
  return (
    <form onSubmit={handleSubmit} className="TodoList">
    <input type="text" value={value} onChange={(e) => setValue(e.target.value)} className="todo-input" placeholder='Update task' />
    <button type="submit" className='todo-btn'>EditTask</button>
  </form>
  )
}
