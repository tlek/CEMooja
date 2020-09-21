
// // 1.
// var sql = require('mssql')
// //2.
//  var config = {
//   //  driver: 'msnodesqlv8',
//   server: 'localhost',
//   database: 'Company',
//   user: 'sa',
//   password: 'Inf0Maic'
// }

const bodyParser = require('body-parser')
const mysql = require('mysql')
const path = require('path')
const hbs = require('hbs')
const express = require('express')
const { isBuffer } = require('util')
const { json } = require('body-parser')
const app = express()
const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, './templates/views')
const partialsPath = path.join(__dirname, './templates/partials')

hbs.registerPartials(partialsPath)
app.set('view engine', 'hbs')
app.set("views", viewsPath)
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.json({limit: '1mb'}))

const pool = mysql.createPool({
    host : 'blackie.synology.me',
    port : 3307,
    user : 'foo', 
    password : 'OOOttafagvah#1918',
    database : 'rochanaTest',
    dateStrings : true,
    multipleStatements: true
})

//pool.connect()
// app.post('/feed',(req,res)=>{
//     console.log(req.query)
//     console.log(typeof(req.query.Mdate))
//     console.log(req.query.Lot.length)
// })
app.post('/feed',(req,res)=>{
    req.body.data.forEach(function(element){
        // const sql = `SET @p0='${element.FeedCode}'; SET @p1='${element.Mdate}'; SET @p2='${element.Lot}'; SET @p3='${element.Quantity}'; SET @p4='${element.PPK}'; CALL getFeedInfo(@p0, @p1, @p2, @p3, @p4, @p5); SELECT @p5 AS recordId;`
        const sql = `CALL getFeedInfo('${element.FeedCode}','${element.Mdate}','${element.Lot}','${element.Quantity}','${element.PPK}', @p5); SELECT @p5 AS recordId;`
        pool.query(sql,(error, rows)=>{
            if(error) throw error
            if(rows.length === 0){
                console.log("return null")
            }else{
                //console.log(rows.RowDataPacket)
                console.log("Record ID = "+rows[rows.length-1][0].recordId )
            }
        }) 
    })
    res.send(`Received feed manufactored info ${req.body.data.length} lots.`)
    //? this way sender will get acknowledge if message was receieve however if error after call sql no error shown just no record add or updated
})
// app.post('/feed',(req, res)=>{
//     const chkType = `SELECT * FROM Feed_Codes WHERE FeedCode = '${req.query.FeedCode}';`
//     const chkRepeat = `SELECT * FROM Feed_Manifold WHERE Lot_Number = '${req.query.Lot}';`
//     const q = `INSERT INTO Feed_Manifold (Type, Date, Lot_Number, Amount, PPK) \
//      VALUES ('${req.query.FeedCode}', '${req.query.MDate}', '${req.query.Lot}', '${req.query.Amount}', '${req.query.PPK}' );`
//     const journal = `INSERT INTO Event_Logs (EventDate, Creator, EventType, PigId, PigType)values( '${req.query.MDate}', '3', '81', '0', 'V');`
//     pool.query(chkType, (error, rows)=>{
//         if(error) throw error
//         if (rows.length === 0){
//             res.send('Unreconized Feed Code')
//             console.log(chkType)
//             console.log(req.query)
//         } else {
//             console.log(req.query)
//             console.log(row.length) 
//             pool.query(chkRepeat,(error, rows)=>{
//                 if(error) throw error
//                 if(rows.length > 0){
//                     res.send('Lot number of This feed had been received and cannot be duplicated. Please check the lot number')
//                     console.log('Repeated lot number Attempted')
//                 } else {
//                     pool.query(q,(error)=>{
//                         if(error)throw error
//                         res.send('New Feed batch info received')
//                         pool.query(journal,(error)=>{
//                             if (error) throw error
//                             console.log("The new feed batch info received and Journaled")
//                         })
//                     })
//                 }
//             })
//        }
//     })
// }) 
 //? still not good
