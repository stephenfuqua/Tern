'use strict';

/**
 * @ngdoc function
 * @name flightNodeApp.controller:ForagingStep1Controller
 * @description
 * # ForagingStep1Controller
 * Controller for rookery foraging census form, step 1: Location, Date, and Time.
 */
angular.module('flightNodeApp')
    .controller('ForagingStep1Controller', ['$scope', 'authService', 'config', 'messenger',
        'foragingSurveyProxy', '$filter', '$location', '$log', 'locationProxy', 'enumsProxy',
        '$route', '$uibModal', 'birdsProxy', '$routeParams',
        function($scope, authService, config, messenger,
            foragingSurveyProxy, $filter, $location, $log, locationProxy, enumsProxy,
            $route, $uibModal, birdsProxy, $routeParams) {


            if (!(authService.isReporter())) {
                $log.warn('not authorized to access this path');
                $location.path('/');
                return;
            }

            //
            // Helper functions
            //

            var modelKey = "foragingSurveyModel";

            var saveToSession = function(data) {
                sessionStorage.setItem(modelKey, JSON.stringify(data));
            };

            var pullFromSession = function() {
                var stored = sessionStorage.getItem(modelKey);
                stored = stored === "undefined" ? undefined : stored;
                if (stored) {
                    return JSON.parse(stored || {});
                }
                return null;
            };

            var setupDateAndTimeControls = function() {
                $scope.startDateOpened = false;
                $scope.datePickerOptions = {
                    formatYear: 'yy',
                    formatMonth: 'MM',
                    maxMode: 'day',
                    maxDate: new Date(2021, 1, 1),
                    minDate: new Date(1990, 1, 1),
                    startingDay: 1
                };
                $scope.datePickerModelOptions = {
                    allowInvalid: true
                };
                $scope.showDatePicker = function() {
                    $scope.startDateOpened = !$scope.startDateOpened;
                };
                $scope.updateStartDate = function() {
                    $scope.foragingSurvey.startDate = new Date($scope.foragingSurvey.startDateManual);
                };
                $scope.updateStartDateManual = function() {
                    $scope.foragingSurvey.startDateManual = $filter('date')($scope.foragingSurvey.startDate, 'MM/dd/yyyy');
                };
                $scope.hstep = 1;
                $scope.mstep = 1;
            };

            var prepareDateAndTimeForUi = function(model) {
                // need to convert to a a real Date object to support timepicker
                var format = 'YYYY-MM-DD hh:mm a';
                if (model.startTime && model.startTime.includes('M')) {
                    model.startTime = moment('1970-01-01 ' + model.startTime, format).toDate();
                }
                if (model.endTime && model.endTime.includes('M')) {
                    model.endTime = moment('1970-01-01 ' + model.endTime, format).toDate();
                }

                model.startDateManual = model.startDate;
                // The date in session depends on how it came back from the server after a save
                var temp = moment(model.startDate, 'MM/DD/YYYY');
                if (!temp.isValid()) {
                    temp = moment(model.startDate);
                }
                model.startDate = temp.toDate();
            }

            var loadLocations = function() {
                locationProxy.get($scope, function(data) {
                    $scope.locations = data;
                });
            };

            var loadExistingSurvey = function(id) {
                $scope.loading = true;

                foragingSurveyProxy.getById($scope, id, function(data) {

                    prepareDateAndTimeForUi(data);
                    $scope.foragingSurvey = data;

                    $scope.loading = false;
                });
            }

            //
            // Configure button actions
            //
            $scope.next = function() {
                $scope.loading = true;

                var next = function(data) {
                    $scope.loading = false;

                    saveToSession(data);

                    // need to pass the survey identifier on to step 2
                    $location.path('/foraging/step2/' + data.surveyIdentifier);
                }

                // Create or update the survey as appropriate
                if (!$scope.foragingSurvey.surveyIdentifier) {
                    foragingSurveyProxy.create($scope, $scope.foragingSurvey, function(data) {
                        next(data);
                    });
                } else {
                    foragingSurveyProxy.update($scope, $scope.foragingSurvey, function(data) {
                        next(data);
                    });
                }

            };


            $scope.back = function() {
                // Should never be invoked
            };

            $scope.reset = function() {
                // TODO: what is the function of this now? Need to rethink
                // this "reset" button. Maybe unnecessary. 

                var modal = $uibModal.open({
                    animation: true,
                    templateUrl: '/app/views/confirmResetForm.html',
                    backdrop: true,
                    size: 'sm'
                });
                modal.result.then(function success() {

                    // Reload the first page
                    $location.path('/foraging');

                }, function dismissed() {
                    // do nothing
                });
            };

            //
            // Main program flow
            //
            $scope.loading = true;

            setupDateAndTimeControls();
            loadLocations();

            // Configure shared "bottomBar" components
            $scope.canGoBack = false;
            $scope.canSaveForLater = true;

            if ($routeParams.id) {
                loadExistingSurvey($routeParams.id);
            }

            $scope.loading = false;
        }
    ]);
