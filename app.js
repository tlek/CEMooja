
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
require('./dbh.js')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const path = require('path')
const hbs = require('hbs')
const express = require('express')
const { isBuffer } = require('util')
const { json } = require('body-parser')
const { setupMaster } = require('cluster')
const app = express()
const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, './templates/views')
const partialsPath = path.join(__dirname, './templates/partials')

hbs.registerPartials(partialsPath)
app.set('view engine', 'hbs')
app.set("views", viewsPath)
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json({ limit: '1mb' }))

const pool = mysql.createPool(require('./dbh.js'))
// const pool = mysql.createPool({
//     host: 'blackie.synology.me',
//     port: 3307,
//     user: 'foo',
//     password: 'OOOttafagvah#1918',
//     database: 'rochanaTest',
//     dateStrings: true,
//     multipleStatements: true
// })


//pool.connect()
// app.post('/feed',(req,res)=>{
//     console.log(req.query)
//     console.log(typeof(req.query.Mdate))
//     console.log(req.query.Lot.length)
// })
app.post('/feed', (req, res) => {
    req.body.data.forEach(function (element) {
        // const sql = `SET @p0='${element.FeedCode}'; SET @p1='${element.Mdate}'; SET @p2='${element.Lot}'; SET @p3='${element.Quantity}'; SET @p4='${element.PPK}'; CALL getFeedInfo(@p0, @p1, @p2, @p3, @p4, @p5); SELECT @p5 AS recordId;`
        const sql = `CALL getFeedInfo('${element.FeedCode}','${element.Mdate}','${element.Lot}','${element.Quantity}','${element.PPK}', @p5); SELECT @p5 AS recordId;`
        pool.query(sql, (error, rows) => {
            if (error) throw error
            if (rows.length === 0) {
                console.log("return null")
            } else {
                //console.log(rows.RowDataPacket)
                console.log("Record ID = " + rows[rows.length - 1][0].recordId)
            }
        })
    })
    res.send(`Received feed manufactored info ${req.body.data.length} lots.`)
    //? this way sender will get acknowledge if message was receieve however if error after call sql no error shown just no record add or updated
})

app.post('/ce/sell/setFlag', (req, res) => {
    //console.log(req.body.data)
    req.body.data.forEach((element) => {

        const sql = `CALL setFlag('${element.AC_Id}','${element.ce}', '${element.detailId}', '${element.flag}',@p4); SELECT @p4 AS acId;`
        //console.log(sql)
        pool.query(sql, (error, rows) => {
            if (error) throw error
            if (rows.length === 0) {
                console.log("return null")
            } else {
                //console.log("Client A/C ID = " + rows[rows.length - 1][0].acId)
            }
        })
    })
    res.send(`Received update flag requested ${req.body.data.length} records`)
})

app.post('/ce/sell/setRef1', (req, res) => {
    //console.log(req.body.data)
    req.body.data.forEach((element) => {
        const sql = `CALL setRef('${element.AC_Id}','${element.ce}', '${element.detailId}', '${element.Ref1}',@p4); SELECT @p4 AS acId;`
        pool.query(sql, (error, rows) => {
            if (error) throw error
            if (rows.length === 0) {
                console.log("return null")
            } else {
                // console.log("Client A/C ID = " + rows[rows.length - 1][0].acId)
            }
        })
    })
    res.send(`Received update Ref1 requested ${req.body.data.length} records`)
})

app.get('/', (req, res) => {
    res.render('index', { title: 'หมูจ๋า CE bridge', msg: 'temporary for testing only มีไว้ชั่วคราวสำหรับการทดสอบ', author: 'Somporn' })
})

app.get('/contractor', (req, res) => {
    const q = 'SELECT * FROM Client_Manifold WHERE Class = "C" && active ORDER BY T_name '
    pool.query(q, function (error, rows) {
        if (error) throw error
        let clientList = '<table class="table table-hover table-sm"><th>id</th><th>Name</th><th>Class</th><th>ref1</th><th>AC_Id</th>'
        rows.forEach(client => {
            clientList += '<tr><td>' + client.id + '</td><td>' + client.T_name + '</td><td>' + client.Class + '</td><td>' + client.ref1 + '</td><td>' + client.vpac_Ref1 + '</td><tr>'
        });
        res.render('clients', { title: 'หมูจ๋า CE', clientList: clientList })
    })
})

