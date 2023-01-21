var base64 = require("base-64");
//for create ticket for new user
function createTicketForNewUser(args, body) {
    if (args.body.email !== null)
        body.ticket.requester["email"] = base64.decode(args.body.email);
    formCustomfieldsBody(args, body);
}
//for forming body for custom fields for ticket creation
function formCustomfieldsBody(args, body) {
    var arr = [];
    if (args.body.custom_fields !== undefined && Object.keys(args.body.custom_fields).length !== 0) {
        for (var key in args.body.custom_fields) {
            var obj1 = {};
            obj1["id"] = key;
            obj1["value"] = base64.decode(args.body.custom_fields[key]);
            arr.push(obj1);
        }
    }
    body.ticket["custom_fields"] = arr;
}
//form other default fields for ticket creation
function formOtherDefaultFields(args, body) {
    var tagsArr = [];
    if ("priority" in args.body)
        body.ticket.priority = base64.decode(args.body.priority);
    if ("group" in args.body)
        body.ticket.group_id = base64.decode(args.body.group);
    if ("agent" in args.body)
        body.ticket.assignee_id = base64.decode(args.body.agent);
    if ("tags" in args.body) {
        var tags = base64.decode(args.body.tags);
        if (tags.indexOf(',') !== -1) {
            tags = tags.split(',');
            body.ticket.tags = tags;
        }
        else {
            tagsArr.push(tags)
            body.ticket.tags = tagsArr;
        }
    }
}
exports = {
    searchUser: function (args) {
        let email = base64.decode(args.email);
        var baseURL = `https://${args.iparams.subdomain}/api/v2/`;
        var url = `${baseURL}users/search.json?query=${email}`;
        var headers = { "Authorization": "Basic " + base64.encode(`${args.iparams.email}/token:${args.iparams.password}`) };
        return {
            method: 'GET',
            url: url, headers: headers
        };
    }, searchTickets: function (args) {
        let user_id = base64.decode(args.user_id);
        var baseURL = `https://${args.iparams.subdomain}/api/v2/`;
        var url = `${baseURL}users/${user_id}/tickets/requested.json?sort_order=desc`;
        var headers = { "Authorization": "Basic " + base64.encode(`${args.iparams.email}/token:${args.iparams.password}`) };
        return {
            method: 'GET',
            url: url, headers: headers
        };
    },
    getTicketFields: function (args) {
        var baseURL = `https://${args.iparams.subdomain}/api/v2/`;
        var url = `${baseURL}ticket_fields.json`;
        var headers = { "Authorization": "Basic " + base64.encode(`${args.iparams.email}/token:${args.iparams.password}`) };
        return {
            method: 'GET',
            url: url, headers: headers
        };
    },
    createTicketComment: function (args) {
        var baseURL = `https://${args.iparams.subdomain}/api/v2/`;
        var ticket_id = base64.decode(args.body.ticket_id);
        var url = `${baseURL}tickets/${ticket_id}.json`;
        var array = args.body.array;
        var headers = { "Authorization": "Basic " + base64.encode(`${args.iparams.email}/token:${args.iparams.password}`) };
        var body = {
            "ticket": {
                "comment": {
                    "html_body": array.join(""), "author_id": base64.decode(args.body.author_id)
                }
            }
        };
        body.ticket.comment["public"] = true;
        return {
            method: 'PUT',
            url: url, headers: headers, body: body, json: true
        };
    },
    createTicket: function (args) {
        var baseURL = `https://${args.iparams.subdomain}/api/v2/`;
        var url = `${baseURL}tickets.json`;
        var headers = {
            "Authorization": "Basic " + base64.encode(`${args.iparams.email}/token:${args.iparams.password}`),
            "Content-Type": "application/json"
        };
        if ("requester_id" in args.body) {
            var body = {
                "ticket": {
                    "subject": base64.decode(args.body.subject),
                    "comment": {
                        "body": base64.decode(args.body.description)
                    }, "requester_id": base64.decode(args.body.requester_id), "status": base64.decode(args.body.status)
                }
            };
            body.ticket.comment["public"] = false;
            formOtherDefaultFields(args, body);
            formCustomfieldsBody(args, body);
            return {
                method: 'POST',
                url: url, headers: headers, body: body, json: true
            };
        } else {
            var body = {
                "ticket": {
                    "subject": base64.decode(args.body.subject),
                    "comment": {
                        "body": base64.decode(args.body.description)
                    },
                    "requester": {
                        "locale_id": 1,
                        "name": base64.decode(args.body.name),
                    }, "status": base64.decode(args.body.status)
                }
            };
            body.ticket.comment["public"] = false;
            formOtherDefaultFields(args, body);
            createTicketForNewUser(args, body);
            return {
                method: 'POST',
                url: url, headers: headers, body: body, json: true
            };
        }
    },
    getFcGroups: function (args) {
        var freshchatDomain = (args.iparams.region === "us") ? `api.freshchat.com` :
            `api.${args.iparams.region}.freshchat.com`;
        var url = `https://${freshchatDomain}/v2/groups?page=${args.page}&items_per_page=100`;
        var headers = { "Authorization": "Bearer " + args.iparams.api_key };
        return {
            method: 'GET',
            url: url, headers: headers
        };
    },
    searchAssignee: function (args) {
        let assignee_id = base64.decode(args.assignee_id);
        var baseURL = `https://${args.iparams.subdomain}/api/v2/`;
        var url = `${baseURL}users/${assignee_id}.json`;
        var headers = { "Authorization": "Basic " + base64.encode(`${args.iparams.email}/token:${args.iparams.password}`) };
        return {
            method: 'GET',
            url: url, headers: headers
        };
    },
    getTicket: function (args) {
        let ticket_id = base64.decode(args.ticket_id);
        var baseURL = `https://${args.iparams.subdomain}/api/v2/`;
        var url = `${baseURL}tickets/${ticket_id}.json`;
        var headers = { "Authorization": "Basic " + base64.encode(`${args.iparams.email}/token:${args.iparams.password}`) };
        return {
            method: 'GET',
            url: url, headers: headers
        };
    },
    getGroups: function (args) {
        var baseURL = `https://${args.iparams.subdomain}/api/v2/`;
        var url = `${baseURL}groups/assignable.json`;
        var headers = { "Authorization": "Basic " + base64.encode(`${args.iparams.email}/token:${args.iparams.password}`) };
        return {
            method: 'GET',
            url: url, headers: headers
        };
    },
    getAssinableAgents: function (args) {
        if ("link" in args) {
            var group_id = base64.decode(args.group_id);
            var baseURL = `https://${args.iparams.subdomain}${link}`;
            var headers = { "Authorization": "Basic " + base64.encode(`${args.iparams.email}/token:${args.iparams.password}`) };
            return {
                method: 'GET',
                url: baseURL, headers: headers
            };
        } else {
            var group_id = base64.decode(args.group_id);
            var baseURL = `https://${args.iparams.subdomain}/api/v2/`;
            var url = `${baseURL}groups/${group_id}/memberships/assignable.json`;
            var headers = { "Authorization": "Basic " + base64.encode(`${args.iparams.email}/token:${args.iparams.password}`) };
            return {
                method: 'GET',
                url: url, headers: headers
            };
        }
    }, searchConversation: function (args) {
        var conversation_id = base64.decode(args.conversation_id);
        var freshchatDomain = (args.iparams.region === "us") ? `api.freshchat.com` :
            `api.${args.iparams.region}.freshchat.com`;
        var url = `https://${freshchatDomain}/v2/conversations/${conversation_id}/messages?page=1&items_per_page=50`;
        var headers = { "Authorization": `Bearer ${args.iparams.api_key}` };
        return {
            method: 'GET',
            url: url, headers: headers
        };
    }
};