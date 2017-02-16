angular.module('odin.controllers')
.controller('FiletypesController', FiletypesController);

function FiletypesController($filter, $routeParams, $rootScope, $scope, rest, LocationSearchService, DatasetListService) {
    var filterName = 'files.type';
    var limit = 5;
    $scope.limitFormats = 0;
    $scope.filetypes = [];
    $scope.resultFormats = [];
    $scope.lessThanLimit;
    $scope.fileTypesCount = {};

    $scope.collapsed = true;
    $scope.toggleCollapse = function() {
        $scope.collapsed = !$scope.collapsed;
    };

    $scope.loadFormats = function(skip) {
        $scope.limitFormats += skip;
        $scope.resultFormats = rest().get({
            type: "filetypes",
            params: "orderBy=name&sort=ASC&limit=5&skip=" + $scope.limitFormats
        }, function() {
            for (var i = 0; i < $scope.resultFormats.data.length; i++) {
                var filetype = $scope.resultFormats.data[i];
                filetype.active = LocationSearchService.isActive(filterName, filetype.id);
                filetype.slug = $filter('slug')(filetype.name);
                $scope.filetypes.push(filetype);
                $scope.loadFileTypeCount(filetype.id);
            }
            if ($filter('filter')($scope.filetypes, {active: true})[0]!==undefined) {
              $scope.collapsed=false;
            }
            $scope.lessThanLimit = $scope.resultFormats.data.length < Math.max(skip, limit);
        });
        $scope.datasetCount = {};
    };

    //This won't scale. TODO: Change to /count
    $scope.loadFileTypeCount = function(fileTypeId){
        $scope.fileTypesCount[fileTypeId] = 0;
        $scope.params = {
            condition: 'AND',
            include: ['files', 'tags', 'categories'].join(),
            'files.type': fileTypeId,
            'categories.slug': $routeParams['categories.slug']
        };
        DatasetListService.getDatasetsCount($scope.params, function(result) {
            $scope.fileTypesCount[fileTypeId] = result.data.count;
        });
    };

    $scope.showLess = function(limit) {
        var countFormats = $scope.filetypes.length;
        var minCount = Math.min(countFormats, limit);
        $scope.filetypes.splice(minCount, countFormats - minCount);
        $scope.limitFormats = 0;
        $scope.lessThanLimit = false;
    };

    $scope.loadFormats(0);
    $scope.selectFiletype = function(filetype) {
        $rootScope.showFiltersMenu = false;
        $rootScope.showBackdrop = false;
        if(filetype.active) {
            LocationSearchService.removeFilterValue(filterName, filetype.id);
        } else {
            LocationSearchService.addFilterValue(filterName, filetype.id);
        }
    };
    $scope.removeAll = function() {
        LocationSearchService.deleteFilter(filterName);
    };

    var currentColor;
    var category = rest().get({
      type: 'categories',
      params: 'slug='+$routeParams['categories.slug']+"&match=exact"
    }, function(resp) {
      if (resp.data[0]) {
        $scope.currentCategory = resp.data[0];
        if ($scope.currentCategory.color !== null && $scope.currentCategory.color !== undefined) {
            $scope.currentColor = $scope.currentCategory.color ;
            sessionStorage.setItem('currentColor', $scope.currentColor);
        }
      }else{
        $scope.currentColor = sessionStorage.getItem('currentColor');
      }
    });

}
