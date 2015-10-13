'use strict';

/**
 * @ngdoc function
 * @name flightNodeDemo.controller:LoginController
 * @description
 * # LoginController
 * Controller for the login page
 */
angular.module('flightNodeDemo')
	.controller('LoginController', function ($scope, $http, $log) {

		$scope.response = 'doesn\'t work yet.';

		$scope.loading = true;

		$scope.loginForm = {
			submit: function () {

				$scope.loading = true;

				$scope.loginForm.data.grant_type = 'password'; // jshint ignore:line

				$http({
					url: 'http://localhost:50323/oauth/token',
					method: 'POST',
					transformRequest: function (obj) {
						var str = [];
						for (var p in obj) {
							str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
						}
						return str.join('&');
					},
					data: $scope.loginForm.data,
					headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
				})
				.then(function success(response) {
						$scope.showSuccessMessage('Login successful.');

						// response.data has the the access_token and expires_in (seconds).
						// Need to record the actual expiration timestamp, not just the duration.
						var expiresAt = moment().add(response.data.expires_in, 's');

						localStorage.setItem('jwt', JSON.stringify({ expiresAt: expiresAt, access_token: response.data.access_token }) );

					}, function error(response) {
						$log.error('Status code: ', response.status);
						$log.error('Data: ', response.data);

						var data =  { error: 'Status Code: ' + status + ', Message: ' + response.data};

						$scope.showErrorMessage(data);
					})
					.finally(function () {
						$scope.loading = false;
					});
			},
			data: {}
		};


		// TODO: move these functions somewhere so
		// that they can be re-used
		$scope.showErrorMessage = function (data) {
			var msg = data;
			if (data.error) {
				msg = data.error;
			}

			if (data.error_description) {
				msg += ': ' + data.error_description;
			}

			$scope.alerts = [
				{ type: 'danger', msg: msg }
			];
		};

		$scope.showSuccessMessage = function (msg) {
			$scope.alerts = [
				{ type: 'success', msg: msg }
			];
		};

		$scope.loading = false;

	});