app.get('/butcher', (req, res) => {
    const q = 'SELECT * FROM Client_Manifold WHERE active && Class = "T"  ORDER BY T_name '
    pool.query(q, function (error, rows) {
        if (error) throw error
        let clientList = '<table class="table table-hover table-sm"><th>id</th><th>Name</th><th>Class</th><th>ref1</th><th>AC_Id</th>'
        rows.forEach(client => {
            clientList += '<tr><td>' + client.id + '</td><td>' + client.T_name + '</td><td>' + client.Class + '</td><td>' + client.ref1 + '</td><td>' + client.vpac_Ref1 + '</td><tr>'
        });
        res.render('clients', { title: 'หมูจ๋า CE', clientList: clientList })
    })
})

app.get('/feed/check', (req, res) => {
    const qFeed = 'SELECT Type, Feed_Codes.T_Definition, mfcDate, Date, Lot_Number, Amount, PPK  FROM Feed_Manifold LEFT JOIN Feed_Codes on Feed_Manifold.Type = Feed_Codes.FeedCode order by mfcDate DESC'
    pool.query(qFeed, (err, rows) => {
        if (err) throw err
        let feedList = '<table class="table table-hover table-sm"><th>สูตร</th><th>ชื่อสูตร</th><th>MDate(วันผลิต)</th><th>วันรับข้อมูล</th><th>Lot(ล็อต)</th><th>ปริมาณผลิต(กก)</th><th>PPK(ราคากก.)</th>'
        rows.forEach(feed => {
            feedList += '<tr><td>' + feed.Type + '</td><td>' + feed.T_Definition + '</td><td>' + feed.mfcDate + '</td><td>' + feed.Date + '</td><td>' + feed.Lot_Number + '</td><td>' + feed.Amount + '</td><td>' + feed.PPK + '</td><tr>'
        })

        res.render('feeds', { title: 'หมูจ๋า CE', Head: 'ข้อมูลอาหารสัตว์ที่รับผ่าน API', author: 'Somporn', feedList: feedList })
    })
})

app.get('/feed/map', (req, res) => {
    const feedMap = 'SELECT * FROM Feed_Codes ORDER BY FeedCode'
    pool.query(feedMap, (err, rows) => {
        if (err) throw err
        let feedCodes = '<table class="table table-hover table-sm"><th>FeedCode</th><th>Account ID</th><th>Definition</th><th>ชื่อสูตรอาหาร</th>'
        rows.forEach(feed => {
            feedCodes += '<tr><td>' + feed.FeedCode + '</td><td>' + feed.AC_Id + '</td><td>' + feed.Definition + '</td><td>' + feed.T_Definition + '</td><tr>'
        })
        res.render('feeds', { title: 'หมูจ๋า CE', Head: 'รหัส-ชื่อสูตรอาหาร', author: 'Somporn', feedList: feedCodes })
    })
})

app.get('/feed/map/json', (req, res) => {
    const feedMap = 'SELECT * FROM Feed_Codes ORDER BY FeedCode'
    pool.query(feedMap, (err, rows) => {
        if (err) throw err
        const farmFeed = []
        const jsonFeed = { "feed": farmFeed }
        rows.forEach(feed => {
            farmFeed.push({ id: feed.id, AC_Id: feed.AC_Id, feedCode: feed.FeedCode, Def: feed.Definition, Tdef: feed.T_Definition })
        })
        res.send(jsonFeed)
        //console.log(farmFeed)
    })
})

