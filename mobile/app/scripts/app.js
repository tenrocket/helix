'use strict';

angular.module('helix', [
  'ionic',
  'helix.controllers',
  'helix.services',
  'helix.directives',
  'ngCordova',
  'ngStorage',
  'ngResource',
  'uiGmapgoogle-maps',
  'mp.datePicker',
  'angular-momentjs',
  'angular.filter',
  'credit-cards',
  'angular-stripe'
])
  .constant('Api', {
    endpoint: 'https://gethelix.herokuapp.com' //'http://localhost:9000'
  })

  .constant('STRIPE_KEY', 'pk_test_tBLnCyjvGT1AcTBr7seToAAi')

  .config(function ($stateProvider, $urlRouterProvider, $httpProvider, STRIPE_KEY, stripeProvider) {
    $stateProvider

      .state('login', {
        url: '/login',
        controller: 'LoginCtrl',
        templateUrl: 'templates/login.html'
      })

      .state('signup', {
        url: '/signup',
        controller: 'SignupCtrl',
        templateUrl: 'templates/signup.html'
      })

      .state('tab', {
        url: '/tab',
        abstract: true,
        controller: 'TabsCtrl',
        templateUrl: 'templates/tabs.html'
      })

      .state('tab.new', {
        url: '/new',
        views: {
          'tab-new': {
            templateUrl: 'templates/tab-new.html',
            controller: 'NewCtrl'
          }
        }
      })

      .state('tab.new-shipping', {
        url: '/new/shipping',
        views: {
          'tab-new': {
            templateUrl: 'templates/tab-new-shipping.html',
            controller: 'NewShippingCtrl'
          }
        }
      })

      .state('tab.new-estimate', {
        url: '/new/estimate',
        views: {
          'tab-new': {
            templateUrl: 'templates/tab-new-estimate.html',
            controller: 'NewEstimateCtrl'
          }
        }
      })

      .state('tab.new-done', {
        url: '/new/done',
        views: {
          'tab-new': {
            templateUrl: 'templates/tab-new-done.html',
            controller: 'NewDoneCtrl'
          }
        }
      })

      .state('tab.trips', {
        url: '/trips',
        views: {
          'tab-trips': {
            templateUrl: 'templates/tab-trips.html',
            controller: 'TripsCtrl'
          }
        }
      })

      .state('tab.trip-detail', {
        url: '/trips/:id',
        views: {
          'tab-trips': {
            templateUrl: 'templates/tab-trips-detail.html',
            controller: 'TripsDetailCtrl'
          }
        }
      })

      .state('tab.account', {
        url: '/account',
        views: {
          'tab-account': {
            templateUrl: 'templates/tab-account.html',
            controller: 'AccountCtrl'
          }
        }
      })

      .state('tab.account-settings', {
        url: '/account/settings',
        views: {
          'tab-account': {
            templateUrl: 'templates/tab-account-settings.html',
            controller: 'AccountSettingsCtrl'
          }
        }
      })

      .state('tab.account-payment', {
        url: '/account/payment',
        views: {
          'tab-account': {
            templateUrl: 'templates/tab-account-payment.html',
            controller: 'AccountPaymentCtrl'
          }
        }
      })

      .state('tab.account-connected', {
        url: '/account/connected',
        views: {
          'tab-account': {
            templateUrl: 'templates/tab-account-connected.html',
            controller: 'AccountConnectedCtrl'
          }
        }
      })

      .state('tab.account-faq', {
        url: '/account/faq',
        views: {
          'tab-account': {
            templateUrl: 'templates/tab-account-faq.html'
          }
        }
      })

      .state('tab.account-terms', {
        url: '/account/terms',
        views: {
          'tab-account': {
            templateUrl: 'templates/tab-account-terms.html'
          }
        }
      })

      .state('tab.account-privacy', {
        url: '/account/privacy',
        views: {
          'tab-account': {
            templateUrl: 'templates/tab-account-privacy.html'
          }
        }
      });

    //$urlRouterProvider.otherwise('/tab/new');
    $urlRouterProvider.otherwise( function($injector, $location) {
      var $state = $injector.get('$state');
      var Auth = $injector.get('Auth');

      Auth.isLoggedInAsync(function (isLoggedIn) {
        if (!isLoggedIn) {
          $state.go('login');
        } else {
          $state.go('tab.new');
        }
      });
    });

    stripeProvider.setPublishableKey(STRIPE_KEY);
    $httpProvider.interceptors.push('authInterceptor');
  })

  .factory('authInterceptor', function ($rootScope, $q, $localStorage, $location) {
    return {
      // Add authorization token to headers
      request: function (config) {
        config.headers = config.headers || {};
        if ($localStorage.token) {
          config.headers.Authorization = 'Bearer ' + $localStorage.token;
        }
        return config;
      },

      // Intercept 401s and redirect you to login
      responseError: function (response) {
        if (response.status === 401) {
          $location.path('/login');
          // remove any stale tokens
          delete $localStorage.token;
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };
  })

  .run(function ($ionicPlatform, $rootScope, $location, Auth, $cordovaSplashscreen) {
    $ionicPlatform.ready(function () {
      /*setTimeout(function() {
        $cordovaSplashscreen.hide()
      }, 2000);*/

      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }

      if (window.StatusBar) {
        StatusBar.overlaysWebView(true);
      }
    });

    $rootScope.$on('$stateChangeStart', function (event, next) {
      Auth.isLoggedInAsync(function (loggedIn) {
        if (next.authenticate && !loggedIn) {
          $location.path('/login');
        }
      });
    });
  });
