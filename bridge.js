 // 1.
 var sql = require('mssql')
//2.
 var config = {
   // driver: 'msnodesqlv8',
   server: 'localhost',
   database: 'VPAC',
   user: 'sa',

 password: 'Inf0Maic'
}
 
 let line="SELECT TOP 100 [AcNo],[AcName],[AcType] FROM [VPAC].[dbo].[WsAccTbl]"

 sql.connect(config, function (err) {
    
    if (err) console.log(err);

    // create Request object
    var request = new sql.Request();
       
    // query to the database and get the records
    request.query(line, function (err, recordset) {
        
        if (err) console.log(err)

        // send records as a response
        console.log(recordset)
        
    });
});