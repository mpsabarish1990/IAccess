$(function () {
    // keys and configurations
    var configStoreListNames = "Config Store";
    var configStoreCategorys = "DataTable";
    var currentUser_Approval = null;
    var clientContexts;
    var collListItems;
    var jsonvalues = "";
    var Webpart_Title_Approval = "";
    var expand_internal_entry_approval = [];
    var final_internal_name_approval = "";
    var expand_internal_name_approval = "";
    var currentuserdetails_Approval = "";
    // $.showLoader();
    var internal_name = [];
    //SP.SOD.executeFunc('sp.js', 'SP.clientContext', inits);
    var keyCollections = {
        "MyApprovals": "",
        "Date Format": ""
    };

    var keys = Object.keys(keyCollections);
    var query = new CamlBuilder()
        .Where().TextField("Key").In(keys)
        .And().TextField("Category").EqualTo(configStoreCategorys);


    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', starts_approval);

    function starts_approval() {
        clientContexts = new SP.ClientContext(_spPageContextInfo.webAbsoluteUrl);
        web = clientContexts.get_web();
        var oList = web.get_lists().getByTitle(configStoreListNames);
        var camlQuery = new SP.CamlQuery();
        camlQuery.set_viewXml('<View><Query>' + query + '</Query></View>');
        collListItems = oList.getItems(camlQuery);
        currentUser_Approval = web.get_currentUser();
        clientContexts.load(currentUser_Approval);
        clientContexts.load(collListItems);
        clientContexts.executeQueryAsync(Function.createDelegate(this, onQuerySucceededs), Function.createDelegate(this, onQueryFailedS));
    }

    function onQuerySucceededs(sender, args) {
        var listItemEnumerator = collListItems.getEnumerator();
        while (listItemEnumerator.moveNext()) {
            var oListItem = listItemEnumerator.get_current();
            if (!keyCollections[oListItem.get_item('Key')]) {
                keyCollections[oListItem.get_item('Key')] = oListItem.get_item('Value');

            }
        }

     


      

            currentuserdetails_Approval = currentUser_Approval.get_id();
            jsonvalues = keyCollections["MyApprovals"];
            bindtheadhtml_Templates();
            bindtbodyhtml_Templates();
            load_DataTable_Valuess();

        
        

      

    }

    function onQueryFailedS(sender, args) {
        //$.hideLoader();
        alert(args.get_message() + '\n' + args.get_stackTrace());
    }

   
    function bindtheadhtml_Templates() {
        var tableheader_html_Approval = "";
        var obj = JSON.parse(jsonvalues);
       // listDisplayName = obj.listname;
        tableheader_html_Approval += '<tr>';
        for (var i = 0 ; i < obj.fields.length; i++) {
            if (obj.fields[i].unsort != undefined) {
                tableheader_html_Approval += '<th class="' + obj.fields[i].unsort + '">' + obj.fields[i].displayname + '</th>';
            }
            else {
                if (obj.fields[i].displayname != undefined) {
                    tableheader_html_Approval += '<th>' + obj.fields[i].displayname + '</th>';
                }
            }


        }
        if (obj.button != undefined) {
            if (obj.button.length > 0) {
                for (var j = 0 ; j < obj.button.length; j++) {
                    if (obj.button[j].unsort != undefined) {
                        tableheader_html_Approval += '<th class="' + obj.button[j].unsort + '">' + obj.button[j].displayname + '</th>';
                    }
                }
            }
        }
        tableheader_html_Approval += '</tr>';
        $("#DataTable_thead_Approval").html(tableheader_html_Approval);
    }

    function bindtbodyhtml_Templates() {

        var html_template_Approval = "";
        html_template_Approval += '<script id="DataTable-templates_Approval" type="text/x-handlebars-template">';
        html_template_Approval += '{{#results}}';
        html_template_Approval += '<tr>';
        var obj = JSON.parse(jsonvalues);
        for (var i = 0 ; i < obj.fields.length; i++) {
            if (obj.fields[i].fieldtemplate != undefined) {
                html_template_Approval += obj.fields[i].fieldtemplate;
            }
            else {
                if (obj.fields[i].hiddencolumn == undefined) {
                    html_template_Approval += '<td>{{' + obj.fields[i].name + '}}</td> ';
                }
            }
        }
        if (obj.button != undefined) {
            if (obj.button.length > 0) {
                for (var j = 0 ; j < obj.button.length; j++) {
                    html_template_Approval += obj.button[j].fieldtemplate
                }
            }
        }
        html_template_Approval += '</tr>';
        html_template_Approval += '{{/results}}';
        html_template_Approval += ' </script>';
        $("#DataTable_tbody_Approval").html(html_template_Approval);
    }

    function load_DataTable_Valuess() {
        var field_name_html = "";
        var field_name = "";
        var expand_field_name = "";
        var expand_name = [];
        var listname_json = "";
        var obj = JSON.parse(jsonvalues);

        for (var i = 0 ; i < obj.fields.length; i++) {
           if (obj.fields[i].field != undefined) {
               field_name = obj.fields[i].field;

               expand_name.push(obj.fields[i].name);

           }
           else {
               field_name = obj.fields[i].name;
           }
           if (obj.fields.length == i + 1) {

               field_name_html += field_name;
           }
           else {
               field_name_html += field_name + ",";
           }
        }
        for (var j = 0; j < expand_name.length; j++) {
           if (expand_name.length == j + 1) {
               expand_field_name += expand_name[j];
           }
           else {
               expand_field_name += expand_name[j] + ",";
           }
        }

        // var endPointUrl = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + obj.listname + "')/items?$select=" + url;
        var endPointUrl_Approval = "";
        if (expand_field_name != undefined) {
            endPointUrl_Approval = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + obj.listname + "')/items?$select=Modified," + field_name_html + "&$expand=" + expand_field_name + "&$orderby=Modified%20desc&$filter=Requester/Id eq '" + currentuserdetails_Approval + "' and Status eq 'Pending with manager'";
            
        }
        else {
            endPointUrl_Approval = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + obj.listname + "')/items?$select=Modified," + field_name_html + "&$orderby=Modified%20desc&$filter=Requester/Id eq '" + currentuserdetails_Approval + "' and Status eq 'Pending with manager'";

        }
        //_spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbyTitle('" + listname + "')/items?$select=Title,Location,Domain/Id,Domain/Title,Designation,Created,Modified&$expand=Domain";

        var headers = { "Accept": "application/json; odata=verbose" };

        jQuery.ajax({

            url: endPointUrl_Approval,

            type: "GET",

            headers: headers,

            success: function (data) {

                var sources = $("#DataTable-templates_Approval").html();

                var templates = Handlebars.compile(sources);

                var outputs = templates(data.d);
               
                $("#DataTable_tbody_Approval").html(outputs);
                $('#DataTable_table_Approval').dataTable({
                    "columnDefs": [{
                        "targets": 'no-sort',
                        "orderable": false,
                    }]
                    //"pageLength": configuration_value
                });
                         
                $('#DataTable_table_Approval')
                          .on('page.dt', function () { setTimeout(function () { Click_Method(); }, 300); })
                          .on('order.dt', function () { setTimeout(function () { Click_Method(); }, 300); })
                          .on('length.dt', function () { setTimeout(function () { Click_Method(); }, 300); })
                          .on('search.dt', function () { setTimeout(function () { Click_Method(); }, 300); });
                Click_Method_Approval();
            },

            error: function (err) {

                alert("Error Occured:" + JSON.stringify(err));

            }

        });

    }
    Handlebars.registerHelper("FormatDate", function (date) {
        var format = keyCollections["Date Format"];
        return moment(date.toString()).format(format);
    });

Handlebars.registerHelper("Removedivtag", function (data) {
        var format = $(data).text();
        return format;
});

function Click_Method_Approval() {
    var obj = JSON.parse(jsonvalues);
    $("#DataTable_tbody_Approval #atagedit").unbind();
    $("#DataTable_tbody_Approval #atagedit").bind('click', function () {
        var target = $(this).data('target');
        window.location.href = _spPageContextInfo.webAbsoluteUrl + "" + obj.ViewRequesturl + "?Ticket_ID=" + target;

    });
    $("#DataTable_tbody_Approval #atagdelete").unbind();
}

    function inits() {
        var ctx = new SP.ClientContext();
        var pageFile = ctx.get_web().getFileByServerRelativeUrl(_spPageContextInfo.serverRequestPath);
        var webPartManager = pageFile.getLimitedWebPartManager(SP.WebParts.PersonalizationScope.shared);
        var webPartDefs = webPartManager.get_webParts();
        ctx.load(webPartDefs, 'Include(WebPart)');
        ctx.executeQueryAsync(
          function () {
              for (var i = 0; i < webPartDefs.get_count() ; i++) {
                  var webPartDef = webPartDefs.getItemAtIndex(i);
                  var webPart = webPartDef.get_webPart();
                  Webpart_Title_Approval = webPart.get_title();
                  console.log(webPart.get_title());
              }
          },
          function (sender, args) {
              console.log(args.get_message());
          });
    }
});