/////////////////Server Initialisation ///////////////////
var express    = require('express');        // call express
var cors	   = require('cors');			// enable CORS
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');	//body parser
var fs 		   = require('fs');				// file system
var sql 	   = require('mssql');			// microsoft sql server integration

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//////////Connection to SQL server///////////////////////
// sqlLogin : NodeServer
// password : 142857
// acces ql service manager : SQLServerManager11.msc

var config = {
	user: 'NodeServerUser',
	password: '142857',
    server: 'localhost', // You can use 'localhost\\instance' to connect to named instance 
    database: 'RMTServerDatabase',

    options: {
        encrypt: false // Use this if you're on Windows Azure 
    }
}
////////////////SQL Methods////////////////////////////////
function  SQLSelect(queryString){
	return new Promise(function(resolve,reject){
		sql.connect(config).then(function() {
		   // Query
		   new sql.Request().query(queryString).then(function(recordset) {
		   		resolve(recordset);
		   }).catch(function(err) {
				// ... query error checks 
			})
		}).catch(function(err) {
			// ... connect error checks 
			reject("could not connect to database:"+err);
		});
	});
};

function SQLInsert(queryString){
	return new Promise(function(resolve,reject){
	 	sql.connect(config).then(function() {
		   // Query
		   var transaction = new sql.Transaction();	
		   transaction.begin(function(err){
		   		if(err)
		   			reject("transaction error"+err);
		   		var request = new sql.Request(transaction);
		   		request.query(queryString,function(err,records){
		   			if(err)
		   				reject("query error"+err);
		   			transaction.commit(function(err,recordset){
		   				if(err)
		   					reject("Transaction error:"+err);
		   				resolve("success");
		   			});
		   		});
		   });
		}).catch(function(err) {
			// ... connect error checks 
			reject("could not connect to database:"+err);
		});
	});
};

/////////////////// Server Routing/////////////////////////
var port = process.env.PORT || 3000;        // set our port

// ROUTES 
var router = express.Router();              // get an instance of the express Router

router.get('/ReportTypes', function(req, res) {
	var promise=SQLSelect('select ID as id,name,description as descr  from dbo.ReportTypes');
	promise.then(
		function(recordset){res.json(recordset);},
		function(err){console.log(err);}
	)
	console.log("get on ReportTypes");
});

router.get('/Report/:reportID', function(req, res) {
	var promise=SQLSelect('select ID as id, valeurs as vals from dbo.errors where state=\'visible\'and ReportID = '+req.params.reportID);
	promise.then(
		function(recordset){var  val = recordset;
			promise2=SQLSelect('select CollumnNames as colNames from dbo.ReportTypes WHERE ID = '+req.params.reportID);
			promise2.then(
				function(recordset){
					recordset.push(val);
					res.json(recordset);},
				function(err){console.log(err);}
			)
		},
		function(err){console.log(err);}
	)
	console.log("get on Report/"+req.params.reportID);
});

router.get('/Comment/:errorID',function(req,res){
	var promise=SQLSelect('select Comment as comment from dbo.comments where errorID = '+req.params.errorID+' ORDER BY insertionDate');
	promise.then(
		function(recordset){res.json(recordset);},
		function(err){console.log(err);}
	)
	console.log("get on Comment/"+req.params.errorID);
});

router.post('/Comment',function(req,res){
	var promise=SQLInsert('INSERT INTO [dbo].[comments]([errorID],[userID],[Comment])VALUES('+req.body.errorId+',1,'+req.body.comment+')');
	promise.then(
		function(success){res.json();},
		function(err){console,log(err);}
	)
	console.log("post on Comment/"+req.body.errorId);
});

router.post('/Postpone',function(req,res){
	//date format 2008-11-11
	var promise=SQLInsert('UPDATE [dbo].[errors]  SET [postponeDate] = \''+req.body.date+'\',[state] = \'hidden\' WHERE ID = '+req.body.errorID);
	promise.then(
		function(success){res.json();},
		function(err){console.log(err);}
	)
});




// REGISTER  ROUTES
app.use('/RMTapi', router);

// START SERVER
app.listen(port);
console.log('Server up on port ' + port);