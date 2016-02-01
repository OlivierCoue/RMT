var myApp=angular.module("myApp",['ngRoute']);

var get_reportTypes="//localhost:3000/RMTapi/ReportTypes";
var get_reportData="//localhost:3000/RMTapi/Report";
var post_comment="//localhost:3000/RMTapi/Comment";
var get_comment="//localhost:3000/RMTapi/Comment";

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

myApp.controller('manageReportController', ['$rootScope', '$scope', '$http', '$compile', '$location', '$window', '$routeParams', function ($rootScope, $scope, $http, $compile, $location, $window, $routeParams) {
	$scope.repportId = $routeParams.errorId;
	$scope.report = null;
	$scope.selectedReportId = null;

	/* found selected report type in $rootScope.reportTypes */
	for(var i=0; i<$rootScope.reportTypes.length; i++){
		if($rootScope.reportTypes[i].id == $scope.repportId){
			$scope.report = $rootScope.reportTypes[i];
			break;
		}
	}

	/* get reports related to selected types */
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