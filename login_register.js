const express = require('express');  
const bodyParser = require('body-parser');  
const bcrypt = require('bcrypt');  
const { Pool } = require('./db');  

const app = express();  
app.use(bodyParser.json());  

const saltRounds = 12;  

// REGISTER  
app.post('/register', async (req, res) => {  
  try {  
    const { username, email, password } = req.body;  

    // Hash the password  
    const hashedPassword = await bcrypt.hash(password, saltRounds);  

    // Insert user into DB  
    const result = await pool.query(  
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING user_id',  
      [username, email, hashedPassword]  
    );  

    res.status(201).json({ message: 'User registered', userId: result.rows[0].user_id });  
  } catch (err) {  
    console.error(err);  
    res.status(500).json({ message: 'Error registering user' });  
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

    res.json({ message: 'Login successful', userId: user.user_id });  
  } catch (err) {  
    console.error(err);  
    res.status(500).json({ message: 'Error logging in' });  
  }  
});  

app.listen(3000, () => console.log('Server running on port 3000'));  