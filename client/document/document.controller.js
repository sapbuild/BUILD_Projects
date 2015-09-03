'use strict';

var tp = require('norman-client-tp');
var _ = tp.lodash;

// Controller for page showing documents for a project
// @ngInject
module.exports = function ($state, $rootScope, $scope, $timeout, $log, Auth, ProjectFactory, ActiveProjectService, uiError) {

    var vm = this;

    // Text for the handy tip directive
    vm.handyTipText = 'TIP: You can also add files into your project by dragging and dropping them onto this page';

    // List of sorting options
    vm.sortedItems = [{
        name: 'Date New→Old',
        value: 'date',
        reverse: true
    }, {
        name: 'Date Old→New',
        value: 'date',
        reverse: false
    }, {
        name: 'Name A→Z',
        value: 'name',
        reverse: false
    }, {
        name: 'Name Z→A',
        value: '-name',
        reverse: false
    }, {
        name: 'Size Big→Small',
        value: 'size',
        reverse: true
    }, {
        name: 'Size Small→Big',
        value: 'size',
        reverse: false
    }];

    vm.fileType = {
        image: 'image',
        video: 'media',
        audio: 'media',
        text: 'document',
        application: 'document'
    };

    vm.selectedSortItem = vm.sortedItems[2];
    vm.projectId = ActiveProjectService.id;
    vm.docs = [];
    vm.nbDocs = 0;
    vm.loading = true;
    vm.anyFileUpload = false;
    vm.user = Auth.getCurrentUser();

    // Default sorting option
    vm.typeFilter = '';
    vm.sortOptionValue = 'name';
    vm.sortOptionReverse = false;
    vm.anyDocSelected = 0;

    // Public functions
    vm.uploadFileStarted = uploadFileStarted;
    vm.saveDocToDocument = saveDocToDocument;
    vm.importError = importError;
    vm.deleteDoc = deleteDoc;

    init();

    // ------------------
    // Private functions
    // ------------------

    /**
     * @name init
     * @desc Initialize the controller
     */
    function init() {
        getAllDocument();

        $scope.$on('previewDocumentDelete', function (evt, data) {
            vm.deleteDoc(data);
        });
    }


    /**
     * @name uploadFileStarted
     * @desc trigger when a document upload has started
     */
    function uploadFileStarted() {
        vm.anyFileUpload = true;
    }

    /**
     * @name saveDocToDocument
     * @desc Add a document to the list of document when an uploading is successful
     * @param  {object} responseDetails The back end object response
     */
    function saveDocToDocument(responseDetails) {
        var fileType = getFileType(responseDetails[0].metadata.contentType, responseDetails[0].metadata.extension);
        var url = '';

        if (fileType === 'image') {
            url = '/api/projects/' + vm.projectId + '/document/' + responseDetails[0]._id + '/render/?thumbOnly=true';
        }

        vm.docs.unshift({
            _id: responseDetails[0]._id,
            projectId: vm.projectId,
            name: responseDetails[0].filename,
            size: responseDetails[0].length,
            date: responseDetails[0].uploadDate,
            ext: responseDetails[0].metadata.extension.toLowerCase(),
            contentType: responseDetails[0].metadata.contentType,
            type: fileType,
            selected: false,
            url: url,
            created_by: responseDetails[0].metadata.created_by,
            created_at: responseDetails[0].metadata.created_at,
            fileurl: '/api/projects/' + vm.projectId + '/document/' + responseDetails[0]._id + '/render'
        });
        vm.anyFileUpload = false;
        vm.nbDocs++;
    }

    /**
     * @name importError
     * @desc Display an error message about an error when importing document
     * @param  {object} error The error object
     */
    function importError(error) {
        uiError.create({
            content: error.code === 413 ? 'Sorry! We can’t upload files that big! Please reduce the file size or try another file.' : error.message,
            dismissOnTimeout: false
        });
    }

    /**
     * @name getFileType
     * @desc Function to check the content-type and return the file type
     * @param  {string} content_type The mime-type of the file
     * @param  {string} file_ext     The file extension of the file
     * @return {string}              The file type of the file
     */
    function getFileType(content_type, file_ext) {
        var type = 'document';
        var content = content_type.split('/');
        if (!_.isUndefined(content[0]) && !_.isUndefined(content[1])) {
            type = vm.fileType[content[0]];
            if (content[1].match(/(zip|rar)/)) {
                type = 'archives';
            }
            // Fix issue for windows as the mime-type of a zip file is returned as octet-stream
            if (content[1].match(/octet-stream/)) {
                if (file_ext === 'zip' || file_ext === 'rar') {
                    type = 'archives';
                }
            }
            return type;
        }
    }

    /**
     * @name deleteDoc
     * @desc Delete a document
     * @param  {object} doc The document object to be deleted
     */
    function deleteDoc(doc) {
        if (doc.selected) {
            vm.anyDocSelected -= 1;
        }

        ProjectFactory.deleteDocument({
            id: vm.projectId,
            assetId: doc._id
        }).$promise.then(function () {
                handleQueryResponseDeleteDocument(doc);
            }).catch(function error(response) {
                vm.loading = false;
                uiError.create({
                    content: response.data.error,
                    dismissOnTimeout: false
                });
            });
    }

    /**
     * @name handleQueryResponseDeleteDocument
     * @desc Handle the query reponse from a delete document call
     * @param  {object} response The backend response object
     */
    function handleQueryResponseDeleteDocument(doc) {
        vm.loading = false;
        vm.docs = _.without(vm.docs, _.findWhere(vm.docs, {
            _id: doc._id
        }));
        vm.nbDocs--;
    }

    /**
     * @name getAllDocument
     * @desc Get the list of all document
     */
    function getAllDocument() {
        ProjectFactory.getDocument({
            id: ActiveProjectService.id
        }).$promise.then(function (response) {
                handleQueryResponseAllDocument(response);
            }).catch(function error(response) {
                vm.loading = false;
                uiError.create({
                    content: response.data.error,
                    dismissOnTimeout: false
                });
            });
    }

    /**
     * @name handleQueryResponseAllDocument
     * @desc Handle a query reponse from a get all document call
     * @param  {object} response The backend response object
     */
    function handleQueryResponseAllDocument(response) {
        vm.loading = false;
        var url = '';
        var fileType = '';

        // Iterate over images
        for (var i = 0; i < response.length; i++) {
            fileType = getFileType(response[i].metadata.contentType, response[i].metadata.extension);
            url = '';
            vm.nbDocs++;

            // Is the item in the supported image list?
            if (fileType === 'image') {
                url = '/api/projects/' + ActiveProjectService.id + '/document/' + response[i]._id + '/render/';
                // Prototypes don't have thumbnails attached so don't append thumbnail to URL
                if (response[i].metadata.hasThumb) {
                    url += '?thumbOnly=true';
                }
            }

            vm.docs.unshift({
                _id: response[i]._id,
                projectId: ActiveProjectService.id,
                name: response[i].filename,
                size: response[i].length,
                date: response[i].metadata.created_at,
                ext: response[i].metadata.extension.toLowerCase(),
                contentType: response[i].metadata.contentType,
                type: fileType,
                selected: false,
                url: url,
                created_by: response[i].metadata.created_by,
                created_at: response[i].metadata.created_at,
                fileurl: '/api/projects/' + ActiveProjectService.id + '/document/' + response[i]._id + '/render/'
            });
        }
    }
};
