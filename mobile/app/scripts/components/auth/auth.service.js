'use strict';

angular.module('helix')
  .factory('Auth', function Auth($location, $rootScope, $http, User, $q, $localStorage, Api) {
    var currentUser = {};

    if ($localStorage.token) {
      currentUser = User.get();
    }

    return {

      /**
       * Authenticate user and save token
       *
       * @param  {Object}   user     - login info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      login: function (user, callback) {
        var cb = callback || angular.noop;
        var deferred = $q.defer();

        $http.post(Api.endpoint + '/auth/local', {
          email: user.email,
          password: user.password
        }).success(function (data) {
          $localStorage.token = data.token;
          currentUser = User.get();
          deferred.resolve(data);
          return cb();
        }).error(function (err) {
          this.logout();
          deferred.reject(err);
          return cb(err);
        }.bind(this));

        return deferred.promise;
      },

      /**
       * Delete access token and user info
       *
       * @param  {Function}
       */
      logout: function () {
        //delete $localStorage.token;
        $localStorage.$reset();
        currentUser = {};
      },

      /**
       * Create a new user
       *
       * @param  {Object}   user     - user info
       * @param  {Function} callback - optional
       * @return {Promise}
       */
      createUser: function (user, callback) {
        var cb = callback || angular.noop;

        return User.save(user,
          function (data) {
            $localStorage.token = data.token;
            currentUser = User.get();
            return cb(user);
          },
          function (err) {
            this.logout();
            return cb(err);
          }.bind(this)).$promise;
      },

      resetPassword: function (user, callback) {
        var cb = callback || angular.noop;
        var deferred = $q.defer();

        $http.post('/api/users/reset', {
          email: user.email
        }).success(function (data) {
          deferred.resolve(data);
          return cb();
        }).error(function (err) {
          deferred.reject(err);
        }.bind(this));

        return deferred.promise;
      },

      newPassword: function (user, callback) {
        var cb = callback || angular.noop;
        var deferred = $q.defer();

        $http.post(Api.endpoint + '/api/users/reset/' + user.token, {
          password: user.password
        }).success(function (data) {
          deferred.resolve(data);
          return cb();
        }).error(function (err) {
          deferred.reject(err);
        }.bind(this));

        return deferred.promise;
      },

      /**
       * Change password
       *
       * @param  {String}   oldPassword
       * @param  {String}   newPassword
       * @param  {Function} callback    - optional
       * @return {Promise}
       */
      changePassword: function (oldPassword, newPassword, callback) {
        var cb = callback || angular.noop;

        return User.changePassword({id: currentUser._id}, {
          oldPassword: oldPassword,
          newPassword: newPassword
        }, function (user) {
          return cb(user);
        }, function (err) {
          return cb(err);
        }).$promise;
      },

      /**
       * Gets all available info on authenticated user
       *
       * @return {Object} user
       */
      getCurrentUser: function() {
        return currentUser;
      },

      updateCurrentUser: function() {
        if ($localStorage.token) {
          currentUser = User.get();
        }

        return currentUser;
      },

      /**
       * Check if a user is logged in
       *
       * @return {Boolean}
       */
      isLoggedIn: function () {
        return currentUser.hasOwnProperty('role');
      },

      /**
       * Waits for currentUser to resolve before checking if user is logged in
       */
      isLoggedInAsync: function (cb) {
        if (currentUser.hasOwnProperty('$promise')) {
          currentUser.$promise.then(function () {
            cb(true);
          }).catch(function () {
            cb(false);
          });
        } else if (currentUser.hasOwnProperty('role')) {
          cb(true);
        } else {
          cb(false);
        }
      },

      /**
       * Check if a user is an admin
       *
       * @return {Boolean}
       */
      isAdmin: function () {
        return currentUser.role === 'admin';
      },

      /**
       * Get auth token
       */
      getToken: function () {
        return $localStorage.token;
      }
    };
  });
