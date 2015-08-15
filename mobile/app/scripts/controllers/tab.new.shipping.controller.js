'use strict';

angular.module('helix.controllers')
  .controller('NewShippingCtrl', function ($scope, $state, $localStorage, $moment, $cordovaDialogs, $ionicLoading,
                                           $timeout, $http, Api) {
    $scope.title = "Delivery Date";
    $scope.storage = $localStorage;

    $scope.loading = true;
    $ionicLoading.show({
      template: '<ion-spinner class=\'spinner-energized\'></ion-spinner><br>Loading...'
    });

    $scope.selectedDate = {};

    $http
      .get(Api.endpoint + '/api/trips/' + $scope.storage.trip._id + '/deliveryDates')
      .then(function (response) {
        $ionicLoading.hide();
        $scope.loading = false;
        $scope.dates = response.data;
        if ($scope.dates.length) {
          $scope.dates[0].selected = true;
        }
      }, function (err) {
        $ionicLoading.hide();
        console.error(err);
        $scope.loading = false;
        return $cordovaDialogs.alert(err.data.message || err.data || 'Something went wrong. Please try again.', 'Error', 'OK');
      });

    $scope.changedSelection = function (date, a) {
      for (var i = 0; i < $scope.dates.length; i++) {
        $scope.dates[i].selected = false;
      }

      date.selected = true;
    };

    $scope.next = function () {
      $ionicLoading.show({
        template: '<ion-spinner class=\'spinner-energized\'></ion-spinner><br>Calculating estimate...'
      });
      $timeout(function () {
        $ionicLoading.hide();
        $state.go('tab.new-estimate');
      }, 2000);
    };

    $scope.addDays = function (date, days) {
      var a = $moment(date);
      var res = a.add(days, 'days');

      return res.utc().format();
    };

    $scope.differenceInDays = function (date1, date2) {
      var a = $moment(date1);
      var b = $moment(date2);
      var diff = a.diff(b, 'days') * -1;

      return diff;
    };
  });
