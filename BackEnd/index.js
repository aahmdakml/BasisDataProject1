const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");

//middleware
app.use(cors());
app.use(express.json());

//ROUTES

//create a todo

app.post("/todos", async (req, res) => {
    try {
        const { description } = req.body;
        const newTodo = await pool.query(
            "INSERT INTO todos (todo_desc) VALUES ($1) RETURNING *", [todo_desc]
        );
        res.json(newTodo.rows[0]);
    }catch (err){
        res.json(err);
    }
});

//get all todo 

app.get("/todos", async(req, res) => {
    try{
        const allTodos = await pool.query("SELECT * from todos");
        res.json(allTodo.rows);
    } catch (err){
        res.json(err);
    }
});

//get a todo

app.get("/todos", async(req, res) => {
    try {
        console.log(req.params);
    }catch (err){
        res.json(err);
    }
})


//update todo

//delete todo

app.listen(8080, () => {
    console.log("Server is running on PORT 8080")
});