// app.post('/feed', (req,res)=>{
//     // let updated = 0, added = 0
//     // const objectResult = {"Updated": updated, "Added": added}
//     console.log(req.body)
//     const madeFeed = function(lotNo, objectResult, callback){
//         return new Promise((add, update)=>{
//             const chkRepeat = `SELECT * FROM Feed_Manifold WHERE Lot_Number = '${lotNo}';`
//             pool.query(chkRepeat,(error, rows)=>{
//                 if(error)throw error
//                 if(rows.length > 0){
//                     update()
//                     objectResult.Updated++
//                     callback(objectResult)
                    
//                 }else {
//                     add()
//                     objectResult.Added++
//                     callback(objectResult)
//                 }
//             })
//         })
//     }

//     const roleCheck = function(feedArray, callback){
//         let updated = 0, added = 0
//         const objectResult = {"Updated": updated, "Added": added}
//         feedArray.forEach(function(element, index){
//             console.log("รายการที่ "+(index+1) + " Feed "+ element.FeedCode +" เลขล็อต "+element.Lot+" Amount: "+element.Amount+" กก. ราคา = "+element.PPK+ " ต่อกก.")
//             madeFeed(element.Lot,objectResult, ()=>{
//                 console.log(objectResult)
//             //res.send(`Received feed manufactored info ${req.body.data.length} lots. Updated : ${objectResult.Updated} New : ${objectResult.Added}`)
//             }) 
//             .then(()=>{
//                 console.log("must add new record for " + element.Lot)

//             })
//             .catch(()=>{
//                 console.log( "just update record "+ element.Lot)
//             })
//         })
//         callback(objectResult)
//     }
  
//     mfcLog =  `INSERT INTO Event_Logs (EventDate, Creator, EventType, PigId, PigType)values( '${req.body.data[0].MDate}', '-1', '81', '0', 'A');`
//     // excute one time here
  
// //   res.send("Received feed manufactored info "+ req.body.data.length + " lots")
//     roleCheck(req.body.data,(objectResult)=>{
//         console.log(`Received feed manufactored info ${req.body.data.length} lots. Updated : ${objectResult.Updated} New : ${objectResult.Added}`)
//         res.send(`Received feed manufactored info ${req.body.data.length} lots. Updated : ${objectResult.Updated} New : ${objectResult.Added}`)
//     })
// })

app.get('/',(req,res)=>{ 
    res.render('index',{title:'หมูจ๋า CE bridge', msg:'temporary for testing only มีไว้ชั่วคราวสำหรับการทดสอบ', author:'Somporn'})
})

app.get('/client', (req, res)=>{
    const q = 'SELECT * FROM Client_Manifold WHERE active ORDER BY T_name '
    pool.query(q, function(error,rows){
        if(error) throw error
        let clientList = '<table class="table table-hover table-sm"><th>id</th><th>Name</th><th>Class</th><th>ref1</th><th>AC_Id</th>'
        rows.forEach(client => {
            clientList += '<tr><td>'+client.id+'</td><td>'+client.T_name+'</td><td>'+client.Class+'</td><td>'+client.ref1+'</td><td>'+client.vpat_Ref1+'</td><tr>'
        });
        res.render('clients',{title:'หมูจ๋า CE', clientList: clientList })
    })
})

app.get('/feed/check', (req, res)=>{
    const qFeed = 'SELECT Type, Feed_Codes.T_Definition, mfcDate, Date, Lot_Number, Amount, PPK  FROM Feed_Manifold LEFT JOIN Feed_Codes on Feed_Manifold.Type = Feed_Codes.FeedCode order by mfcDate DESC'
    pool.query(qFeed, (err,rows)=>{
        if(err)throw err
        let feedList = '<table class="table table-hover table-sm"><th>สูตร</th><th>ชื่อสูตร</th><th>MDate(วันผลิต)</th><th>วันรับข้อมูล</th><th>Lot(ล็อต)</th><th>ปริมาณผลิต(กก)</th><th>PPK(ราคากก.)</th>'
        rows.forEach(feed => {
            feedList += '<tr><td>'+feed.Type+'</td><td>'+feed.T_Definition+'</td><td>'+feed.mfcDate+'</td><td>'+feed.Date+'</td><td>'+feed.Lot_Number+'</td><td>'+feed.Amount+'</td><td>'+feed.PPK+'</td><tr>'
        })
        
       res.render('feeds',{title:'หมูจ๋า CE', Head:'ข้อมูลอาหารสัตว์ที่รับผ่าน API', author: 'Somporn', feedList: feedList })
    })
})