app.get('/ce/qtest', (req, res) => {
    sql.connect(config, function (err) {
        //if (err) console.log(err);
        var request = new sql.Request();
        sql.connect(config, function (err) {
            if (err) throw (err)
            var request = new sql.Request();
            request.query('select * from Employee', function (err, rows) {
                if (err) throw (err)
                let employee = '<table class="table table-hover table-sm"><th>Emp#</th><th>Name</th><th>เงินเดือน</th><th>เลขแผนก</th>'

                rows.recordset.forEach(emp => {
                    employee += '<tr><td>' + emp.EmpNo + '</td><td>' + emp.EmpName + '</td><td>' + emp.Salary + '</td><td>' + emp.DeptNo + '</td><tr>'
                })
                employee += '</table>'
                res.render('employee', { title: 'หมูจ๋า CE', Head: 'พนักงาน(ข้อมูลจาก MSSQL)', author: 'Somporn', empList: employee })
                // console.log(rows)
            })
        })
    })
})

app.get('/ce/intRequest', (req, res) => {

    res.send('it gonna be a while for this request.')
})

app.get('/ce/catch', (req, res) => {
    //console.log(req.query)
    if (req.query.from == null || req.query.to == null) {
        res.send('กรุณาระบุช่วงวันที่ด้วย')
    } else {
        const saleInfo = 'SELECT Client_Manifold.T_name, seq, StartDate, StartWeight, StartHeadCount, FinishedDate, FinishedWeight, FinishedHeadCount, AdjHeadCount FROM Cbatches LEFT JOIN Client_Manifold ON Cbatches.ContractorId = Client_Manifold.id WHERE FinishedDate Between "' + req.query.from + '" AND "' + req.query.to + '" && Stage = 4'
        pool.query(saleInfo, (err, rows) => {
            if (err) throw err
            const contractor = []
            const jsonAP = { "batchData": contractor }
            console.log(rows)
            rows.forEach(growerInfo => {
                contractor.push({ name: growerInfo.T_name, seq: growerInfo.seq, sDate: growerInfo.StartDate, sHeadCount: growerInfo.StartHeadCount, sWeight: growerInfo.StartWeight, fDate: growerInfo.FinishedDate, fHeadCount: growerInfo.FinishedHeadCount, fWeight: growerInfo.FinishedWeight, adjHeadCount: growerInfo.AdjHeadCount })
            })
            res.send(jsonAP)
        })
    }
})
// work well here
// app.get('/ce/sell',(req,res)=>{
//     //console.log(req.query)
//     if (req.query.from == null || req.query.to == null){
//         res.send('กรุณาระบุช่วงวันที่ด้วย')
//     } else {
//         const saleInfo = 'select Client_Manifold.vpac_Ref1, T_name, Date, sum(Amount) as headCount, sum(Param2) as weight From Cbatch_Details left join Client_Manifold ON Reference4 = Client_Manifold.id where Date Between "'+ req.query.from +'" AND "'+req.query.to+ '" && ( EventType = 231 || EventType = 232 ) && void != 1 group by Date, Reference4;' 
//         pool.query(saleInfo, (err,rows)=>{
//             if(err)throw err
//             pigType = 'FG 05' // this may be change according to A/C
//             const catcher = []
//             const jsonAR = {"saleOrder":catcher} 
//             //console.log(rows)
//             rows.forEach(saleInfo => {
//                 catcher.push({AC_buyerId:saleInfo.vpac_Ref1, name:saleInfo.T_name, date:saleInfo.Date, AC_pigTypeId: pigType, headCount:saleInfo.headCount, weight:saleInfo.weight})
//             })
//           res.send(jsonAR)
//         })
//     }
// })

