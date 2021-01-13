# Permit


## Introduction

Permit is a simple project with the serious responsibility of providing applications with permissions and preferences. 
It alleviates applications from having to deal with their own permission system and preferences persistence hurdle by providing a very simple API that helps resolving these types of information for them.
This of course comes with the price of deciding on a generic model for permissions and preferences storage. 
Though it might certainly not be a problem for the more open world of preferences, it could sound odd to try to have all the applications' permission related requirements stored within a single model.
The answer to this is that Permit comes with a model that covers most the applications' permission related requirements because it's:
 * simple: permissions are based on memberships and role names,
 * non-intrusive: once permissions are resolved, it's then up to the application to deal with them as it's the only one that knows how to react / apply them internally,
 * contextualized (if needed): permissions may be applied on contexts (or targets), which are stores, business units, countries, brands in the real world.

If you feel like Permit is not going to cover your application's specific permission-related requirements, then:
 * first ask yourself how far it is from covering them, if it's really worth it to go beyond what Permit already does, and is your permission design well engineered, ...
 * if the answer is still that you need your own permission system, then you are free to build it and be on your own. 


## Getting started immediately

You could be interested in starting to play with a mock image. It's a great way to learn how Permit works without risking to break anything. Even more so, this mock image could be handy in a lot of testing situations (like docker compositions, for instance). 
The mock docker image is named `permit-mock` and is available on Docker hub. For more information, please refer to the dedicated section below.

## Permissions

One may access a user's permissions on an application by requesting Permit on the `/permissions` path, providing along the following parameters: 
 * the user whose permissions have to be resolved,
 * the application name for which permissions should de found.

### Simple roles vs contextualized roles

Simple roles match situations where roles do not vary from a context to another. It works fine for applications eager to define several roles (sector manager, store manager, single user, ... ) that mean the same whatever the context (a store, business unit, country, ...).
One should always try to give this type of roles a chance before thinking about moving to contextualized roles.

Contextualized roles on the other hand accept an additional information to their definition, which tells the context on which the role applies. Contexts are also known as targets, as they help knowing that a manager role only applies on a specific store.

### Simple roles

For example performing a `GET` on the `/permissions?app=TEST&user=kermit@thefrog.com` URI will result in this:

```
{
    "user": "kermit@thefrog.com",
    "application": "TEST",
    "permissions": [
        {
            "role": "ROLE_MYROLE",
        }
    ]
}
```

As discussed earlier and as observed, the response will only ever inform the requester with the name of the roles, and only their names. As a simple naming rule, each role starts with the `ROLE_` prefix.

Then if a user has several roles for a given application, the response could like the following:
```
{
    "user": "kermit@thefrog.com",
    "application": "TEST",
    "permissions": [
        {
            "role": "ROLE_MYROLE1",
        },
        {
            "role": "ROLE_MYROLE2",
        }
    ]
}
```

### Contextualized roles

When circumstances require, applications may benefit from the contextualized role model. For example, one may define that a set of users have a manager role for the whole Europe area. 

In the following answer, the user has a `MANAGER` role for the application `TEST` in the context "IDF_SECTOR":

```
{
    "user": "kermit@thefrog.com",
    "application": "TEST",
    "permissions": [
        {
            "role": "ROLE_MANAGER",
            "targets": [
                "IDF_SECTOR"
            ]
        }
    ]
}
```

One may notice that `targets` is an array. Though it's currently not working, Permit should be able to states in the `targets` field every sub-contexts found under the one the role initially applies.

_**Please note:**_ The application is responsible for the roles interpretation, and moreover for the order they apply. For instance, if a role collision happens, an application will have to consider whether roles with higher contexts should override the ones with lower contexts.

_**Warning:**_ Don't mix up roles with user management. The contextualized roles **SHOULD NEVER** be used to know where a given user works or is assigned. In Permit, users, roles and targets are loosely coupled using declared strings that should not serve as a reference to where people work.

_**Please note:**_ You cannot update user's permissions using the API. The only option currently available is to find an administrator for this. Later in the project, an administration console will help you define your permissions yourself.


## Preferences

Permit also stores user preferences for the following scopes:
 * global (or for no specific application),
 * per application (or application specific).

### Read preferences

