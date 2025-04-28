const Pool = require("pg").Pool;

const pool = new Pool({
    user: "postgres",
    password: "rendy",
    host: "localhost",
    port: 5432,
    database: "todos_app"
});

module.exports = pool;