app.get('/ce/sell', (req, res) => {
    //console.log(req.query)
    if (req.query.from == null || req.query.to == null) {
        res.send('กรุณาระบุช่วงวันที่ด้วย')
    } else if (req.query.flag == null) {
        const saleInfo = 'select Client_Manifold.vpac_Ref1, T_name, Date, sum(Amount) as headCount, sum(Param2) as weight, Reference4, Cbatch_Details.id as detailId, flag, AC_Ref1, void From Cbatch_Details left join Client_Manifold ON Reference4 = Client_Manifold.id where Date Between "' + req.query.from + '" AND "' + req.query.to + '" && ( EventType = 231 || EventType = 232 ) group by Date, Reference4;'
        const saleBasic = 'select Client_Manifold.vpac_Ref1, T_name, Date, Sum(Amount) as headCount, sum(Param1) as weight, Reference1, Batch_Details.id as detailId, flag, AC_Ref1, void  from Batch_Details left join Client_Manifold ON Reference1 = Client_Manifold.id where Date Between "' + req.query.from + '" AND "' + req.query.to + '" &&  EventType = 32 group by Date, Reference1;'
        console.log('either null')
        pool.query(saleInfo, (err, rows) => {
            if (err) throw err
            pigType = 'FG 05' // this may be change according to A/C
            const catcher = []
            const jsonAR = { "saleOrder": catcher }
            rows.forEach(saleInfo => {
                if (saleInfo.Reference4 === 0) {
                    catcher.push({ AC_Id: '0', name: 'ขายสด ขาจร', date: saleInfo.Date, AC_pigTypeId: pigType, headCount: saleInfo.headCount, weight: saleInfo.weight, ce: 1, detailId: saleInfo.detailId, flag: saleInfo.flag, AC_Ref1: saleInfo.AC_Ref1, void: saleInfo.void })
                } else {
                    catcher.push({ AC_Id: saleInfo.vpac_Ref1, name: saleInfo.T_name, date: saleInfo.Date, AC_pigTypeId: pigType, headCount: saleInfo.headCount, weight: saleInfo.weight, ce: 1, detailId: saleInfo.detailId, flag: saleInfo.flag, AC_Ref1: saleInfo.AC_Ref1, void: saleInfo.void })
                }
            })
            pool.query(saleBasic, (err, rows) => {
                if (err) throw err
                //console.log(rows) 
                rows.forEach(saleBasic => {
                    if (saleBasic.Reference1 === 0) {
                        catcher.push({ AC_Id: '0', name: 'ขายสด ขาจร', date: saleBasic.Date, AC_pigTypeId: pigType, headCount: saleBasic.headCount, weight: saleBasic.weight, ce: 0, detailId: saleBasic.detailId, flag: saleBasic.flag, AC_Ref1: saleBasic.AC_Ref1, void: saleBasic.void })
                    } else {
                        catcher.push({ AC_Id: saleBasic.vpac_Ref1, name: saleBasic.T_name, date: saleBasic.Date, AC_pigTypeId: pigType, headCount: saleBasic.headCount, weight: saleBasic.weight, ce: 0, detailId: saleBasic.detailId, flag: saleBasic.flag, AC_Ref1: saleBasic.AC_Ref1, void: saleBasic.void })
                    }
                })
                res.send(jsonAR)
            })
        })
    } else {
        const saleInfo = 'select Client_Manifold.vpac_Ref1, T_name, Date, sum(Amount) as headCount, sum(Param2) as weight, Reference4, Cbatch_Details.id as detailId, flag, AC_Ref1, void From Cbatch_Details left join Client_Manifold ON Reference4 = Client_Manifold.id where Date Between "' + req.query.from + '" AND "' + req.query.to + '" && ( EventType = 231 || EventType = 232 ) && flag = "' + req.query.flag + '" group by Date, Reference4;'
        const saleBasic = 'select Client_Manifold.vpac_Ref1, T_name, Date, Sum(Amount) as headCount, sum(Param1) as weight, Reference1, Batch_Details.id as detailId, flag, AC_Ref1, void  from Batch_Details left join Client_Manifold ON Reference1 = Client_Manifold.id where Date Between "' + req.query.from + '" AND "' + req.query.to + '" &&  EventType = 32 && flag = "' + req.query.flag + '"  group by Date, Reference1;'
        //console.log(saleInfo)
        pool.query(saleInfo, (err, rows) => {
            if (err) throw err
            pigType = 'FG 05' // this may be change according to A/C
            const catcher = []
            const jsonAR = { "saleOrder": catcher }
            rows.forEach(saleInfo => {
                if (saleInfo.Reference4 === 0) {
                    catcher.push({ AC_Id: '0', name: 'ขายสด ขาจร', date: saleInfo.Date, AC_pigTypeId: pigType, headCount: saleInfo.headCount, weight: saleInfo.weight, ce: 1, detailId: saleInfo.detailId, flag: saleInfo.flag })
                } else {
                    catcher.push({ AC_Id: saleInfo.vpac_Ref1, name: saleInfo.T_name, date: saleInfo.Date, AC_pigTypeId: pigType, headCount: saleInfo.headCount, weight: saleInfo.weight, ce: 1, detailId: saleInfo.detailId, flag: saleInfo.flag })
                }
            })
            pool.query(saleBasic, (err, rows) => {
                if (err) throw err
                //console.log(rows) 
                rows.forEach(saleBasic => {
                    if (saleBasic.Reference1 === 0) {
                        catcher.push({ AC_Id: '0', name: 'ขายสด ขาจร', date: saleBasic.Date, AC_pigTypeId: pigType, headCount: saleBasic.headCount, weight: saleBasic.weight, ce: 0, detailId: saleBasic.detailId, flag: saleBasic.flag })
                    } else {
                        catcher.push({ AC_Id: saleBasic.vpac_Ref1, name: saleBasic.T_name, date: saleBasic.Date, AC_pigTypeId: pigType, headCount: saleBasic.headCount, weight: saleBasic.weight, ce: 0, detailId: saleBasic.detailId, flag: saleBasic.flag })
                    }
                })
                res.send(jsonAR)
            })
        })
    }
})

