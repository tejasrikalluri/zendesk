//show notifications
function showNotification(client, type, message) {
    client.interface.trigger("showNotify", {
        type: type,
        message: message
    });
}
// get subdomain from iparams
function getSubdomainData(client, callback) {
    client.iparams.get("subdomain").then(function (data) {
        callback(data.subdomain);
    }, function () {
        showNotification(client, "danger", "Failed to fetch Iparams Subdomain.");
    });
}
const getAbonnemangsId = function (client, callback) {
    client.iparams.get("selectField").then(function (data) {
        callback(data.selectField);
    }, function () {
        showNotification(client, "danger", "Failed to fetch Iparams Subdomain.");
    });
}
//search assignee in zendesk
var checkAssignee = function (assignee_id, client, callback) {
    var options = {
        "assignee_id": btoa(assignee_id)
    };
    client.request.invoke("searchAssignee", options).then(function (data) {
        if (data.response.message === undefined)
            callback(data.response);
    }, function (err) {
        showNotification(client, "danger", err.message);
    });
}
//form UI for Internal note in zendesk while appending existing ticket
function formUIforNote(array, c_data, client, requester_id, id, origin) {
    var arr = [];
    $.each(array, function (k, v) {
        if (v.actor_type === "agent" && v.message_type === "normal") {
            $.each(v.message_parts, function (k2, v2) {
                forAgentMessages(v2, arr, c_data, v.actor_id);
            });
        }
        if (v.actor_type === "user" && v.message_type === "normal") {
            $.each(v.message_parts, function (k3, v3) {
                forReceiverMessages(v3, c_data, arr, v.actor_id);
            });
        }
    });
    if (arr.length !== 0)
        createInternalNote(client, arr, requester_id, id, c_data, origin);
}
//Create a Internal note in zendesk
function createInternalNote(client, array, requester_id, id, c_data, origin) {
    var options = {
        body: {
            "author_id": btoa(requester_id),
            "array": array,
            "ticket_id": btoa(id),
            "conv_id": btoa(c_data.conversation.conv_id), origin: btoa(origin)
        }
    };
    client.request.invoke("createTicketComment", options).then(function () {
        sendInstaceForNewUser(c_data, client, origin);
    }, function () {
        showNotification(client, "error", "Failed to create a note");
    });
}
//send data after creating a new ticket for new user
function sendInstaceForNewUser(c_data, client, origin) {
    if (c_data.email !== null)
        sendDataToInstance(client, c_data.email, origin);
}
//send data after creating a new ticket for user
function sendDataToInstance(client, data, origin) {
    client.instance.send({
        message: {
            email: data,
            origin: origin
        }
    });
    client.instance.close();
    if (origin !== "append") {
        showNotification(client, "success", "Ticket created successfully.");
    } else {
        showNotification(client, "success", "Conversation has been append to respective ticket.");
    }
}
//get agent messages from conversation
function forAgentMessages(v2, arr, data, actor_id) {
    var firstLetter = data.agent_obj[actor_id].charAt(0), capital_letter = firstLetter.toUpperCase();
    if ("text" in v2) {
        checkOtherStrings(v2, arr, capital_letter, data, actor_id);
    }
    forImageAndFile(v2, arr, capital_letter, data, actor_id);
}
//form other messages types 
function checkOtherStrings(v2, arr, capital_letter, data, actor_id) {
    if (!v2.text.content.includes("Conversation was reopened by") && !v2.text.content.includes("Conversation was assigned to") && !v2.text.content.includes("Unassigned from group by") && !v2.text.content.includes("Assigned to") && !v2.text.content.includes("...requests")) {
        arr.push(`<br/><div style="margin-bottom: 45px">`);
        arr.push(`<div style="font-size:12px;font-weight:500;margin-left:70%;color:#6f7071;margin-right:36px">${data.agent_obj[actor_id]}</div>`);
        arr.push(`<img src="https://images.freshchat.com/30x30/fresh-chat-names/Alphabets/${capital_letter}.png" style="width:30px;height: 30px;border-radius:6px 50% 50% 50%;margin-left:5px;float:right;margin-right:17%" class="inline-image"/>`);
        arr.push(`<div style="float:right;border-radius:20px 4px 20px 20px;background-color:#ffffff;max-width:390px;padding:12px"><div>${xssTest(v2.text.content)}</div></div>`);
        arr.push(`</div><br/>`);
    }
}
//form image,url button and file messages from conversation
function forImageAndFile(v2, arr, capital_letter, data, actor_id) {
    if ("image" in v2) {
        var image_name_index = v2.image.url.lastIndexOf("/"), image_name = v2.image.url.substring(image_name_index + 1);
        arr.push(`<br/><div style="margin-bottom: 45px">`);
        arr.push(`<div style="font-size:12px;font-weight:500;margin-left:70%;color:#6f7071;margin-right:36px">${data.agent_obj[actor_id]}</div>`);
        arr.push(`<img src="https://images.freshchat.com/30x30/fresh-chat-names/Alphabets/${capital_letter}.png" style="width:30px;height:30px;border-radius:6px 50% 50% 50%;margin-left:5px;float:right;margin-right:17%" class="inline-image"/>`);
        arr.push(`<div style="float:right;border-radius:20px 4px 20px 20px;background-color:#ffffff;max-width:390px;padding:12px"><div><b>Click to open the image: </b><a rel="noreferrer" href="${v2.image.url}" target="_blank">${image_name}</a></div></div>`);
        arr.push(`</div><br/>`);
    }
    if ("file" in v2) {
        arr.push(`<br/><div style="margin-bottom: 45px">`);
        arr.push(`<div style="font-size:12px;font-weight:500;margin-left:70%;color:#6f7071;margin-right:36px">${data.agent_obj[actor_id]}</div>`);
        arr.push(`<img src="https://images.freshchat.com/30x30/fresh-chat-names/Alphabets/${capital_letter}.png" style="width:30px;height:30px;border-radius:6px 50% 50% 50%;margin-left:5px;float:right;margin-right:17%" class="inline-image"/>`);
        arr.push(`<div style="float:right;border-radius:20px 4px 20px 20px;background-color:#ffffff;max-width:390px;padding:12px"><div>* File attached - <b>${v2.file.name}</b></div></div>`);
        arr.push(`</div><br/>`);
    }
    if ("url_button" in v2) {
        arr.push(`<br/><div style="margin-bottom: 45px">`);
        arr.push(`<div style="font-size:12px;font-weight:500;margin-left:70%;color:#6f7071;margin-right:36px">${data.agent_obj[actor_id]}</div>`);
        arr.push(`<img src="https://images.freshchat.com/30x30/fresh-chat-names/Alphabets/${capital_letter}.png" style="width:30px;height:30px;border-radius:6px 50% 50% 50%;margin-left:5px;float:right;margin-right:17%" class="inline-image"/>`);
        arr.push(`<div style="float:right;border-radius:20px 4px 20px 20px;background-color:#ffffff;max-width:390px;padding:12px"><b>${v2.url_button.label}</b></div>`);
        arr.push(`</div><br/>`);
    }
}
//form customer messages from conversation
function forReceiverMessages(v3, data, arr) {
    arr.push(`<br/><div style="margin-bottom: 45px">`);
    var first_letter = data.name.charAt(0), capital_letter = first_letter.toUpperCase();
    arr.push(`<div style="font-size: 12px;font-weight: 500;color: #6f7071;margin-left: 33px">${data.name}</div>`);
    arr.push(`<img src="https://images.freshchat.com/30x30/fresh-chat-names/Alphabets/${capital_letter}.png" style="width: 30px;height: 30px;border-radius: 6px 50% 50% 50%;margin-left: 5px;float: left;clear: right" class="inline-image"/>`);
    if ("text" in v3) {
        arr.push(`<div  style="float: left;border-radius: 20px 4px 20px 20px;background-color: #ffffff;max-width:390px;padding:12px"><div>${xssTest(v3.text.content)}</div></div>`);
    }
    if ("image" in v3) {
        arr.push(`<div style="float: left;border-radius: 20px 4px 20px 20px;background-color: #ffffff;max-width:390px;padding:12px"><div><b>Click to open the image: </b>a<a href="${v3.image.url}" rel="noreferrer" target="_blank">${v3.image.url}</a></div></div>`);
    }
    if ("file" in v3) {
        arr.push(`<div style="float: left;border-radius: 20px 4px 20px 20px;background-color: #ffffff;max-width:390px;padding:12px"><div>* File attached - <b>${v3.file.name}</b></div></div>`);
    }
    arr.push(`</div><br/>`);
}
//for XSS
function xssTest(name) {
    return $("<span></span>").text(name)[0].innerHTML;
}