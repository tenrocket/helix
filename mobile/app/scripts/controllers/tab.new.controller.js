"use strict";

angular.module('helix.controllers')
  .controller('NewCtrl', function($scope, $ionicModal, $rootScope, $state) {
    $rootScope.$broadcast('blueStatusBar');

    $scope.openSearchCityModal = function () {
      $ionicModal.fromTemplateUrl('templates/modal-city-search.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
      }).then(function (modal) {
        $scope.modal = modal;
        $scope.modal.show();
      });
    };

    $scope.selectCity = function(placeId) {
      console.log('Selected', placeId);
      $rootScope.$broadcast('defaultStatusBar');
      $state.go('tab.new-places');
    }
  });