app.get('/ce/liveStock', (req, res) => {
    res.send('will send pig inventory on request date')
})

//this get will be deleted because of complexity to get from DB (to have data for vega-lite ) working in php instead
app.get('/ce/stat/cbatch', (req, res) => {

    if (req.query.batchId == null) {
        res.send('กรุณาระบุเลขชุดด้วย')
    } else {
        const statSum = 'SELECT id,json_length(Note) From Cbatch_Details WHERE (EventType = 231 || EventType = 232) && void != 1 && HeaderId = ' + req.query.batchId
        pool.query(statSum, (err, rows) => {
            if (err) throw err
            const weight = []
            // const jsonData = { values :catcher} 
            console.log(rows)
            console.log(typeof (rows))
            const counts = {}
            temp = []
            // rows.forEach(Note => {
            //     console.log(typeof(Note))
            //     console.log(Note.1)
            //     //temp = temp.concat(Object.entries(Note))               

            // })
            // const countsSorted = Object.entries(counts).sort(([_, a], [__, b]) => a - b);
            console.log("here is msg ")
            console.log(temp)
            //console.log(countsSorted)
            //console.log(typeof(counts)) 
            // rows.forEach(saleInfo => {
            //     catcher.push({AC_Id:saleInfo.vpac_Ref1, name:saleInfo.T_name, date:saleInfo.Date, headCount:saleInfo.headCount, weight:saleInfo.weight})
            // })
            //   res.send(jsonData)
            res.send('result coming soon')
        })
    }
})

app.get('*', (req, res) => {
    res.send('<h2>OOPs nothing here sorry. Please check your request format</h2>')
})
app.post('*', (req, res) => {
    res.send('Unable to record the post message')
})

app.listen(port, () => {
    console.log('server listening on port:=> ' + port)
})

function chkFeed(fCode, fLot) {
    const cType = `SELECT * FROM Feed_Codes WHERE FeedCode = '${fCode}';`
    const cRepeat = `SELECT * FROM Feed_Manifold WHERE Lot_Number = '${fLot}';`

    pool.query(cType, (error, rows) => {
        if (error) throw error
        if (rows.length === 0) {
            console.log("unreconized feed " + cType)
            return -1
        } else {
            pool.query(cRepeat, (error, rows) => {
                if (error) throw error
                if (rows.length > 0) {
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