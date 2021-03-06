angular.module('odin', ['hm.readmore'])

.controller('DatasetListController', DatasetListController);

function DatasetListController($scope, $location, rest, $rootScope, $sce, $routeParams, DatasetListService, configs, $anchorScroll, usSpinnerService, $filter) {
    $scope.viewFilter = false;
    $rootScope.isDatasetView = false;
    $rootScope.isHome = false;
    sessionStorage.removeItem('activeCategory');
    localStorage.removeItem('currentCategory');
    sessionStorage.removeItem('currentColor');

    // get limit config
    $scope.limit = 20;

    $scope.params = {
        orderBy: 'name',
        sort: 'ASC',
        include: ['categories.id'],//['files', 'tags', 'categories.id'].join(),
        limit: 8,
        skip: 0,
        'categories.slug': $routeParams['categories.slug'],
        fields: ['description', 'id', 'name', 'optionals', 'publishedAt', 'updatedAt'].join()
    };

    var category = rest().get({
        type: 'categories',
        params: 'slug=' + $routeParams['categories.slug'] + "&match=exact"
    }, function (resp) {
        if (!!resp.data[0]) {
            $rootScope.query = '';
            sessionStorage.removeItem('query');
            $scope.currentCategory = $filter('searchCategory')(resp.data[0].id);
            localStorage.setItem('currentCategory', resp.data[0].name);
            sessionStorage.setItem('currentColor', resp.data[0].color);
        }
        $scope.viewFilter = true;
    });


    $scope.modelName = "Dataset";
    $rootScope.header = "Datasets List";
    $scope.downloads = [];
    $scope.datasets = [];
    $scope.resultDatasetsSearch = [];
    $scope.showLoading = true;
    $scope.url_api = $rootScope.url;
    $scope.page = 1;

    $scope.countDatasetsByCategory = -1;
    DatasetListService.getDatasetsCount(null, function (result) {
        $scope.countDatasetsByCategory = result.data.count;
    });

    $scope.loadResults = function (skip) {
        usSpinnerService.spin('spinner');
        $rootScope.countQuery++;
        //usSpinnerService.spin('spinner');

        $scope.showLoading = true;
        $scope.params.skip = skip;

        DatasetListService.getDatasets($scope.params, function (datasets) {
            $scope.datasets = datasets.map(function (dataset) {
                if ($scope.downloads.length) {
                    var downloadsCount = $scope.downloads
                            .filter(function (download) {
                                return download.dataset === dataset.id;
                            })
                            .map(function (download) {
                                return download.downloads;
                            });
                    dataset.downloads = downloadsCount.length ? downloadsCount[0] : 0;
                }

                dataset.additional_info = [];
                angular.forEach(dataset.optionals, function (val, key) {
                    dataset.additional_info.push({
                        clave: key,
                        valor: val
                    });
                });

                dataset.fileTypes = [];
                /*
                  TODO

                  Service getFiletypes para llamar en:
                  - DatasetListController
                  - datasetStarredController (home)
                  - datasetLatestController (home)
                */
                $scope.filesResults = rest().getFiletypes({
                    type: 'datasets',
                    id: dataset.id
                }, function (result) {
                    $scope.ftypes = result.data;
                    $scope.ftypes.forEach(function (element) {
                        if (!!element.id) {
                            if (dataset.fileTypes.indexOf(element.id) === -1) {
                                dataset.fileTypes.push(element.id);
                            }
                        }
                    });
                }, function (error) {
                });
                $scope.showLoading = false;
                return dataset;
            });
            $scope.showLoading = false;
            if ($scope.datasets) {
                $rootScope.countQuery--;
                if ($rootScope.countQuery == 0) {
                    usSpinnerService.stop('spinner');
                }
            }
        });
        $anchorScroll('pagingDatasets');
    };

    DatasetListService.getDownloadResults($scope.params, function (downloads) {
        $scope.downloads = downloads;
        $scope.loadResults(0);
    });

    $scope.view = function (model) {
        var url = '/datasets/' + model.id + "/view";
        $location.path(url);
    };
    $scope.getHtml = function (html) {
        return $sce.trustAsHtml(html);
    };


    $scope.paging = function (event, page, pageSize, total) {
        usSpinnerService.spin('spinner');
        var skip = (page - 1) * $scope.params.limit;
        $scope.page = page;
        $scope.loadResults(skip);
    };

    function downloadsDesc(a, b) {
        // sort DESC
        if (a.downloads < b.downloads) {
            return 1;
        }
        if (a.downloads > b.downloads) {
            return -1;
        }
        // a must be equal to b
        return 0;
    }
}
