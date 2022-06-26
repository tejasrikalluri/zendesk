$(document).ready(function () {
    app.initialized().then(function (_client) {
        var modal_client = _client;
        $("#modal-body,#partExisting,#agent,.agentLabel,.agentSpan,.existingNoTickets").hide();
        $("#m_button").prop("disabled", true);
        var getContextInfo = function (callback) {
            contextInfo(modal_client, callback);
        };
        getTicketFields(modal_client, getContextInfo);
        $("#cancel").off().click(function () {
            modal_client.instance.close();
        });
        $("#search").off().click(function () {
            $(this).prop("disabled", true);
            var ticket_id = $("#ticketId").val().trim();
            if (ticket_id !== "") {
                $(".ticketsList").html('');
                $("#existingMsg").show();
                $("#partNew").hide();
                getContextInfo(function (c_data) {
                    getTicket(ticket_id, modal_client, c_data);
                });
            } else {
                $(this).prop("disabled", false);
                showNotification(modal_client, "danger", "Please enter any Ticket ID");
            }
        });
        $(document).on('input', '#partNew input,textarea', function () {
            $("#m_button").prop("disabled", false);
        });
        $(document).on('change', `select,input[type=radio][name='optTicket']`, function () {
            $("#m_button").prop("disabled", false);
        });
        $("#ticketId").on("input", function () {
            $("#search").prop("disabled", false);
        });
        $("input[name='optradio']").click(function () {
            if ($('input:radio[name=optradio]:checked').val() === "new") {
                $("#ticketId").val("");
                $("#m_button").text("Create a Zendesk ticket");
                $("#m_button").prop("disabled", true);
                $("#partNew").show();
                $("#partExisting,.existingNoTickets").hide();
            } else {
                $("#m_button").text("Append to ticket");
                $(".ticketsList").html('');
                $("#m_button").prop("disabled", true);
                $("#search").prop("disabled", false);
                getExistingTickets(getContextInfo, modal_client, "change");
            }
        });
        $(document).on('change', '#group', function () {
            if ($(this).val() !== "Select") {
                $("#agent,.agentLabel,.agentSpan").hide();
                $('#agent option:not(:first)').remove();
                var options = {
                    "group_id": btoa($(this).val())
                };
                modal_client.request.invoke("getAssinableAgents", options).then(function (data) {
                    if (data.response.message === undefined) {
                        var count = 0, length = data.response.group_memberships.length, arr = data.response.group_memberships;
                        agentProcess(count, length, arr, modal_client);
                        if (data.response.next_page !== null) {
                            options.link = data.response.next_page;
                            modal_client.request.invoke("getAssinableAgents", options).then(function (data) {
                                if (data.response.message === undefined) {
                                    var count = 0, length = data.response.group_memberships.length, arr = data.response.group_memberships;
                                    agentProcess(count, length, arr, modal_client);
                                }
                            }, function (error) {
                                showNotification(modal_client, "danger", error.message);
                            });
                        }
                    }
                }, function (error) {
                    showNotification(modal_client, "danger", error.message);
                });
            }
        });

        $(document).on('click', '#m_button', function () {
            $(this).prop("disabled", true);
            let radioValue = $("input[name='optTicket']:checked").val();
            getContextInfo(function (c_data) {
                ($('#m_button').text() === "Append to ticket") ? formExportConv(c_data, radioValue, modal_client, "append") : clickWithNewTicket(c_data, modal_client);
            });
        });
    }, function () {
        showNotification(modal_client, "danger", "Something went wrong, please try again");
    });
    let formExportConv = function (c_data, ticket_id, modal_client, origin) {
        var arr = [];
        c_data.conversation.messages.reverse();
        $.each(c_data.conversation.messages, function (i, v) {
            formConvUI(v, arr);
        });
        var parse_id = parseInt(ticket_id);
        console.log(origin)
        searchInDb(modal_client, parse_id, arr, c_data, origin);
    }
    let formConvUI = function (v, arr) {
        var obj = {};
        obj["created_at"] = v.created_time;
        obj["actor_id"] = (v.actor_id !== undefined) ? atob(v.actor_id) : atob(v.org_actor_id);
        obj["message_parts"] = v.message_parts;
        obj["message_type"] = atob(v.message_type);
        obj["actor_type"] = atob(v.actor_type);
        obj["id"] = atob(v.id);
        arr.push(obj);
    }
    //for new user ticket create fetching the values
    function clickWithNewTicket(c_data, modal_client) {
        var subject = $("#subject").val().trim(), notes = $("#notes").val().trim(), status = $("#status").val();
        var obj = {
            "body": {
                "custom_fields": {
                }
            }
        };
        if (c_data.source === "new_ticket") {
            if (subject !== "" && notes !== "" && status !== "Select" && status !== "") {
                checkFieldValidation(subject, notes, obj);
                obj.body["requester_id"] = btoa(c_data.user_id);
                checkValid(modal_client, obj, c_data);
            } else
                showNotification(modal_client, "danger", "Please fill mandatory fields");
        } else if (c_data.source === "new_requester")
            formNewRequester(subject, notes, c_data, modal_client, obj, "not_resolve", status);
    }
    //search zendesk id from db
    function searchInDb(modal_client, id, arr, c_data, origin) {
        var trimmed_id = jQuery.trim(c_data.conversation.messages[c_data.conversation.messages.length - 1].id).substring(0, 30).trim(this) + "...";
        modal_client.db.get(id).then(function (d_data) {
            var db_id = d_data.conv_id;
            formAUI(modal_client, c_data, id, db_id, origin);
        }, function (error) {
            if (error.status === 404) {
                console.log("record not")
                setDb(modal_client, id, trimmed_id, arr, c_data, c_data.user_id, origin);
            } else
                showNotification(client, "danger", "Unable to fetch DB data");
        });
    }
    //check the db and conversation id form an object form a UI for internal note
    function formAUI(client, data, id, db_id, origin) {
        console.log(origin)
        var messages = data.conversation.messages, last_conv_id = messages[messages.length - 1].id;
        var arr = [], ui_arr = [];
        $.each(messages, function (i, v) {
            var trimmed_id = jQuery.trim(v.id).substring(0, 30).trim(this) + "...";
            arr.push(trimmed_id);
        });
        var trimmed_id = jQuery.trim(last_conv_id).substring(0, 30).trim(this) + "...";
        if (db_id === trimmed_id)
            showNotification(client, "info", "No new message for this conversation.");
        else {
            var index = $.inArray(db_id, arr);
            $.each(messages, function (i, v) {
                if (index > 0) {
                    if (i > index)
                        formConvUI(v, ui_arr);
                }
                if (index === -1)
                    formConvUI(v, ui_arr);
            });
            if (index != -1)
                updateDb(client, id, trimmed_id, ui_arr, data, origin);
            else if (index === -1) {
                setDb(client, id, trimmed_id, ui_arr, data, data.user_id, origin);
            }
        }
    }
    //set zendesk id in db
    function setDb(client, id, trimmed_id, arr, c_data, user_id, origin) {
        client.db.set(id, { conv_id: trimmed_id }).then(function () {
            console.log("setted")
            formUIforNote(arr, c_data, client, user_id, id, origin);
        }, function (error) {
            if (error.status !== 404)
                showNotification(client, "danger", error.message);
        });
    }
    //show tickets of user in append a ticket screen
    function getExistingTickets(getContextInfo, modal_client, source) {
        getContextInfo(function (data) {
            $("#partExisting label:first").html(`Enter an existing Ticket ID`);
            $("#ticketsOf").html(`Tickets in last 30 days`);
            $("#partExisting,#existingMsg").show();
            $("#partNew").hide();
            if (source === "change") {
                $("#ticketsLoad").hide();
            }
            if (data.source === "new_ticket") {
                getTickets(data, modal_client);
            } else {
                $("#m_button").prop("disabled", true);
                $("#partExisting,#existingMsg").hide();
                $(".existingNoTickets").show();
            }
        });

    }
    //get a ticket data when ticket id is being searched
    function getTicket(ticket_id, client, c_data) {
        var options = {
            "ticket_id": btoa(ticket_id)
        };
        client.request.invoke("getTicket", options).then(function (data) {
            if (data.response.message === undefined) {
                var resp = data.response, arr = [];
                formTicketUi(resp, arr, 0, c_data);
                $(".ticketsList").append(arr.join('')).show();
                $("#ticketsLoad").show();
                $(".ticketShow:nth-child(1)").find('input[type=radio]').attr('checked', true);
                $("#m_button").prop("disabled", false);
                $(".existingMsg").hide();
            }
        }, function (err) {
            $(".existingMsg").hide();
            $("#m_button").prop("disabled", true);
            if (err.status === 404) {
                showNotification(client, "danger", "Ticket not found, Please enter valid Ticket ID");
            } else if (err.status === 400) {
                showNotification(client, "danger", "Input value should be an integer");
            }
            else {
                showNotification(client, "danger", err.message);
            }
        });
    }
    //fetching the tickets of zendesk user
    function getTickets(c_data, client) {
        var options = {
            "user_id": btoa(c_data.user_id)
        };
        client.request.invoke("searchTickets", options).then(function (data) {
            if (data.response.message === undefined) {
                var resp = data.response, arr = [];
                if (resp.length > 0) {
                    $.each(resp, function (i, v) {
                        if (i <= 2) {
                            formTicketUi(v, arr, i, c_data);
                        }
                    });
                    $(".ticketsList").append(arr.join('')).show();
                    $("#ticketsLoad").show();
                    $(".ticketShow:nth-child(1)").find('input[type=radio]').attr('checked', true);
                    $("#m_button").prop("disabled", false);

                    $(".loader,.existingMsg").hide();
                } else {
                    $("#m_button").prop("disabled", true);
                    $("#partExisting,#existingMsg").hide();
                    $(".existingNoTickets").show();
                }
            }
        }, function (err) {
            showNotification(client, "danger", err.message);
        });
    }
    //when new messages are in db update db when create a internal note
    function updateDb(modal_client, id, conv_id, ui_arr, data, origin) {
        console.log(origin)
        var trimmed_id = jQuery.trim(conv_id).substring(0, 30).trim(this) + "...";
        modal_client.db.update(id, "set", { "conv_id": trimmed_id }).then(function () {
            formUIforNote(ui_arr, data, modal_client, data.user_id, id, origin);
        }, function () {
            showNotification(modal_client, "Unexpected error occured, please try again later!", "danger");
        });
    }
    // existing Tickets UI
    function formTicketUi(v, arr, i, c_data) {
        var subject = v.subject, date_split = v.created_at.split("T")[0], convert = new Date(date_split);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        var month_str = convert.getDate() + " " + monthNames[convert.getMonth()] + " " + convert.getFullYear();
        arr.push(`<div class="ticketShow"><div><input type="radio" name="optTicket" value="${v.id}"><a rel="noreferrer" id="subject_${i}" href="https://${c_data.domain}/agent/tickets/${v.id}" target="_blank" class="m_subject">${xssTest(subject)}</a></div>`);
        if (v.due_at !== null) {
            var date_split2 = v.due_at.split("T")[0], convert2 = new Date(date_split2);
            var month_str2 = convert2.getDate() + " " + monthNames[convert2.getMonth()] + " " + convert2.getFullYear();
            arr.push(`<div>Created at ${month_str} | Due at ${month_str2} </div></div>`);
        }
        else {
            var month_str2 = "~";
            arr.push(`<div>Created at ${month_str} | Due at ${month_str2} </div></div>`);
        }
        return arr;
    }
    // create ticket validation
    function checkFieldValidation(subject, notes, obj) {
        $("#m_button").attr("data-id", "valid");
        var regex = /.(?=.{4})/mg, subst = 'X';
        $("input[type='text'],input[type='number'],input[type='date']").each(function () {
            if ($(this).val().trim() !== "") {
                if ($(this).attr("id") !== "subject" && $(this).attr("id") !== "notes" && $(this).attr("id") !== "tags") {
                    if ($(this).attr("class").includes("partialcreditcard")) {
                        var value = $(this).val().trim();
                        obj.body.custom_fields[$(this).attr("id")] = btoa(value.replace(regex, subst));
                    } else
                        obj.body.custom_fields[$(this).attr("id")] = btoa($(this).val().trim());
                } else {
                    if ($(this).attr("id") === "tags")
                        obj.body["tags"] = btoa($(this).val().trim());
                    obj.body["tags"] = btoa($(this).val().trim());
                }
            }
        });
        $("select").each(function () {
            formSelectFieldBody(this, obj);
        });
        $("textarea").each(function () {
            formTextareaBody(this, obj);
        });
        $("input[type='checkbox']").each(function () {
            formCheckboxBody(this, obj);
        });
        obj.body["subject"] = btoa(subject);
        obj.body["description"] = btoa(notes);
    }
    //form body for ticket creation for select fields
    function formSelectFieldBody(ele, obj) {
        if ($(ele).prop("multiple")) {
            var array = $(ele).val();
            if (array.length !== 0)
                obj.body.custom_fields[$(ele).prop("id")] = btoa(array);
        } else {
            if ($(ele).val() !== "Select" && $(ele).val() !== "")
                otherSelects(ele, obj);
        }
    }
    //for single select forming a body for ticket creation
    function otherSelects(ele, obj) {
        if ($(ele).attr("id") !== "agent" && $(ele).attr("id") !== "status" && $(ele).attr("id") !== "priority" && $(ele).attr("id") !== "group")
            obj.body.custom_fields[$(ele).attr("id")] = btoa($(ele).val());
        else {
            obj.body[$(ele).attr("id")] = btoa($(ele).val());
        }
    }

    //for checkbox forming a body for ticket creation
    function formCheckboxBody(ele, obj) {
        if ($(ele).prop("checked")) {
            obj.body.custom_fields[$(ele).attr("id")] = btoa(true);
        }
        else
            obj.body.custom_fields[$(ele).attr("id")] = btoa(false);
    }
    //for textarea forming a body for ticket creation
    function formTextareaBody(ele, obj) {
        if ($(ele).attr("id") !== "notes" && $(ele).val().trim() !== "") {
            obj.body.custom_fields[$(ele).attr("id")] = btoa($(ele).val());
        }
    }
    //for new user forming a body for ticket creation
    function formNewRequester(subject, notes, c_data, modal_client, obj, origin, status) {
        $("#m_button").attr("data-id", "valid");
        if (subject !== "" && notes !== "" && c_data.email !== null && status !== "Select" && status !== "") {
            checkFieldValidation(subject, notes, obj);
            obj.body["name"] = btoa(c_data.name);
            if (c_data.email !== null) obj.body["email"] = btoa(c_data.email);
            checkOrigin(origin, modal_client, obj, c_data);
        } else
            showNotification(modal_client, "danger", "Please fill mandatory fields");
    }
    //for check validation for ticket creation
    function checkValid(modal_client, obj, data) {
        if ($("#m_button").attr("data-id") === "valid")
            ticketCreate(modal_client, obj, data);
    }
    //send origin for validtion of ticket creation data
    function checkOrigin(origin, modal_client, obj, c_data) {
        if (origin !== "resolved")
            checkValid(modal_client, obj, c_data);
    }
    //iterate loop for agents list
    function agentProcess(count, length, arr, client) {
        if (count < length)
            searchAgent(client, count, length, arr);
        else
            $("#agent,.agentLabel,.agentSpan").show();
    }
    //search an agent for appending agents in list
    function searchAgent(client, count, length, arr) {
        var decodedUserId = atob(arr[count].user_id);
        var options = {
            "assignee_id": btoa(decodedUserId)
        };
        client.request.invoke("searchAssignee", options).then(function (data) {
            if (data.response.message === undefined) {
                $('#agent')
                    .append($("<option></option>")
                        .attr("value", atob(data.response.id))
                        .text(atob(data.response.name)));
                var new_count = count + 1;
                agentProcess(new_count, length, arr, client);
            }
        }, function () {
            showNotification(client, "danger", "Failed to Agent details");
        });
    }

    //get all fields in zendesk
    function getTicketFields(client, getContextInfo) {
        var options = {};
        client.request.invoke("getTicketFields", options).then(function (data) {
            if (data.response.message === undefined) {
                var arr = [];
                $.each(data.response.ticket_fields, function (i, v) {
                    if (v.type === "status") {
                        $.each(v.system_field_options, function (i1, v2) {
                            $('#status')
                                .append($("<option></option>")
                                    .attr("value", v2.value)
                                    .text(v2.name));
                            if (v2.value === 'open')
                                $('#status').val(v2.name);
                        });
                    }
                    if (v.type === "priority") {
                        $.each(v.system_field_options, function (i1, v2) {
                            $('#priority')
                                .append($("<option></option>")
                                    .attr("value", v2.value)
                                    .text(v2.name));
                        });
                    }
                    formCustomFields(v, arr);
                });
                getGroups(client);
                $("#partNew").append(arr.join('')).show();
                console.log("****************")
                getContextInfo(function (c_info) {
                    console.log($("#partNew :input").filter(`#${c_info.selectField}`));
                    if (!$("#partNew :input").filter(`#${c_info.selectField}`).length)
                        appendSelectedField(c_info);
                    (c_info.conversation.assigned_agent_id) ?
                        $("#subject").val(`Fortnox chattärende - ${c_info.agent_obj[c_info.conversation.assigned_agent_id]}`) : $("#subject").val("Fortnox chattärende");
                    $(`#${c_info.selectField}`).val(c_info.tenantId);
                })
                formSelectFields(data);
            }
        }, function () {
            showNotification(client, "danger", "Failed to fetch Ticket fields");
        });
    }
    const appendSelectedField = function (c_info) {
        (c_info.tenantId) ?
            $("#partNew").append(`<label>Selected Abonnemangs-ID</label><br/><input id="${c_info.selectField}" type="text" value="${c_info.tenantId}" class="form-control" required></input>`) : $("#partNew").append(`<label>Selected Abonnemangs-ID</label><br/><input id="${c_info.selectField}" type="text" class="form-control" required></input>`);

    }
    //for forming body for custom fields
    function formCustomFields(v, arr) {
        if (v.visible_in_portal && v.active && v.type !== "assignee" && v.type !== "priority" && v.type !== "description" && v.type !== "subject")
            formTextFields(v, arr);
    }
    //for forming body for text fields
    function formTextFields(v, arr) {
        if (v.type === "text" || v.type === "regexp") {
            arr.push(`<label>${v.title}</label><br/>`);
            arr.push(`<input id="${v.id}" type="text" class="custom_fields custom_fields_${v.id} form-control" required>
</input>`);
        }
        else if (v.type === "partialcreditcard") {
            arr.push(`<label>${v.title}</label><br/>`);
            arr.push(`<input id="${v.id}" type="text" class="custom_fields custom_fields_${v.id} form-control partialcreditcard" required>
        </input>`);
        } else
            appendUI(v, arr);
    }
    //for forming body for select fields
    function formSelectFields(data) {
        $.each(data.response.ticket_fields, function (i, v) {
            if (v.type === "tagger" || v.type === "multiselect") {
                if (v.type === "tagger")
                    $(`#${v.id}`).append($("<option></option>").text("Select"));
                $.each(v.custom_field_options, function (i1, v1) {
                    $(`#${v.id}`).append($("<option></option>")
                        .text(v1.value));
                });
            }
            if (v.type === "multiselect") {
                $(`#${v.id}`).select2({});
            }
        });
    }
    //append dynamic custom fields from zendesk
    function appendUI(v, arr) {
        if (v.type === "textarea") {
            arr.push(`<label>${v.title}</label><br/>`);
            arr.push(`<textarea cols=98 rows=3 id="${v.id}" class="custom_fields custom_fields_${v.id} form-control" required>
          </textarea>`);
        }
        else if (v.type === "integer" || v.type === "decimal") {
            arr.push(`<label>${v.title}</label><br/>`);
            arr.push(`<input id="${v.id}" type="number" class="custom_fields custom_fields_${v.id} form-control" required>
            </input>`);
        } else if (v.type === "tagger") {
            arr.push(`<label>${v.title}</label><br/>`);
            arr.push(`<select class="custom_fields custom_fields_${v.id} form-control" id="${v.id}"></select>`);
        } else
            appendOtherFields(v, arr);
    }
    //append multiselect,checkbox,date fields from zendesk in ticket creation modal
    function appendOtherFields(v, arr) {
        if (v.type === "multiselect") {
            arr.push(`<label>${v.title}</label><br/>`);
            arr.push(`<select class="custom_fields custom_fields_${v.id}" id="${v.id}" name="${v.title}[]" multiple="multiple"></select>`);
        } else if (v.type === "checkbox") {
            arr.push(`<div class="checkbox">
            <label><input type="checkbox" id="${v.id}">${v.title}</label>
          </div>`);
        }
        else if (v.type === "date") {
            arr.push(`<label>${v.title}</label><br/>
            <input class="form-control custom_fields custom_fields_${v.id}" type="date" id="${v.id}">
            `);
        }

    }
    //get groups list from zendesk
    function getGroups(client) {
        var options = {};
        client.request.invoke("getGroups", options).then(function (data) {
            if (data.response.message === undefined) {
                $.each(data.response.groups, function (i, v) {
                    $('#group')
                        .append($("<option></option>")
                            .attr("value", v.id)
                            .text(v.name));
                });
                $(".spinner,#partExisting").hide();
                $("#modal-body").show();
            }
        }, function () {
            showNotification(client, "danger", "Failed to fetch Groups");
        });
    }
    //create ticket in zendesk
    function ticketCreate(client, options, c_data) {
        console.log(c_data)
        client.request.invoke("createTicket", options).then(function (data) {
            if (data.response.message === undefined) {
                console.log(data.response)
                formExportConv(c_data, data.response, client, "ticket");
            }
        }, function (error) {
            if (error.status === 400 || error.status === 422)
                showNotification(client, "danger", error.message.details.base[0].description);
            else
                showNotification(client, "danger", error.message);
        });
    }
    //get instance data
    function contextInfo(client, callback) {
        client.instance.context().then(function (context) {
            callback(context.data);
        }, function (error) {
            showNotification(client, "danger", error);
        });
    }
});