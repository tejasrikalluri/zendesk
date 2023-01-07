$(document).ready(function () {
    app.initialized().then(function (_client) {
        var client = _client;
        $("#msg").show();
        var agent_obj = {}, userData = function (callback) {
            getEmailData(client, callback);
        }, getUserId = function (callback) {
            getUserIdData(client, userData, callback);
        }, getSubdomain = function (callback) {
            getSubdomainData(client, callback);
        }, getConversation = function (callback) {
            getConversationDetails(client, callback);
        }, getSelectedField = function (callback) {
            getIparamsFields(client, callback);
        }, group_obj = {}
        client.events.on('app.activated', function () {
            $("#no_email,#ticket_details,.fw-widget-wrapper,.create_ticket_div").hide();
            $("#ticket_details").html("");
            $("#msg").show();
            getUserDetails(client, getSubdomain);
            instanceReceive(client, getSubdomain);
            getAgentsData(client, agent_obj, 1);
            getGroupsData(client, group_obj, 1);
        }, function () {
            showNotification(client, "danger", "Something went wrong,please try again");
        });
        $("#add_ticket,.chevron").on().click(function (e) {
            e.preventDefault();
            getSubdomain(function (s_data) {
                userData(function (u_data) {
                    getConversation(function (c_data) {
                        getSelectedField(function (selectField) {
                            if ($("#add_ticket").attr("data-id") === "new_requester") {
                                var obj = {
                                    email: u_data.email,
                                    source: "new_requester",
                                    name: u_data.name, "domain": s_data, conversation: c_data, agent_obj: agent_obj, selectField: selectField.selectField, tenantId: u_data.tenantId, selectFieldText: selectField.selectFieldText, group_obj, ticketFields: selectField.ticketFields, selectedTicketFieldText: selectField.selectedTicketFieldText
                                };
                                showModal("Create a Zendesk ticket", "createTicket.html", obj, client);
                            } else
                                createTicketUser(getUserId, u_data, client, getSubdomain, c_data, agent_obj, selectField, group_obj);
                        });

                    });
                });
            });
            console.log(group_obj)
        });
        $(document).on("click", ".subject,.tchevron", function (e) {
            var ticket_id = $(this).attr('data-id');
            getSubdomain(function (s_data) {
                var obj = {
                    ticket_id: ticket_id,
                    domain: s_data
                };
                showModal("Zendesk Ticket details", "viewTicketDetails.html", obj, client);
            });
            e.stopImmediatePropagation();
            e.preventDefault();
        });
    }, function () {
        showNotification(client, "danger", "Something went wrong, please try again");
    });
    //modal template with dynamic data
    function showModal(title, template, data, client) {
        client.interface.trigger("showModal", {
            title: title,
            template: template,
            data: data
        });
    }
    // create ticket show modal
    function createTicketUser(getUserId, u_data, client, getSubdomain, c_data, agent_obj, selectField, group_obj) {
        getSubdomain(function (s_data) {
            getUserId(function (ui_data) {
                var obj = {
                    source: "new_ticket",
                    user_id: ui_data,
                    email: u_data.email, name: u_data.name, "domain": s_data, conversation: c_data, agent_obj: agent_obj, selectField: selectField.selectField, tenantId: u_data.tenantId, selectFieldText: selectField.selectFieldText, group_obj, ticketFields: selectField.ticketFields, selectedTicketFieldText: selectField.selectedTicketFieldText
                };
                showModal("Create a Zendesk ticket", "createTicket.html", obj, client);
            });
        });
    }
    //get chat conversation details
    function getConversationDetails(client, callback) {
        client.data.get("conversation").then(function (data) {
            getConversationData(client, callback, data);
        }, function () {
            showNotification(client, "danger", "Unable to fetch Conversation data, please try again");
        });
    }
    //get fifty conversation messages in freshchat
    function getConversationData(client, callback, d_conv) {
        console.log(d_conv)
        var options = {
            "conversation_id": btoa(d_conv.conversation.conversation_id)
        };
        client.request.invoke("searchConversation", options).then(function (data) {
            if (data.response.message === undefined) {
                var resp = data.response;
                resp = filterLatestDate(resp);
                var obj = {
                    conv_id: d_conv.conversation.conversation_id,
                    user: d_conv.conversation.users[0].first_name,
                    messages: resp,
                    assigned_agent_id: d_conv.conversation.assigned_agent_id,
                    assigned_group_id: d_conv.conversation.assigned_group_id
                };
                console.log(obj)
                callback(obj);
            }
        }, function (err) {
            showNotification(client, "danger", err.message);
        });
    }
    let filterLatestDate = (resp) => {
        let latestDate = resp[0].created_at.split("T")[0];
        const found_date_messages = resp.filter(v => v.created_at.split("T")[0] === latestDate); return found_date_messages;
    };

    //get agents list in freshchat
    function getAgentsData(client, agent_obj, page) {
        var options = { page };
        client.request.invoke("getAgents", options).then(function (data) {
            if (data.response.message === undefined) {
                $.each(data.response.agents, function (k, v) {
                    agent_obj[v.id] = (v.last_name) ? v.first_name + " " + v.last_name : v.first_name;
                });
                if (data.response.pagination.total_pages !== data.response.pagination.current_page) {
                    let new_page = page + 1;
                    getAgentsData(client, agent_obj, new_page);
                }
            }
        }, function (err) {
            showNotification(client, "danger", err.message);
        });
    }
    let getGroupsData = function (client, group_obj, page) {
        var options = { page };
        client.request.invoke("getFcGroups", options).then(function (data) {
            if (data.response.message === undefined) {
                $.each(data.response.groups, function (k, v) {
                    group_obj[v.id] = v.name;
                });
                if (data.response.pagination.total_pages !== data.response.pagination.current_page) {
                    let new_page = page + 1;
                    getGroupsData(client, group_obj, new_page);
                }
            }
        }, function (err) {
            showNotification(client, "danger", err.message);
        });

    };
    //get user id using call back function
    function getUserIdData(client, userData, callback) {
        userData(function (email) {
            if (email !== undefined)
                getZendeskUserId(email.email, client, callback);
        });
    }
    //received from modal data and showing latest data when new requester
    function instanceReceive(client, getSubdomain) {
        client.instance.receive(function (event) {
            var data = event.helper.getData();
            $("#ticket_details").html("");
            $(".fw-widget-wrapper").hide();
            $("#msg").show();
            searchUserInZendesk(data.email, client, getSubdomain);
        });
    }
    //get only user id call back function
    function getZendeskUserId(email, client, callback) {
        var options = {
            "email": btoa(email)
        };
        client.request.invoke("searchUser", options).then(function (data) {
            if (data.response.message === undefined) {
                var resp = data.response;
                var length = resp.length;
                if (length > 0) {
                    var user_id = atob(resp.id);
                    callback(user_id);
                }
            }
        }, function (err) {
            showNotification(client, "danger", err.message);
        });
    }
    //get user email using callback
    function getEmailData(client, callback) {
        client.data.get("user").then(function (data) {
            if (data.user.email !== null && data.user.first_name !== null) {
                var obj = {
                    email: data.user.email
                };
                if (data.user.last_name !== null)
                    obj["name"] = data.user.first_name + " " + data.user.last_name; else obj["name"] = data.user.first_name;
                let props = data.user.properties;
                let tenantProp = props.filter(v => v.name === "tenantId");
                if (tenantProp.length)
                    obj['tenantId'] = tenantProp[0].value;
                callback(obj);
            }
        }, function () {
            showNotification(client, "danger", "Unable to fetch User data, please try again");
        });
    }
    //get user details and searching in zendesk
    function getUserDetails(client, getSubdomain) {
        client.data.get("user").then(function (data) {
            if (data.user.email !== null)
                searchUserInZendesk(data.user.email, client, getSubdomain);
            else {
                $("#no_email").html("Please add Email and try again").show();
                $("#add_ticket,#msg,#ticket_details").hide();
                instanceResize(client, "90px");
                $(".fw-widget-wrapper").show();
            }
        }, function () {
            showNotification(client, "danger", "Unable to fetch User data, please try again");
        });
    }
    // search a user in zendesk and displaying user details
    function searchUserInZendesk(email, client, getSubdomain) {
        $(".create_ticket_div").show();
        var options = {
            "email": btoa(email)
        };
        client.request.invoke("searchUser", options).then(function (data) {
            if (data.response.message === undefined) {
                var resp = data.response;
                var length = resp.length;
                $("#add_ticket").attr("data-id", "new_ticket");
                $("#add_ticket").show();
                if (length !== 0) {
                    var user_id = atob(resp.id);
                    searchTickets(user_id, client, getSubdomain);
                } else {
                    $("#add_ticket").attr("data-id", "new_requester");
                    instanceResize(client, "270px");
                    $(".fw-widget-wrapper").show();
                    $("#msg").hide();
                }
            }
        }, function (err) {
            showNotification(client, "danger", err.message);
        });
    }
    //for display Tickets in widget forming an UI
    function displayTickets(arr, i, s_data, v, obj, client, tickets) {
        arr.push(`<div id="ticket_${i}" class="ticket">`);
        var ticketData = textTruncate(v.subject, v.id);
        arr.push(`<a id="subject_${i}" data-id="${v.id}" title="${ticketData.title}" rel="noreferrer" class="subject">${ticketData.subject}</a>`);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        arr.push(`<div class="w100"><div class="w85"><table border="0" class="ticket_info">
                            <tr>
                              <td class="label_info">Status</td>
                              <td id="">
                              <div class="value_info">${v.status.charAt(0).toUpperCase() + v.status.slice(1)}</div>
                              </td>
                            </tr>`);
        arr.push(`<tr>
                            <td class="label_info">
                              Assigned To
                            </td>
                            <td id="">
                              <div class="value_info">${obj[v.id]}</div>
                            </td>
                          </tr>
                        `);
        if (v.due_at !== null) {
            var date_split2 = v.due_at.split("T")[0];
            var convert2 = new Date(date_split2);
            var month_str2 = convert2.getDate() + " " + monthNames[convert2.getMonth()] + " " + convert2.getFullYear();
            arr.push(`<tr>
                              <td class="label_info">Due On</td>
                              <td id="">
                                <div class="value_info">${month_str2}</div>
                              </td>
                            </tr></table></div><div class="w25"><fw-icon class="tchevron" data-id="${v.id}" name="chevron-right" size="8" color="blue"></fw-icon></div></div>`);
        }
        else {
            var month_str2 = "~";
            arr.push(`<tr>
                              <td class="label_info">Due On</td>
                              <td id="">
                                <div class="value_info">${month_str2}</div>
                              </td>
                             </tr></table></div><div class="w25"><fw-icon class="tchevron" data-id="${v.id}" name="chevron-right" size="8" color="blue"></fw-icon></div></div>`);
        }
        arr.push(`</div>`);
        instanceResize(client, "500px");
        var new_i = i + 1;
        process(tickets.length, new_i, tickets, arr, obj, s_data, client);
        if (tickets.length > 3) {
            if (new_i > 2) {
                arr.push(`<fw-icon name="open-new-tab" size="8" color="blue"></fw-icon>
                    <a class="more" id="view_more" rel="noreferrer" href="https://${s_data}/agent/users/${atob(v.requester_id)}/requested_tickets" target="_blank">View all tickets in zendesk</a>`);
                $(".fw-widget-wrapper").show();
                $("#msg").hide();
            }
        } else {
            if (tickets.length === new_i) {
                $(".fw-widget-wrapper").show();
                $("#msg").hide();
            }
        }
        $("#ticket_details").html(arr.join("")).show();
    }
    // for long zendesk ticket subject truncate
    function textTruncate(subject, id) {
        var xxsTestSubject = xssTest(subject);
        var shortname = (xxsTestSubject.length > 24) ? xxsTestSubject.substring(0, 24) + "... " + "#" + id : xxsTestSubject + " #" + id;
        var obj = {
            "title": xxsTestSubject, "subject": shortname
        };
        return obj;
    }
    //search tickets for a user and displaying ticket details
    function searchTickets(user_id, client, getSubdomain) {
        var options = {
            "user_id": btoa(user_id)
        };
        client.request.invoke("searchTickets", options).then(function (data) {
            if (data.response.message === undefined) {
                getSubdomain(function (s_data) {
                    var resp = data.response;
                    var arr = [], obj = {}, count = 0;
                    if (resp.length > 0)
                        process(resp.length, count, resp, arr, obj, s_data, client);
                    else {
                        instanceResize(client, "270px");
                        $(".fw-widget-wrapper").show();
                        $("#msg").hide();
                    }
                });
            }
        }, function (err) {
            showNotification(client, "danger", err.message);
        });
    }
    //iterating assignee loop
    function process(len, count, t_arr, arr, obj, s_data, client) {
        if (count < len) {
            if (count <= 2) {
                getAssignee(arr, count, t_arr[count], s_data, obj, client, t_arr);
            }
        }
    }
    //resizing the widget instance
    function instanceResize(client, size) {
        client.instance.resize({
            height: size
        });
    }
    //display UI of tickets along with Asignee
    function getAssignee(arr, count, v, s_data, obj, client, t_arr) {
        if (v.assignee_id !== null) {
            checkAssignee(atob(v.assignee_id), client, function (aData) {
                var assignee = atob(aData.name);
                obj[v.id] = assignee;
                displayTickets(arr, count, s_data, v, obj, client, t_arr);
            });
        } else {
            obj[v.id] = "~";
            displayTickets(arr, count, s_data, v, obj, client, t_arr);
        }
    }
});
