app.initialized().then(function (client) {
    window.client = client;
    $(".ZD_authentication").hide();
    $(document).on('click', '#authBtn', function () {
        $(".error_div").html("");
        $("#authBtn").prop("disabled", true);
        if ($("#apiKey").val().trim() === "")
            addIdAttr("apiKey", "Please enter Freshchat API Key");
        else
            idRemoveAtrr("apiKey");
        if ($("#domain").val().trim() === "") {
            addIdAttr("domain", "Please enter Freshchat Domain");
        }
        else {
            idRemoveAtrr("domain");
        }
        if ($("#apiKey").val().trim() !== "" && $("#domain").val().trim() !== "") {
            $("#authBtn").text("Authenticating...");
            getAgents(client);
        } else buttonEnable("authBtn");
    });
    $(document).on('fwChange', 'fw-select', function (e) {
        console.log("*******************")
        selectField = $(this).val();
        selectFieldText = $(this).text();
        console.log(e.target.value,e.target.text)
        console.log($(e.currentTarget).text())
        console.log(selectFieldText)
    });
    $(document).on('click', '#ZDauthBtn', function () {
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
        if (!selectField) {
            addIdAttr("aid", "Please select Abonnemangs-ID");
        }
        else {
            idRemoveAtrr("aid");
        }
        if ($("#password").val().trim() !== "" && emailPattern.test($("#email").val().trim()) && $("#subdomain").val().trim() !== "" && !!selectField) {
            $("#ZDauthBtn").text("Authenticating...");
            getTicketDetails();
        } else {
            buttonEnable("ZDauthBtn");
        }
    });
    $(document).on('fwChange', '#subdomain,#password,#email,#domain,#apiKey,fw-select', function () {
        buttonEnable("ZDauthBtn");
        idRemoveAtrr("subdomain");
        idRemoveAtrr("email");
        idRemoveAtrr("password");
        idRemoveAtrr("domain");
        idRemoveAtrr("apiKey");
        idRemoveAtrr("aid");
        $(".token_error_zd,.message_div,.error_div").html("");
    });
    $(document).on('change', 'textarea', function () {
        $(".token_error,.error_div").html("");
        buttonEnable("authBtn");
    });
}, function (error) {
    handleError(error, token_error);
});
function addIdAttr(id, message) {
    $("#" + id).attr("state", "error");
    $("#" + id).attr("state-text", message);
}
function buttonEnable(id) {
    $("#" + id).text("Authenticate");
    $("#" + id).prop("disabled", false);
}
function idRemoveAtrr(id) {
    $("#" + id).removeAttr("state");
    $("#" + id).removeAttr("state-text");
}
function getAgents(client) {
    var api_key = $("#apiKey").val();
    var domain = $("#domain").val();
    var headers = { "Authorization": "Bearer " + api_key };
    var options = { headers: headers };
    var url = `https://${domain}/v2/agents?items_per_page=2`;
    client.request.get(url, options).then(function () {
        $(".error_div").html("");
        $("#authBtn").text("Authenticated");
        $(".ZD_authentication").show();
        $(".authentication").hide();
        getZendeskFields();
    }, function (error) {
        handleError(error, "error_div");
        buttonEnable("authBtn");
    });
}
const getZendeskFields = function () {
    const sudomain = $("#subdomain").val().trim(), email = $("#email").val().trim(), password = $("#password").val().trim();
    var url = `https://${sudomain}/api/v2/ticket_fields.json`;
    var headers = { "Authorization": `Basic ` + btoa(`${email}/token:${password}`) };
    var options = { headers: headers };
    var selectElement = `<fw-select label="Abonnemangs-ID" id="aid" required placeholder="Select Abonnemangs-ID field from Zendesk"/>`;
    $('fw-button').prop("disabled", true);
    client.request.get(url, options).then(function (data) {
        try {
            let ticket_fields = JSON.parse(data.response).ticket_fields;
            console.log(ticket_fields)
            let customFields = ticket_fields.filter(field => field.type === 'text' || field.type === 'integer');
            console.log(customFields)
            $.each(customFields, function (k, v) {
                selectElement += `<fw-select-option value="${v.id}">${v.title}</fw-select-option>`;
            });
            selectElement += `</fw-select>`;
            $('.additionField').append(selectElement);
            if (!!fetchConfigs) {
                $('fw-select').val(fetchConfigs.selectField);
            }
            $('fw-spinner').hide();
            buttonEnable("ZDauthBtn");
        } catch (error) {
            console.error(error)
        }
    }, function () {
        $('.token_error_zd').html("Failed to get zendesk fields");
        buttonEnable("ZDauthBtn");
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
        $("#ZDauthBtn").text("Authenticated");
        $('.message_div').html("Integration setup successful");
        $(".token_error_zd").html("");
    }, function () {
        $('.token_error_zd').html("Integration setup failed. Please try again.");
        buttonEnable("ZDauthBtn");
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