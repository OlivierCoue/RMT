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

/////////////////// Server Routing/////////////////////////
var port = process.env.PORT || 3000;        // set our port

// ROUTES 
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
	res.json({ message: 'hooray! welcome to our api!' });   
});

router.get('/ReportTypes', function(req, res) {
	sql.connect(config).then(function() {
	   // Query
	   new sql.Request().query('select ID as id,name,description as descr  from dbo.ReportTypes').then(function(recordset) {
	   	console.log("get on ReportTypes");
	   	res.json(recordset);
	   }).catch(function(err) {
			// ... query error checks 
		})
	}).catch(function(err) {
		// ... connect error checks 
		console.log("could not connect to database:"+err);
	});
});

router.get('/Report/:reportID', function(req, res) {
	sql.connect(config).then(function() {
	   // Query
	   var val;
	   new sql.Request().query('select ID as id, valeurs as vals from dbo.errors where ReportID = '+req.params.reportID).then(function(recordset) {
	   	console.log("get on Report/"+req.params.reportID);
	   	val = recordset;
	   }).catch(function(err) {
			// ... query error checks 
		}).catch(function(err) {
		// ... connect error checks 
		console.log("could not connect to database:"+err);
	});

		new sql.Request().query('select CollumnNames as colNames from dbo.ReportTypes WHERE ID = '+req.params.reportID).then(function(recordset) {
			recordset.push(val);
			res.json(recordset);
		}).catch(function(err) {
			// ... query error checks 
		}).catch(function(err) {
		// ... connect error checks 
		console.log("could not connect to database:"+err);
	});

	});
});

router.get('/Comment/:errorID',function(req,res){
	sql.connect(config).then(function() {
	   // Query
	   new sql.Request().query('select Comment as comment from dbo.comments where errorID = '+req.params.errorID+' ORDER BY insertionDate').then(function(recordset) {
	   	console.log("get on Comment/"+req.params.errorID);
	   	res.json(recordset);
	   }).catch(function(err) {
			// ... query error checks 
		})
	}).catch(function(err) {
		// ... connect error checks 
		console.log("could not connect to database:"+err);
	});
});

router.post('/Comment',function(req,res){
	sql.connect(config).then(function() {
	   // Query
	   var transaction = new sql.Transaction();	
	   transaction.begin(function(err){
	   		if(err)
	   			console.log("transaction error"+err);
	   		var request = new sql.Request(transaction);
	   		var queryString = 'INSERT INTO [dbo].[comments]([errorID],[userID],[Comment])VALUES('+req.body.errorId+',1,'+req.body.comment+')';
	   		request.query(queryString,function(err,records){
	   			if(err)
	   				console.log("query error"+err);
	   			transaction.commit(function(err,recordset){
	   				if(err)
	   					console.log("Transaction error:"+err);
	   				console.log("post on Comment/"+req.body.errorId);
	   				res.json();
	   			});
	   		});
	   });
	}).catch(function(err) {
		// ... connect error checks 
		console.log("could not connect to database:"+err);
	});
});




// REGISTER  ROUTES
app.use('/RMTapi', router);

// START SERVER
app.listen(port);
console.log('Server up on port ' + port);