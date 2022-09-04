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
function getAgents(client) {
    var api_key = $("#apiKey").val();
    region = $("#region").val();
    var headers = { "Authorization": "Bearer " + api_key };
    var options = { headers: headers };
    const url = ($("#region").val() === "us") ? `https://api.freshchat.com/v2/agents?items_per_page=2` :
        `https://api.${$("#region").val()}.freshchat.com/v2/agents?items_per_page=2`;
    client.request.get(url, options).then(function () {
        $(".error_div").html("");
        $(".ZD_authentication").show();
        $(".authentication").hide();
    }, function (error) {
        handleError(error, "error_div");
        $("#authBtn").text("Authenticate");
        buttonEnable("authBtn");
    });
}
const getZendeskFields = function () {
    const sudomain = $("#subdomain").val().trim(), email = $("#email").val().trim(), password = $("#password").val().trim();
    var url = `https://${sudomain}/api/v2/ticket_fields.json`;
    var headers = { "Authorization": `Basic ` + btoa(`${email}/token:${password}`) };
    var options = { headers: headers };
    var selectElement = `<fw-select label="Abonnemangs-ID" id="aid" required placeholder="Select Abonnemangs-ID field from Zendesk"/>`;
    var ticketSelectElement = `<fw-select label="Ticket Fields" id="ticketFields" placeholder="Please select fields which need to display in ticket create modal" multiple>`;
    $('#ZDauthBtn').prop("disabled", true);
    client.request.get(url, options).then(function (data) {
        try {
            let ticket_fields = JSON.parse(data.response).ticket_fields;
            console.log(ticket_fields)
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
    }, function () {
        $('.token_error_zd').html("Failed to get zendesk fields");
        buttonEnable("getZendeskFields");
        $("#fieldPart").hide();
        $(".ZD_authentication").show();
    });
}
function getTicketDetails() {
    var sudomain = $("#subdomain").val().trim();
    var email = $("#email").val().trim();
    var password = $("#password").val().trim();
    var url = `https://${sudomain}/api/v2/tickets.json?page[size]=1`;
    var headers = { "Authorization": `Basic ` + btoa(`${email}/token:${password}`) };
    var options = { headers: headers };
    client.request.get(url, options).then(function () {
        $(".token_error_zd").html("");
        $(".ZD_authentication").hide();
        $("#fieldPart").show();
        getZendeskFields();
    }, function () {
        $('.token_error_zd').html("Something went wrong to proceed. Please try again.");
        buttonEnable("getZendeskFields");
    });
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