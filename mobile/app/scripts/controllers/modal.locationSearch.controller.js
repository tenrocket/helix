'use strict';

angular.module('helix.controllers')
  .controller('ModalLocationSearchCtrl', function ($scope, $rootScope, $localStorage) {
    $rootScope.$broadcast('defaultStatusBar');
    $scope.loading = false;

    $scope.results = [];

    $scope.$on('$ionicView.beforeEnter', function () {
      $scope.searchQuery = '';
      console.log('hey');
    });

    $scope.$on('$ionicView.enter', function () {
      $scope.searchQuery = '';
      console.log('enter');
    });

    var autocompleteService = new google.maps.places.AutocompleteService();

    var options = {
      componentRestrictions: {
        country: 'us'
      }
    };

    if ($scope.shouldFilterByLocation) {
      options.location = new google.maps.LatLng($scope.latitude, $scope.longitude);
      options.radius = 5000;
    }

    function getResultsForQuery(query) {
      if (!autocompleteService) return;

      $scope.loading = true;

      options.input = query;

      autocompleteService.getPlacePredictions(options, function listentoresult(list, status) {
        if (list !== null && list.length > 0) {
          $scope.$apply(function () {
            $scope.results = list;
            $scope.loading = false;
          });
        }
      });
    }

    $scope.cancel = function () {
      $scope.locationModal.hide();
    };

    $scope.$watch('searchQuery', function (query) {
      if (!query) return;

      getResultsForQuery(query);
    });

    $scope.selectLocation = function (location) {
      $localStorage[$scope.locationToSave] = location;
      $scope.placeMarkers();
      $scope.locationModal.hide();
    };
  });