Reading a user's preferences is as easy as sending an HTTP request to Permit's API on the `/preferences` path, providing it with:
 * the user whose preferences have to be resolved,
 * the application name for which preferences should apply.

When sending a preferences request to Permit to access a user's preferences, the latter will always try to resolve both global and application specific preferences, just like in the following example:

```
GET /preferences?app=TEST&user=kermit@thefrog.com
```
returns
```
{
    "user": "kermit@thefrog.com",
    "application": "TEST",
    preferences: {
        "application": {
            "pref1": "value1",
            "pref2": 3
        },
        "global: {
            "pref3": true
        }
    }
}
```

### Update preferences

Preferences come as an unstructured map and may be returned to Permit the same way in order to update them.
That is, if you target the `/preferences` path using a `PUT` verb with the following body ...
```
{
    "user": "kermit@thefrog.com",
	"application": "TEST",
	"preferences": {
		"pref1":"value1",
		"pref2": 1
	}
}
```
... then all the previous preferences known for the given user on the given application are replaced.

_**Please note:**_ You cannot update a user's global preferences. In other words, there should always be an application in your request's body.

## Profile

The user's profile is a combination of both his permissions and preferences. It allows an application to get them both in a single request.

Getting a user's complete profile for a given application is as simple as issuing the following request:
```
GET /profile?app=TEST&user=kermit@thefrog.com
```
which returns
```
{
    "user": "kermit@thefrog.com",
    "application": "TEST",
    preferences: {
        "application": {
            "pref1": "value1",
            "pref2": 3
        },
        "global: {
            "pref3": true
        }
    },
    "permissions": [
        {
            "role": "ROLE_1",
            "targets": [
                "TARGET1"
            ]
        },
        {
            "role": "ROLE_2",
            "targets": [
                "TARGET2"
            ]
        }
    ]
}
```

_**Please note:**_ Because a profile only makes sense relatively to an application, there is no such thing as a "global" profile. In other words, it's not possible to access a user's profile without specifying an application name.

If no application specific permissions could be found for the user, any remaining preferences is returned anyway. And the same goes for the latter if none could be found, then only permissions are returned. Finally if no permissions and preferences set is resolved with the provided information, then the API will send back a 204. 

## Mocking Permit

There is now a mock Docker image available for all your testing scenarios. Whether you just want to give Permit a try or need it in your more complex testing environment, the mock image should help you.
The mock docker image is available on Docker hub and can be pulled using the name `gearedminds/permit-mock`. Its lifecycle and versions follow the ones of the regular Permit service image versions.

### Data files

The mock image does not rely on any persistence system at all. This globally means 2 things:
 * you will have to provide your own roles and preferences data through a set of files,
 * it will forget your data at each startup.

Using files to provision the mock image makes it very flexible and easy to use, as these files are human readable regular xlsx files. There's one file for the role definitions and one for the preferences. The mock image expects these files to be named respectively `roles.xlsx` and `preferences.xlsx` and both dropped into the container's `/home/permit/data` folder using a Docker volume (or mount).

Of course these files have their own formatting rules, but these are only simple columns to fill in with your data. There are examples of such expected files in the project: 
 * [sample role provision file](test/mock/data/roles.xlsx)
 * [sample preference provision file](test/mock/data/preferences.xlsx)

### Starting the mock image

The Permit docker image is accessible from Docker hub. Issuing the following command should set you on the right track:
 > docker pull gearedminds/permit-mock:latest

Provided your files are first stored in your local `./test/mock/data` folder for instance, the mock image can be started using this Docker run command:
 > docker run -it -p8080:8080 --mount type=bind,source="$(pwd)"/test/mock/data,target=/home/permit/data permit-mock

You should then be able to access the regular endpoint on your localhost (eg, http://localhost:8080/permissions?app=app1&user=user1).

### Composing with the mock image

You may always want to use the Permit mock image in a Docker composition. In that case, you could write something like this:
```
  permit-mock:
    image: gearedminds/permit-mock
    ...
    volumes:
      - ./myData:/home/permit/data
```

### Limitations

Permit's mock image only allows hits on read (GET) operations for the following endpoints:
* /permissions
* /preferences
* /profiles

Any attempt to access these endpoints to create or update data (POST and PUT) will result in a 500 status. There's no plan to have the mock image to handle these operations for now.