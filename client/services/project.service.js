'use strict';

// @ngInject
module.exports = function ($resource) {

    return $resource('/api/projects/:id/:action/:actionOption/:assetId/:assetAction', {
        id: '@_id'
    }, {
        createInvite: {
            method: 'POST',
            params: {
                id: '@_id'
            },
            url: '/api/projects/:id/invite/'
        },
        acceptInvite: {
            method: 'PUT',
            params: {
                id: '@_id',
                action: 'invite'
            }
        },
        rejectInvite: {
            method: 'DELETE',
            params: {
                id: '@_id',
                action: 'invite'
            }
        },
        revokePendingInvite: {
            method: 'DELETE',
            params: {
                id: '@_id',
                action: 'revoke',
                actionOption: 'invite'
            }
        },
        getTeam: {
            method: 'GET',
            params: {
                id: '@_id',
                action: 'team'
            }
        },
        setOwner: {
            method: 'PUT',
            params: {
                id: '@_id',
                action: 'owner'
            }
        },
        getDocument: {
            method: 'GET',
            isArray: true,
            params: {
                id: '@_id',
                action: 'document'
            }
        },
        deleteDocument: {
            method: 'DELETE',
            params: {
                id: '@_id',
                assetId: '@_assetId',
                action: 'document'
            }
        },
        archive: {
            method: 'PUT',
            params: {
                id: '@_id',
                action: 'settings',
                archived: '@archived'
            }
        },
        setPicture: {
            method: 'PUT',
            params: {
                id: '@_id',
                action: 'picture'
            }
        },
        publish: {
            method: 'PUT',
            params: {
                id: '@_id',
                action: 'publish'
            }
        },
        unpublish: {
            method: 'PUT',
            params: {
                id: '@_id',
                action: 'unpublish'
            }
        }
    });
};
