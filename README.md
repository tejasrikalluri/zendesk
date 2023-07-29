## Zendesk

##Overview
This integration lets you access & view a user’s support tickets from Zendesk from within Freshchat.

##Description
To provide seamless DIY integration with Zendesk and with this integration with Freshchat, customers using Zendesk as their ticketing solution will be able to access and view a user’s support tickets from Zendesk, from within Freshchat. This information helps a Support Agent on chat better understand the problem of the user, and be able to update the associated Zendesk tickets right from within Freshchat.

The Primary Features of the app are:
-View Zendesk tickets associated with the user
-Create a new ticket from the chat conversation
-Automatically convert Offline messages to a ticket
-Search for a ticket using Ticket ID
-Append conversation to an existing Zendesk ticket


### Project folder structure explained

    .
    ├── README.md                  This file.
    ├── app                        Contains the files that are required for the front end component of the app
    │   ├── app.js                 JS to render the dynamic portions of the app
    │   ├── icon.svg               Sidebar icon SVG file. Should have a resolution of 64x64px.
    │   ├── style.css              Style sheet for the app
    │   ├── template.html          Contains the HTML required for the app’s UI
    ├── config                     Installation parameter configs.
    │   ├── assets
    │   │    └── iparams.css       Style sheet for the iparams
             └── iparams.js        JS to render the dynamic portions of the iparams
    │   ├── iparams.html           Installation parameter config in English language.
    └── manifest.json              Project manifest.
    └── server                     Business logic for remote request and event handlers.
        ├── lib
        │   └── helper.js
        │   └── request_data.js    JS to render the dynamic portions of the project
        ├── server.js
        └── test_data               Sample payloads for local testing
            ├── onMessageCreate.json

in this version changed to request template with region specific