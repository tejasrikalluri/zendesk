$(document).ready(function () {
    app.initialized().then(function (_client) {
        window.viewTicketClient = _client;
        contextInfo(viewTicketClient);
    }, function () {
        showNotification(viewTicketClient, "error", "Something went wrong, please try again");
    });
    //get context data
    function contextInfo(client) {
        client.instance.context().then(function (context) {
            getTicket(context.data, client);
        }, function (error) {
            showNotification(client, "danger", error);
        });
    }
    //fetch zendesk ticket data
    function getTicket(c_data, client) {
        var options = {
            "ticket_id": btoa(c_data.ticket_id)
        };
        client.request.invoke("getTicket", options).then(function (data) {
            if (data.response.message === undefined) {
                var resp = data.response, arr = []; const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ];
                var created_at = resp.created_at, creatSplit = created_at.split("T")[0];
                var convert1 = new Date(creatSplit), month_str1 = convert1.getDate() + " " + monthNames[convert1.getMonth()] + " " + convert1.getFullYear();
                getTicketAssignedTo(resp, client, arr, month_str1, monthNames, c_data.domain);
            }
        }, function (err) {
            if (err.status === 404)
                showNotification(client, "danger", "Ticket not found");
            else
                showNotification(client, "danger", err.message);
        });
    }
    //get ticket assignee
    function getTicketAssignedTo(ticket, client, arr, month_str1, monthNames, domain) {
        if (ticket.assignee_id !== null) {
            checkAssignee(atob(ticket.assignee_id), client, function (aData) {
                var assigneeTo = atob(aData.name);
                checkAssignee(atob(ticket.submitter_id), client, function (aData) {
                    var assignedBy = atob(aData.name);
                    displayTicketDetails(arr, ticket, month_str1, monthNames, assigneeTo, assignedBy, domain);
                });
            });
        } else {
            checkAssignee(atob(ticket.submitter_id), client, function (aData) {
                var assignedBy = atob(aData.name);
                displayTicketDetails(arr, ticket, month_str1, monthNames, "~", assignedBy, domain);
            });
        }

    }
    //display tickets details
    function displayTicketDetails(arr, ticket, month_str1, monthNames, assigneeTo, assignedBy, domain) {
        arr.push(`<div class="msubject">${xssTest(ticket.subject)}</div>`);
        arr.push(`<div class="msubjval"><a href="https://${domain}/agent/tickets/${ticket.id}" rel="noreferrer" target="_blank">#${ticket.id}</a></div>`);
        arr.push(`<p class="mcreated">Created On</p>`);
        arr.push(`<div class="val">${month_str1}</div>`);
        arr.push(`<p class="mdesc">Description</p>`);
        arr.push(`<div class="val">${xssTest(ticket.description)}</div>`);
        arr.push(`<p class="mdue">Due On</p>`);
        if (ticket.due_at !== null) {
            var due_at = ticket.due_at, dueSplit = due_at.split("T")[0], convert2 = new Date(dueSplit);
            var month_str2 = convert2.getDate() + " " + monthNames[convert2.getMonth()] + " " + convert2.getFullYear();
            arr.push(`<div class="val">${month_str2}</div>`);
        } else arr.push(`<div class="val">~</div>`);
        arr.push(`<p class="massigned">Assigned To</p>`);
        arr.push(`<div class="val">${xssTest(assigneeTo)}</div>`);
        arr.push(`<p class="mstatus">Status</p>`);
        arr.push(`<div class="val">${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}</div>`);
        arr.push(`<p class="mpriority">Priority</p>`);
        (ticket.priority !== null) ?
            arr.push(`<div class="val">${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}</div>`) : arr.push(`<div class="val">~</div>`);
        arr.push(`<p class="massignedby">Assigned By</p>`);
        arr.push(`<div class="val">${xssTest(assignedBy)}</div>`);
        $(".viewTicket").append(arr.join('')).show();
        $(".spinner").hide();
    }
});