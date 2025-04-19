// const {error} = require("node:console");
const {Pool} = require("pg");

const pool = new Pool({
    user: "postgres",
    password: "rendy",
    host: "localhost",
    port: 5432,
    database: "todos_app"
});

pool.connect();

pool.query(`Select * from todos`, (err, res) => {
    if(!err){
        console.log(res.rows);
    }else{
        console.log(err.message);
    }
    pool.end;
});

module.exports = pool;