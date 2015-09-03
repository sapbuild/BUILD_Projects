'use strict';

// @ngInject
module.exports = function ($scope, ActiveProjectService, ProjectFactory, uiError) {

    $scope.projectLoaded = false;
    $scope.project = {
        _id: ActiveProjectService.id,
        archived: false
    };

    $scope.selectedSetting = 'archive';

    ProjectFactory.get({id: ActiveProjectService.id}).$promise
        .then(function (project) {
            $scope.project.archived = project.archived;
            $scope.projectLoaded = true;
            $scope.isBinaryImage = true;
            $scope.projectThumbnail = project.thumbnail;
        })
        .catch(function (res) {
            uiError.create({content: res.data.error, dismissOnTimeout: true});
        });

    /**
     * Returns the action the archive button should perform, either 'archive' or 'unarchive'
     */
    $scope.archiveActionName = function () {
        return $scope.project.archived ? 'unarchive' : 'archive';
    };

    /**
     * Changes a project's status to be archived
     */
    $scope.archiveProject = function () {
        $scope.enableArchiveButton = false;
        $scope.project.archived = !$scope.project.archived;

        ProjectFactory.archive($scope.project).$promise
            .catch(function (res) {
                uiError.create({content: res.data.error, dismissOnTimeout: false});
            });
    };

    /* Select Assets Modal Functionality */

    /**
     * Callback to load the assets needed for the Select Assets Modal
     * Called whenever the dialog is opened
     */
    $scope.loadAssets = function () {
        ProjectFactory.getDocument({
            id: ActiveProjectService.id,
            fileType: 'image/png|image/jpg|image/gif|image/jpeg|image/bmp'
        }).$promise.then(function (assets) {
                var projectId = ActiveProjectService.id;
                assets.forEach(function (asset) {
                    asset.thumbnail = 'api/projects/' + projectId + '/document/' + asset._id + '/render/?thumbOnly=true';

                });

                // reverse so we get last added at the top
                $scope.assets = assets.reverse();
            });
    };

    /**
     * Function to update the currently selected asset
     * @param index the index of the asset selected
     */
    $scope.selectAsset = function (index) {
        var currentAsset = $scope.assets[index];
        // turn off any other assets
        $scope.assets.forEach(function (asset) {
            if (asset !== currentAsset) {
                asset.selected = false;
            }
        });

        if (currentAsset.selected) {
            currentAsset.selected = false;
            $scope.selectedAsset = null;
        }
        else {
            currentAsset.selected = true;
            $scope.selectedAsset = currentAsset;
        }
    };

    /**
     * Function to save the current selected asset as the image for the
     * project - called when dialog is closed
     */
    $scope.setProjectImage = function () {
        if ($scope.selectedAsset) {
            ProjectFactory.setPicture({
                id: ActiveProjectService.id
            }, {assetId: $scope.selectedAsset._id})
                .$promise.then(function () {
                    $scope.projectThumbnail = $scope.selectedAsset.thumbnail;
                    $scope.isBinaryImage = false;
                }).catch(function (res) {
                    uiError.create({content: res.data.error, dismissOnTimeout: false});
                });
        }
    };

};
