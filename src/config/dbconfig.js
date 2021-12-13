const mysql = require('mysql');

// First you need to create a connection to the database
// Be sure to replace 'user' and 'password' with the correct values
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'aiteglbu_hukerapp',
  password: 'Faithful@123',
  database: 'aiteglbu_hukerapp',
});

conn.connect((err) => {
  if(err){
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established');
});

module.exports = conn;

// con.end((err) => {
//   // The connection is terminated gracefully
//   // Ensures all remaining queries are executed
//   // Then sends a quit packet to the MySQL server.
// });