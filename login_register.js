const express = require('express');  
const bodyParser = require('body-parser');  
const bcrypt = require('bcrypt');  
const pool = require('./db');  
const jwt = require('jsonwebtoken');

const app = express();  
app.use(bodyParser.json());  

const saltRounds = 12;  
const JWT_SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VybmFtZSI6ImJlbnNvbiBib29uZSIsImlhdCI6MTc0NTk1MTYzNCwiZXhwIjoxNzQ1OTU1MjM0fQ.C3FuNlnRvFMQFO8-p3sKkAaiwlKIWDnbuUXfMdEut4A';

// REGISTER  
app.post('/register', async (req, res) => {  
  try {  
    const { username, password } = req.body;  
    console.log('1')
    // Hash user input password  
    const hashedPassword = await bcrypt.hash(password, saltRounds);  
    console.log('2')
    // Insert user into DB  
    
    const result = await pool.query(  
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING user_id',  
      [username, hashedPassword]  
    );  
    console.log('3')

    res.status(201).json({ message: 'User registered', userId: result.rows[0].user_id });  
  } catch (err){
    console.log('4');
    console.error('Error:', err.message);
    res.json(err);

  }  
});  

// LOGIN  
app.post('/login', async (req, res) => {  
  try {  
    const { username, password } = req.body;  

    // Get user from DB  
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);  
    if (result.rowCount === 0) {  
      return res.status(400).json({ message: 'Invalid username or password' });  
    }  

    const user = result.rows[0];  

    // Compare password  
    const match = await bcrypt.compare(password, user.password);  
    if (!match) {  
      return res.status(400).json({ message: 'Invalid username or password' });  
    }  

    const token = jwt.sign({ user_id: user.user_id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    console.log("Login successful:", token);

    res.json({ message: 'Login successful', userId: user.user_id });  
  } catch (err) {  
    console.error(err);  
    res.status(500).json({ message: 'Error logging in' });  
  }  
});  

app.listen(3000, () => console.log('Server running on port 3000'));  