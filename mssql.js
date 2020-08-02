const sql = require('mssql')

const config = {
    user: 'sa',
    password: 'Inf0Maic',
    server: 'localhost', 
    port : 1433,
    database: 'Company',
    // options: {
    //     encrypt: true // Use this if you're on Windows Azure
    // }
}
var conn = new sql.ConnectionPool(config);

 conn.connect()
 // Successfull connection
 .then(function () {

   // Create request instance, passing in connection instance
   var req = new sql.Request(conn);

   // Call mssql's query method passing in params
   req.query("select * from Employee")
   .then(function (recordset) {
     console.dir(recordset);
     conn.close();
   })
   // Handle sql statement execution errors
   .catch(function (err) {
     console.log(err);
     conn.close();
   })
 })
 // Handle connection errors
 .catch(function (err) {
   console.log(err);
   conn.close();
 });