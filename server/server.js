var reqData = require('./lib/request_data');
var request = require('request');
var base64 = require('base-64');
exports = {
  onMessageCreateCallback: function (payload) {
    var message_data = payload.data.message;
    if (message_data.is_offline && payload.iparams.offlineVal) {
      var msg_arr = message_data.messages[0];
      if (msg_arr.message_type === "normal") {
        var message_parts = message_data.messages[0].message_parts[0], content = message_parts.text.content;
        var emailExist = validateEmail(content);
        if ("text" in message_parts && emailExist === false) searchUser(content, payload);
      }
    }
  },
  searchUser: function (args) {
    request(reqData.searchUser(args), function (err, resp, body) {
      if (err) {
        renderData(err);
      }
      if (resp !== undefined) {
        if (resp.statusCode === 200) {
          try {
            var respObj = JSON.parse(body);
            var obj = {
              "length": respObj.users.length
            };
            if (respObj.users.length !== 0) obj["id"] = base64.encode(respObj.users[0].id);
            renderData(null, obj);
          } catch (c_err) {
            renderData(c_err);
          }
        } else {
          var error = {
            status: resp.statusCode,
            message: body
          };
          renderData(error);
        }
      }

    });
  },
  searchTickets: function (args) {
    request(reqData.searchTickets(args), function (err, resp, body) {
      if (err) {
        renderData(err);
      }
      if (resp !== undefined) {
        if (resp.statusCode === 200) {
          try {
            var respObj = JSON.parse(body);
            var ticketArr = [];
            getTickets(respObj, ticketArr);
            renderData(null, ticketArr);
          } catch (c_err) {
            renderData(c_err);
          }
        } else {
          var error = {
            status: resp.statusCode,
            message: body
          };
          renderData(error);
        }
      }
    });
  },
  createTicket: function (args) {
    request(reqData.createTicket(args), function (err, resp, body) {
      if (err) {
        renderData(err);
      }
      if (resp !== undefined) {
        if (resp.statusCode === 201) {
          let respObj = {};
          respObj["id"] = resp.body.ticket.id;
          respObj["requester_id"] = resp.body.ticket.requester_id;
          renderData(null, respObj);
        }
        else {
          var error = {
            status: resp.statusCode,
            message: body
          };
          renderData(error);
        }
      }
    });
  },
  getTicketFields: function (args) {
    request(reqData.getTicketFields(args), function (err, resp, body) {
      if (err) {
        renderData(err);
      }
      if (resp !== undefined && resp.statusCode === 200) {
        try {
          var respObj = JSON.parse(body);
          renderData(null, respObj);
        } catch (c_err) {
          renderData(c_err);
        }
      } else {
        var error = {
          status: resp.statusCode,
          message: body
        };
        renderData(error);
      }
    });
  },
  createTicketComment: function (args) {
    request(reqData.createTicketComment(args), function (err, resp, body) {
      if (err) {
        renderData(err);
      }
      if (resp !== undefined) {
        if (resp.statusCode === 201 || resp.statusCode === 200) {
          renderData(null, resp.statusCode);
        } else {
          var error = {
            status: resp.statusCode,
            message: body
          };
          renderData(error);
        }
      }
    });
  },
  searchConversation: function (args) {
    request(reqData.searchConversation(args), function (err, resp, body) {
      if (err) {
        renderData(err);
      }
      if (resp !== undefined) {
        if (resp.statusCode === 200) {
          try {
            var respObj = JSON.parse(body);
            var messagesArray = [];
            getMessages(respObj.messages, messagesArray);
            renderData(null, messagesArray);
          } catch (c_err) {
            renderData(c_err);
          }
        } else {
          var error = {
            status: resp.statusCode,
            message: body
          };
          renderData(error);
        }
      }
    });
  },
  getAgents: function (args) {
    request(reqData.getAgents(args), function (err, resp, body) {
      if (err) {
        renderData(err);
      }
      if (resp !== undefined) {
        if (resp.statusCode === 200) {
          try {
            var respObj = JSON.parse(body);
            renderData(null, respObj);
          } catch (c_err) {
            renderData(c_err);
          }
        } else {
          var error = {
            status: resp.statusCode,
            message: body
          };
          renderData(error);
        }
      }
    });
  },
  getFcGroups: function (args) {
    request(reqData.getFcGroups(args), function (err, resp, body) {
      if (err) {
        renderData(err);
      }
      if (resp !== undefined) {
        if (resp.statusCode === 200) {
          try {
            var respObj = JSON.parse(body);
            renderData(null, respObj);
          } catch (c_err) {
            renderData(c_err);
          }
        } else {
          var error = {
            status: resp.statusCode,
            message: body
          };
          renderData(error);
        }
      }
    });
  },
  searchAssignee: function (args) {
    request(reqData.searchAssignee(args), function (err, resp, body) {
      if (err) {
        renderData(err);
      }
      if (resp !== undefined) {
        if (resp.statusCode === 200) {
          try {
            var respObj = JSON.parse(body);
            var obj = {
              "name": base64.encode(respObj.user.name),
              "id": base64.encode(respObj.user.id)
            };
            renderData(null, obj);
          } catch (c_err) {
            renderData(c_err);
          }
        } else {
          var error = {
            status: resp.statusCode,
            message: body
          };
          renderData(error);
        }
      }
    });
  },
  getTicket: function (args) {
    request(reqData.getTicket(args), function (err, resp, body) {
      if (err) {
        renderData(err);
      }
      if (resp !== undefined) {
        if (resp.statusCode === 200) {
          try {
            var respObj = JSON.parse(body);
            var ticketObj = {
              "id": respObj.ticket.id, "subject": respObj.ticket.subject,
              "description": respObj.ticket.description,
              "priority": respObj.ticket.priority, "status": respObj.ticket.status,
              "created_at": respObj.ticket.created_at,
              "assignee_id": (respObj.ticket.assignee_id !== null) ? base64.encode(respObj.ticket.assignee_id) : null,
              "submitter_id": base64.encode(respObj.ticket.submitter_id),
              "due_at": respObj.ticket.due_at
            };
            renderData(null, ticketObj);
          } catch (c_err) {
            renderData(c_err);
          }
        } else {
          var error = {
            status: resp.statusCode,
            message: body
          };
          renderData(error);
        }
      }
    });
  },
  getGroups: function (args) {
    request(reqData.getGroups(args), function (err, resp, body) {
      if (err) {
        renderData(err);
      }
      if (resp !== undefined) {
        if (resp.statusCode === 200) {
          try {
            var respObj = JSON.parse(body);
            renderData(null, respObj);
          } catch (c_err) {
            renderData(c_err);
          }
        } else {
          var error = {
            status: resp.statusCode,
            message: body
          };
          renderData(error);
        }
      }
    });
  },
  getAssinableAgents: function (args) {
    request(reqData.getAssinableAgents(args), function (err, resp, body) {
      if (err) {
        renderData(err);
      }
      if (resp !== undefined) {
        if (resp.statusCode === 200) {
          try {
            var respObj = JSON.parse(body);
            var assignableArray = [];
            getAssinableAgents(respObj.group_memberships, assignableArray);
            var obj = {
              "group_memberships": assignableArray, "next_page": respObj.next_page
            };
            renderData(null, obj);
          } catch (c_err) {
            renderData(c_err);
          }
        } else {
          var error = {
            status: resp.statusCode,
            message: body
          };
          renderData(error);
        }
      }
    });
  }
};
//check offline message is email or not
function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
function getAssinableAgents(array, formedArray) {
  for (let i = 0; i < array.length; i++) {
    var obj = {
      user_id: base64.encode(array[i].user_id)
    };
    formedArray.push(obj);
  }
  return formedArray;
}
//iterate conversation messages of freshchat and forming a object
function getMessages(messages, messagesArray) {
  for (let i = 0; i < messages.length; i++) {
    var obj = {};
    obj["created_at"] = messages[i].created_time;
    obj["actor_id"] = (messages[i].actor_id !== undefined) ? base64.encode(messages[i].actor_id) : base64.encode(messages[i].org_actor_id);
    obj["message_parts"] = messages[i].message_parts;
    obj["message_type"] = base64.encode(messages[i].message_type);
    obj["actor_type"] = base64.encode(messages[i].actor_type);
    obj["id"] = base64.encode(messages[i].id);
    messagesArray.push(obj);
  }
  return messagesArray;
}
//iterate and form tickets object
function getTickets(respObj, ticketArr) {
  for (let i = 0; i < respObj.tickets.length; i++) {
    if (i <= 3) {
      var obj = {
        "id": respObj.tickets[i].id, "subject": respObj.tickets[i].subject,
        "priority": respObj.tickets[i].priority, "status": respObj.tickets[i].status,
        "created_at": respObj.tickets[i].created_at,
        "assignee_id": (respObj.tickets[i].assignee_id !== null) ? base64.encode(respObj.tickets[i].assignee_id) : null,
        "due_at": respObj.tickets[i].due_at, "requester_id": base64.encode(respObj.tickets[i].requester_id)
      };
      ticketArr.push(obj);
    }

  }
  return ticketArr;
}
//search user in zendesk offline message is created
function searchUser(content, payload) {
  var actor_email, bodyObj = {}
  payload["body"] = bodyObj;
  if (payload.data.actor.email !== null)
    actor_email = payload.data.actor.email;
  payload.email = base64.encode(actor_email);
  request(reqData.searchUser(payload), function (err, resp, body) {
    if (resp !== undefined) {
      if (resp.statusCode === 200) {
        try {
          var respObj = JSON.parse(body);
          if (respObj.users.length !== 0) {
            var requester_id = respObj.users[0].id;
            payload.body.requester_id = base64.encode(requester_id);
          } else {
            var name = (payload.data.actor.last_name !== null) ? payload.data.actor.first_name + payload.data.actor.last_name : payload.data.actor.first_name;
            payload.body.email = base64.encode(actor_email);
            payload.body.name = base64.encode(name);
          }
          payload.body.subject = base64.encode(content);
          payload.body.description = base64.encode(content);
          payload.body.status = base64.encode("Open");
          createTicketInZendesk(payload);
        } catch (c_err) {
          console.error(c_err);
        }
      } else {
        var error = {
          status: resp.statusCode,
          message: body
        };
        console.error(error);
      }
    }

  });
}
//create offline message as zendesk ticket
function createTicketInZendesk(args) {
  request(reqData.createTicket(args), function (err, resp, body) {
    if (err) {
      console.error(err);
    }
    if (resp !== undefined) {
      if (resp.statusCode === 201) {
        console.info("Ticket created successfully.");
      } else {
        var error = {
          status: resp.statusCode,
          message: body
        };
        console.error(error);
      }
    }
  });
}