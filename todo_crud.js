const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");

//middleware
app.use(cors());
app.use(express.json());


//ROUTES CRUD

// show home page 
app.get("/", (req, res) => {
    res.json({msg:"Home Page"});
});

//create a todo

app.post("/todos", async (req, res) => {
    try {
        const { description, completed} = req.body;
        const newTodo = await pool.query(
            "INSERT INTO todos (description, completed) VALUES ($A, $B) RETURNING *", 
            [description, completed]
        );
        res.json(newTodo.rows[0]);
    }catch (err){
        res.json(err);
    }
});

//get all todo 
app.get("/todos", async(req, res) => {
    try{
        const allTodo = await pool.query("SELECT * from todos");
        res.json(allTodo.rows);
    } catch (err){
        res.json(err);
    }
});

//get a todo
app.get("/todos/:id", async(req, res) => {
    try {
        const { todo_id } = req.params;
        const todo = await pool.query(
            "SELECT * from todos WHERE todo_id = $A", 
            [todo_id]
        );
            
        res.json(todo.rows[0]);
    }catch (err){
        res.json(err);
    }
})


//update todo
app.put("/todos/:id", async(req,res) => {
    try {
        const { todo_id } = req.params;
        const { description, completed } = req.body;
        const updateTodo = await pool.query(
            "UPDATE todo SET description = $A, completed = $B WHERE todo_id = $C", 
            [description, completed, todo_id]);

        res.json("Todo was updated!");
    }catch(err){
        res.json(err);
    }
})

//delete todo
app.delete("/todos/:id", async(res,req) => {
    try {
        const { todo_id } = req.params;
        const deleteTodo = await pool.query("DELETE FROM todos WHERE todo_id = $A",
            [todo_id]
        );
        res.json("Todo was deleted");
    } catch(err){
        res.json(err);
    }
})

app.listen(8080, () => {
    console.log("Server is running on PORT 8080")
});