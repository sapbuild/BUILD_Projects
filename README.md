Projects Module
===============

[![Build](https://img.shields.io/travis/sapbuild/Projects.svg?style=flat-square)](http://travis-ci.org/sapbuild/projects)
[![Version](https://img.shields.io/npm/v/norman-projects-client.svg?style=flat-square)](https://npmjs.org/package/norman-projects)
[![Dependency Status](https://david-dm.org/sapbuild/Projects.svg)](https://david-dm.org/sapbuild/projects)
[![devDependency Status](https://david-dm.org/sapbuild/Projects/dev-status.svg)](https://david-dm.org/sapbuild/projects#info=devDependencies)
[![Coverage](https://img.shields.io/coveralls/sapbuild/Projects/master.svg?style=flat-square)](https://coveralls.io/r/sapbuild/projects?branch=master)

# BUILD on GitHub

[Click here](https://github.com/SAP/BUILD) to visit the central BUILD project on GitHub, where you can find out more!

[Click here](https://github.com/SAP/BUILD/blob/master/Contributing.md) to view the BUILD Contribution Guidelines. 

# Prerequisites for local development
1. MongoDB is installed
2. NPM is download, installed and available from the command line

# Installation
1. Ensure the correct proxy settings are enabled:

    ```sh
    git config --global http.proxy http://proxy:8080
    npm config set proxy http://proxy:8080
    npm config set registry http://build-npm.mo.sap.corp:8080/
    ```

2. Ensure that grunt is available from the command line;
    
    ```sh
    npm install –g grunt-cli 
    npm install grunt 
    ```

3. Install the required node modules (dependencies) from package.json;
    
    ```sh
    npm install
    ```

4. To access a local instance of projects;

Note: ensure you have a local instance of mongo running on port 27017 before starting up

    grunt dev
    grunt serve


Open, http://localhost:9000

# Other commands
    
    grunt dev            // build in development mode
    grunt test           // Run test and eslint
    grunt serve          // build dev + start express server + watch js & less for changes
    grunt serve:debug    // run app in debug mode (with node-inspector)
    grunt dist           // build for production
    
    
# Exposed API Calls
```sh
[GET, POST, PUT] /api/projects/
[GET] /api/projects/?showArchived=true|false
```
- JSON response containing all projects associated with the users profile
- Supported filters [?showArchived=true|false], return a list of projects filtered by the archive flag. If flag is omitted you receive ALL projects
- to archive a project, you call PUT, passing in the following body '{"archived":true}', similar to how you would update the project and its respective fields.

```sh
[DELETE] /api/projects/:projectId/revoke
```
- Allowing the owner of the project ONLY to revoke certain items i.e. invited users

```sh
[POST, PUT, PATCH, DELETE] /api/projects/:projectId/invite
```
- Allowing the user to accept, reject and create invites for a project
- ACL is only on POST, there is no ACL on the PUT, PATCH and DELETE as user wont be a collaborator on the project as we wont have their user ID to apply to ACL

```sh
[GET] /api/projects/:projectId/team
```
- Return a JSON response of all team members of a project i.e. Rejected User, Invite List and Collaborators
- User must be a member of the project in order to carry out any of these tasks

```sh
[GET] /api/projects/:projectId/
[PUT, PATCH, DELETE] /api/projects/:projectId/settings
```
- JSON response containing specific project details
- ACL is enforced to owner to update, archive or delete a project
- User must be a member of the project in order to carry out any of these tasks

```sh
[GET, POST] /api/projects/:projectId/document/
[GET] /api/projects/:projectId/document/?fileType=image/png|image/jpeg
[GET] /api/projects/:projectId/document/?thumbOnly=true|false [default is false]
[POST] /api/projects/:projectId/document/?linkImage=true [default is false]
```
- Upload and retrieve files belonging to a specific project
- Supported filters [?fileType=image/png, thumbOnly=true|false], these can be combined in one request as well
- Append linkImage=true to the POST if you want to attach a thumbnail to the main image. This thumbnail needs to be uploaded/created by the UI client, it is not created on the server. Setting this attribute to true will populate the parent_id in the thumbnail.
- User must be a member of the project in order to carry out any of these tasks

```sh
[GET] /api/projects/:projectId/document/:assetId/
[GET] /api/projects/:projectId/document/:assetId/?thumbOnly=true|false
```
- Handle specific asset details, response is in JSON format
- Supported filters [thumbOnly=true|false, default is false], these can be combined in one request
- User must be a member of the project in order to carry out any of these tasks

```sh
[GET] /api/projects/:projectId/document/:assetId/:version/
[GET] /api/projects/:projectId/document/:assetId/:version/render/
```
- Handle specific asset details, response is in JSON format
- Supported filters [thumbOnly=true|false, default is false]
- User must be a member of the project in order to carry out any of these tasks

```sh
[GET] /api/projects/:projectId/document/:assetId/render/
[GET] /api/projects/:projectId/document/:assetId/render/?thumbOnly=true|false
[GET] /api/projects/:projectId/document/:assetId/render/?download=true|false
[GET] /api/projects/:projectId/document/:assetId/:version/render/?thumbOnly=true|false
[GET] /api/projects/:projectId/document/:assetId/:version/render/?download=true|false
```
- Render the latest asset that has been uploaded
- Supported filters [thumbOnly=true|false, default is false], show the upload thumb version of the parent image
- Supported filters [download=true|false, default is false], allows the user to download the file, does not return a 304 and sets content-disposition with 'attachment' 
- User must be a member of the project in order to carry out any of these tasks

```sh
[PUT] /api/projects/:projectId/picture/
```
- Update the thumbnail that is displayed for a Project (the thumbnail is base64 encoded)

```sh
[GET] /api/projects/:projectId/history
[POST] /api/projects/:projectId/history
```
- Log and retrieve project history
- User must be a member of the project in order to carry out any of these tasks

# Sample Representation of Projects JSON
```sh
{  
   "name":"Project Name",
   "_id":"9c8d76dedc7a6aac09b213c7",
   "reject_list":[  

   ],
   "invite_list":[  

   ],
   "user_list":[  
      {  
         "user_id":"54ef1f481393a84bbfe0f75f",
         "email":"somebody@joe.com"
      }
   ],
   "deleted":false,
   "stats":{  
      "created_by":"54ef1f481393a84bbfe0f75f",
      "updated_by":"54ef1f481393a84bbfe0f75f",
      "updated_at":"2015-02-26T15:50:15.927Z",
      "created_at":"2015-02-26T15:50:15.927Z"
   }
}
```

# Sample Representation of Asset JSON
```sh
[  
   {  
      "_id":"54ef40b8e67672a0d62ec381",
      "filename":"SapLogo.png",
      "length":222,
      "uploadDate":"2015-02-26T15:50:16.895Z",
      "metadata":{  
         "updated_at":1424965816891,
         "created_at":1424965816891,
         "project":"67f7ac1818872a9e09b213c8",
         "contentType":"image/png",
         "extension":"png",
         "version":1,
         "isThumb":false,
         "hasThumb":false,
         "created_by":"54ef1f481393a84bbfe0f761",
         "updated_by":"54ef1f481393a84bbfe0f761"
      }
   }
]
```
