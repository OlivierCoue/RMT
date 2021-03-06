var myApp=angular.module("myApp",['ngRoute']);

var HOST = "//localhost:3000";

var get_reportTypes = HOST+"/RMTapi/ReportTypes";
var get_reportData = HOST+"/RMTapi/Report";
var post_comment = HOST+"/RMTapi/Comment";
var get_comment = HOST+"/RMTapi/Comment";
var patch_postpone = HOST+"/RMTapi/Postpone";
var get_postponeReportDate = HOST+"/RMTapi/PostponedReport";
var patch_unpostpone = HOST+"/RMTapi/Unpostpone";

myApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'templates/selectError.html',
        controller: 'selectReportController'
      }).
      when('/error/:errorId', {
        templateUrl: 'templates/manageError.html',
        controller: 'manageReportController'
      }).
      otherwise({
        redirectTo: '/'
      });
  }]);


myApp.run(['$rootScope', '$http', function ($rootScope, $http) {
	
	/* get all report types */ 	
	$http.get(get_reportTypes).
	    then(function(response) {                                    
	       console.log(response);
	       $rootScope.reportTypes = response.data;
	    }, function(response) {
	        console.log("Request failed : "+response.statusText );                        
	    }
	);
}])

myApp.controller('selectReportController', ['$scope', '$http', '$compile', '$location', '$window', function ($scope, $http, $compile, $location, $window) {

}]);

var CURRENT_REPORTS_MODE = 1;
var POSTPONED_REPORTS_MODE = 2;


myApp.controller('manageReportController', ['$rootScope', '$scope', '$http', '$compile', '$location', '$window', '$routeParams', function ($rootScope, $scope, $http, $compile, $location, $window, $routeParams) {
	$scope.repportId = $routeParams.errorId;
	$scope.report = null;
	$scope.selectedReportId = null;
	$scope.displayMode = null;
	/* found selected report type in $rootScope.reportTypes */
	for(var i=0; i<$rootScope.reportTypes.length; i++){
		if($rootScope.reportTypes[i].id == $scope.repportId){
			$scope.report = $rootScope.reportTypes[i];
			break;
		}
	}
	
	/* get current reports related to selected types */
	this.getCurrentReports = function(){		
		$scope.displayMode = CURRENT_REPORTS_MODE;		
	    $http.get(get_reportData+"/"+$scope.repportId).
		    then(function(response) {
		    	if(response.data != "" && response.data != null){ 
			    	$scope.report.data = {};
			    	$scope.report.data.colNames = JSON.parse(response.data[0].colNames);                     	       
			       	$scope.report.data.rows  = response.data[1];
			       	for(var i=0; i<$scope.report.data.rows.length; i++){
			       		$scope.report.data.rows[i].vals = JSON.parse($scope.report.data.rows[i].vals);
			       	}	       	       
		       }
		    }, function(response) {
		        console.log("Request failed : "+response.statusText );                        
		    }
		);
	};
	/* init */
	this.getCurrentReports();

	/* get postponed reports related to selected types */
	this.getPostponedReports = function(){
		$scope.selectedReport.isNull = true;
		$scope.displayMode = POSTPONED_REPORTS_MODE;		
	    $http.get(get_postponeReportDate+"/"+$scope.repportId).
		    then(function(response) {
		    	if(response.data != "" && response.data != null){ 
			    	$scope.report.data = {};
			    	$scope.report.data.colNames = JSON.parse(response.data[0].colNames);                     	       
			       	$scope.report.data.rows  = response.data[1];
			       	for(var i=0; i<$scope.report.data.rows.length; i++){
			       		$scope.report.data.rows[i].vals = JSON.parse($scope.report.data.rows[i].vals);
			       	}	       	       
		       }
		    }, function(response) {
		        console.log("Request failed : "+response.statusText );                        
		    }
		);
	};

	$scope.selectedReport = {
		isNull: true
	};
	
	/* save the id of row selected */
	this.selectReport = function(id){
		$scope.selectedReport.isNull = false;
		$scope.selectedReport.id = id;
		$http.get(get_comment+"/"+$scope.selectedReport.id).
		    then(function(response) {
		    	$scope.selectedReport.comments = response.data;
		    }, function(response) {
		        console.log("Request failed : "+response.statusText );                        
		    }
		);
	};

	this.postPostpone = function(){
		
		var params = {
			errorID: $scope.selectedReport.id,
			date: $("#postponeDateInput").val()
		}
		$http({
           method: 'PATCH',
           url: patch_postpone,                    
           data: params
        }).then(function(response) {               
           }, function(response) {           		
               console.log("Request failed : "+response.statusText );                        
           }
        );
        for(var i=0; i<$scope.report.data.rows.length; i++){
			if($scope.report.data.rows[i] != null && $scope.report.data.rows[i].id == $scope.selectedReport.id){
				$scope.report.data.rows[i] = null;				
				break;
			}
		}
		$scope.selectedReport.isNull = true;
	}

	this.patchUnpostpone = function(errorId){
		var params = {
			errorID: errorId,			
		}
		$http({
           method: 'PATCH',
           url: patch_unpostpone,                    
           data: params
        }).then(function(response) {               
           }, function(response) {           		
               console.log("Request failed : "+response.statusText );                        
           }
        );
        for(var i=0; i<$scope.report.data.rows.length; i++){
			if($scope.report.data.rows[i] != null && $scope.report.data.rows[i].id == errorId){
				$scope.report.data.rows[i] = null;				
				break;
			}
		}
	};

	/* post comment related to row selected */
	var canComment = true;
	this.postComment = function(){
		var commentContent = $('#commentContent').val();
		$('#commentContent').val("");		
		if($scope.selectedReport.id && commentContent != "" && commentContent != null){
			if(canComment){
				canComment = false;

				var params = {
					errorId: $scope.selectedReport.id,
					comment: "'"+commentContent+"'"
				}
				$http({
	               method: 'POST',
	               url: post_comment,                    
	               data: params
		        }).then(function(response) {
		               canComment = true;
		           }, function(response) {
		           		canComment = true;
		               console.log("Request failed : "+response.statusText );                        
		           }
		        );

		        $scope.selectedReport.comments.push({comment: commentContent});	
				for(var i=0; i<$scope.report.data.rows.length; i++){
					if($scope.report.data.rows[i].id == $scope.selectedReport.id){
						$scope.report.data.rows[i].lastComment = commentContent;
						console.log($scope.report);
						break;
					}
				}
			}
		}
	}
}]);