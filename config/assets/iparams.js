app.initialized().then(function (client) {
    window.client = client;
    $(".ZD_authentication,#fieldPart").hide();
    $(document).on('click', '#authBtn', function () {
        $(".error_div").html("");
        $("#authBtn").prop("disabled", true);
        if ($("#apiKey").val().trim() === "")
            addIdAttr("apiKey", "Please enter Freshchat API Key");
        else
            idRemoveAtrr("apiKey");
        if (!$("#region").val()) {
            addIdAttr("region", "Please select Freshchat Region");
        }
        else {
            idRemoveAtrr("domain");
            idRemoveAtrr("region");
        }
        if ($("#apiKey").val().trim() !== "" && $("#region").val()) {
            $("#authBtn").text("Authenticating...");
            getAgents(client);
        } else {
            $("#authBtn").text("Authenticate");
            buttonEnable("authBtn");
        }
    });
    $("#ZDauthBtn").click(function () {
        $(".token_error_zd").html("");
        if (!$("#aid").val()) {
            addIdAttr("aid", "Please select Abonnemangs-ID");
        }
        else {
            idRemoveAtrr("aid");
            $("#ZDauthBtn").prop("disabled", true).text("Validated");
        }
    });
    $(document).on('click', '#getZendeskFields', function () {
        $(".token_error_zd").html("");
        $(this).prop("disabled", true);
        var emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if ($("#password").val().trim() === "") {
            addIdAttr("password", "Please enter Password");
        }
        else {
            idRemoveAtrr("password");
        }
        if ($("#email").val().trim() === "") {
            addIdAttr("email", "Please enter Email");
        }
        else {
            if (emailPattern.test($("#email").val().trim()) === false) {
                addIdAttr("email", "Please enter valid Email");
            } else {
                idRemoveAtrr("email");
            }
        }
        if ($("#subdomain").val().trim() === "") {
            addIdAttr("subdomain", "Please enter Subdomain");
        }
        else {
            idRemoveAtrr("subdomain");
        }
        if ($("#password").val().trim() !== "" && emailPattern.test($("#email").val().trim()) && $("#subdomain").val().trim() !== "") {
            getTicketDetails();
        } else {
            buttonEnable("getZendeskFields");
        }
    });
    $(document).on('fwChange', '#subdomain,#password,#email,#apiKey,#aid,#region', function () {
        buttonEnable("getZendeskFields");
        buttonEnable("ZDauthBtn");
        idRemoveAtrr("subdomain");
        idRemoveAtrr("email");
        idRemoveAtrr("password");
        idRemoveAtrr("apiKey");
        idRemoveAtrr("aid");
        idRemoveAtrr("region");
        $(".token_error_zd,.message_div,.error_div").html("");
    });
    $(document).on('change', 'textarea', function () {
        $(".token_error,.error_div").html("");
        buttonEnable("authBtn");
        $("#authBtn").text("Authenticate");
    });
}, function (error) {
    handleError(error, token_error);
});
function addIdAttr(id, message) {
    $("#" + id).attr("state", "error");
    $("#" + id).attr("state-text", message);
}
function buttonEnable(id) {
    $("#" + id).prop("disabled", false);
}
function idRemoveAtrr(id) {
    $("#" + id).removeAttr("state");
    $("#" + id).removeAttr("state-text");
}
function to(promise, improved) {
    return promise
        .then((data) => [null, data])
        .catch((err) => {
            if (improved) {
                Object.assign(err, improved);
            }
            return [err];
        });
}
async function getAgents(client) {
    let err, reply;
    const url = ($("#region").val() === "us") ? `api.freshchat.com` :
        `api.${$("#region").val()}.freshchat.com`;
    console.log(btoa($("#apiKey").val()), $("#apiKey").val());
    [err, reply] = await to(client.request.invokeTemplate("get_agents", { "context": { url, "apiKey": $("#apiKey").val() } }));
    if (err) {
        console.log(err);
        handleError(err, "error_div");
        $("#authBtn").text("Authenticate");
        buttonEnable("authBtn");
    }
    if (reply) {
        $(".error_div").html("");
        $(".ZD_authentication").show();
        $(".authentication").hide();
    }
}
const getZendeskFields = async function () {
    const sudomain = $("#subdomain").val().trim(), email = $("#email").val().trim(), password = $("#password").val().trim();
    var selectElement = `<fw-select label="Abonnemangs-ID" id="aid" required placeholder="Select Abonnemangs-ID field from Zendesk"/>`;
    var ticketSelectElement = `<fw-select label="Ticket Fields" id="ticketFields" placeholder="Please select fields which need to display in ticket create modal" multiple>`;
    $('#ZDauthBtn').prop("disabled", true);
    let err, reply;
    [err, reply] = await to(client.request.invokeTemplate("fetch_zendesk_fields", { "context": { "auth": btoa(`${email}/token:${password}`), sudomain } }));
    if (err) {
        console.log(err);
        $('.token_error_zd').html("Failed to get zendesk fields");
        buttonEnable("getZendeskFields");
        $("#fieldPart").hide();
        $(".ZD_authentication").show();
    }
    if (reply) {
        getZdFieldsResponse(reply, ticketSelectElement, selectElement);
    }
}
const getZdFieldsResponse = function (reply, ticketSelectElement, selectElement) {
    try {
        let ticket_fields = JSON.parse(reply.response).ticket_fields;
        ticket_fields = ticket_fields.filter(field => field.visible_in_portal && field.active);
        console.log('after filter')
        console.log(ticket_fields)
        let customFields = ticket_fields.filter(field => field.type === 'text' || field.type === 'regexp');
        $.each(customFields, function (k, v) {
            mapText[v.id] = v.title;
            selectElement += `<fw-select-option value="${v.id}">${v.title}</fw-select-option>`;
        });
        let selectionTicketFields = ticket_fields.filter(field => field.type !== 'subject' && field.type !== 'description' && field.type !== 'priority' && field.type !== 'status' && field.type !== 'group' && field.type !== 'assignee');

        $.each(selectionTicketFields, function (k, v) {
            mapText[v.id] = v.title;
            ticketSelectElement += `<fw-select-option value="${v.id}">${v.title}</fw-select-option>`;
        });
        selectElement += `</fw-select>`;
        ticketSelectElement += `</fw-select>`;
        $('.additionField').append(selectElement);
        $('.ticketFieldContainer').append(ticketSelectElement);
        if (!!fetchConfigs) {
            $('#aid').val(fetchConfigs.selectField);
            let multiSelect = document.getElementById('ticketFields');
            multiSelect.setSelectedValues(fetchConfigs.ticketFields);
        }
        $('fw-spinner').hide();
        buttonEnable("ZDauthBtn");
    } catch (error) {
        console.error(error)
    }
}
async function getTicketDetails() {
    var sudomain = $("#subdomain").val().trim();
    var email = $("#email").val().trim();
    var password = $("#password").val().trim();
    let err, reply;
    [err, reply] = await to(client.request.invokeTemplate("fetch_zd_tickets", { "context": { "auth": btoa(`${email}/token:${password}`), sudomain } }));
    if (err) {
        $('.token_error_zd').html("Something went wrong to proceed. Please try again.");
        buttonEnable("getZendeskFields");
    }
    if (reply) {
        $(".token_error_zd").html("");
        $(".ZD_authentication").hide();
        $("#fieldPart").show();
        getZendeskFields();
    }
}
function handleError(error, errorid) {
    if (error.status === 400) {
        $('.' + errorid).html("Invalid Input entered, please verify the fields and try again.");
    } else if (error.status === 401 || error.status === 403) {
        $('.' + errorid).html("Invalid Credentials were given or Subscription to the service expired.");
    } else if (error.status === 404) {
        $('.' + errorid).html("Invalid Domain entered, please check the field and try again");
    } else if (error.status === 500) {
        $('.' + errorid).html("Unexpected error occurred, please try after sometime.");
    } else if (error.status === 502) {
        $('.' + errorid).html("Error in establishing a connection.");
    } else if (error.status === 504) {
        $('.' + errorid).html("Timeout error while processing the request.");
    } else {
        $('.' + errorid).html("Unexpected Error");
    }
}