app.get('/feed/map', (req, res)=>{
    const feedMap = 'SELECT * FROM Feed_Codes ORDER BY FeedCode' 
    pool.query(feedMap, (err,rows)=>{
        if(err)throw err
        let feedCodes = '<table class="table table-hover table-sm"><th>FeedCode</th><th>Account ID</th><th>Definition</th><th>ชื่อสูตรอาหาร</th>'
        rows.forEach(feed => {
            feedCodes += '<tr><td>'+feed.FeedCode+'</td><td>'+feed.AC_Id+'</td><td>'+feed.Definition+'</td><td>'+feed.T_Definition+'</td><tr>'           
        })
       res.render('feeds',{title:'หมูจ๋า CE', Head:'รหัส-ชื่อสูตรอาหาร', author:'Somporn', feedList: feedCodes})
    })
})

app.get('/feed/map/json', (req, res)=>{
    const feedMap = 'SELECT * FROM Feed_Codes ORDER BY FeedCode' 
    pool.query(feedMap, (err,rows)=>{
        if(err)throw err
        const farmFeed = []
        const jsonFeed = {"feed":farmFeed}
        rows.forEach(feed => {
            farmFeed.push({id:feed.id, AC_Id:feed.AC_Id, feedCode:feed.FeedCode, Def:feed.Definition, Tdef:feed.T_Definition})
        })
        // res.send(farmFeed)
        res.send(jsonFeed)
       //console.log(farmFeed)
    })
})


app.get('/ce/qtest', (req,res)=>{
    sql.connect(config, function (err) {   
      //if (err) console.log(err);
      var request = new sql.Request();
      sql.connect(config, function(err){
        if (err) throw(err)
        var request = new sql.Request();
        request.query('select * from Employee', function(err,rows){
          if (err) throw(err)
            let employee = '<table class="table table-hover table-sm"><th>Emp#</th><th>Name</th><th>เงินเดือน</th><th>เลขแผนก</th>'
  
          rows.recordset.forEach(emp => {
            employee += '<tr><td>'+emp.EmpNo+'</td><td>'+emp.EmpName+'</td><td>'+emp.Salary+'</td><td>'+emp.DeptNo+'</td><tr>'
          })
         employee += '</table>'
          res.render('employee',{title:'หมูจ๋า CE', Head:'พนักงาน(ข้อมูลจาก MSSQL)', author:'Somporn', empList: employee})
          // console.log(rows)
        })
      })
  })})

app.get('/ce/intRequest',(req,res)=>{

    res.send('it gonna be a while for this request.')
}) 

app.get('/ce/catch',(req,res)=>{

    res.send('coming soon will have catching info in JSON for A/P')
})

app.get('/ce/sell',(req,res)=>{

    res.send('coming soon will have selling info in JSON ready for A/R')
})

app.get('*',(req, res)=>{
    res.send( '<h2>OOPs nothing here sorry. Please check your request format</h2>')
})
app.post('*',(req,res)=>{
    res.send('Unable to record the post message')
})

app.listen(port, ()=>{
    console.log('server listening on port:=> '+ port)
})

function chkFeed(fCode, fLot){
    const cType = `SELECT * FROM Feed_Codes WHERE FeedCode = '${fCode}';`
    const cRepeat = `SELECT * FROM Feed_Manifold WHERE Lot_Number = '${fLot}';`

    pool.query(cType, (error, rows)=>{
        if(error) throw error
        if (rows.length === 0){
            console.log("unreconized feed "+cType)
            return -1   
        } else { 
            pool.query(cRepeat, (error, rows)=>{
                if(error)throw error
                if(rows.length > 0){
                    console.log("feed repeated")
                    return 0
                } else {
                    console.log("now can be record")
                    return 1
                }
            })
        }
    })   
} // end function fCode