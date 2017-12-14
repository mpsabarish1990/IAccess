$(function () {
    // keys and configurations
    var configStoreListName = "Config Store";
    var configStoreCategory = "DataTable";
    var currentUser = null;
    var clientContext;
    var collListItem;
    var jsonvalue = "";
    var Webpart_Title = "";
    var expand_internal_entry = [];
    var final_internal_name = "";
    var expand_internal_name = "";
    // $.showLoader();
    var internal_name = [];
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', init);
    var keyCollection = {
        Webpart_Title: "",
        "Date Format": ""
    };

    var keys = Object.keys(keyCollection);
    var query = new CamlBuilder()
        .Where().TextField("Key").In(keys)
        .And().TextField("Category").EqualTo(configStoreCategory);


    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', start);

    function start() {
        clientContext = new SP.ClientContext(_spPageContextInfo.webAbsoluteUrl);
        web = clientContext.get_web();
        var oList = web.get_lists().getByTitle(configStoreListName);
        var camlQuery = new SP.CamlQuery();
        camlQuery.set_viewXml('<View><Query>' + query + '</Query></View>');
        collListItem = oList.getItems(camlQuery);
        currentUser = web.get_currentUser();
        clientContext.load(currentUser);
        clientContext.load(collListItem);
        clientContext.executeQueryAsync(Function.createDelegate(this, onQuerySucceeded), Function.createDelegate(this, onQueryFailed));
    }

    function onQuerySucceeded(sender, args) {
        var listItemEnumerator = collListItem.getEnumerator();
        while (listItemEnumerator.moveNext()) {
            var oListItem = listItemEnumerator.get_current();
            if (!keyCollection[oListItem.get_item('Key')]) {
                keyCollection[oListItem.get_item('Key')] = oListItem.get_item('Value');

            }
        }

        jsonvalue = keyCollection[Webpart_Title];
        bindtheadhtml_Template();
        bindtbodyhtml_Template();
        load_DataTable_Values();
        // internalname();

    }

    function onQueryFailed(sender, args) {
        //$.hideLoader();
        alert(args.get_message() + '\n' + args.get_stackTrace());
    }
    function bindtheadhtml_Template() {
        var tableheader_html = "";
        var obj = JSON.parse(jsonvalue);
        listDisplayName = obj.listname;
        tableheader_html += '<tr>';
        for (var i = 0 ; i < obj.fields.length; i++) {
            if (obj.fields[i].unsort != undefined) {
                tableheader_html += '<th class="' + obj.fields[i].unsort + '">' + obj.fields[i].displayname + '</th>';
            }
            else {
                if (obj.fields[i].displayname != undefined) {
                    tableheader_html += '<th>' + obj.fields[i].displayname + '</th>';
                }
            }


        }
        if (obj.button != undefined) {
            if (obj.button.length > 0) {
                for (var j = 0 ; j < obj.button.length; j++) {
                    if (obj.button[j].unsort != undefined) {
                        tableheader_html += '<th class="' + obj.button[j].unsort + '">' + obj.button[j].displayname + '</th>';
                    }
                }
            }
        }
        tableheader_html += '</tr>';
        $("#DataTable_thead").html(tableheader_html);
    }

    function bindtbodyhtml_Template() {

        var html_template = "";
        html_template += '<script id="DataTable-template" type="text/x-handlebars-template">';
        html_template += '{{#results}}';
        html_template += '<tr>';
        var obj = JSON.parse(jsonvalue);
        for (var i = 0 ; i < obj.fields.length; i++) {
            if (obj.fields[i].fieldtemplate != undefined) {
                html_template += obj.fields[i].fieldtemplate;
            }
            else {
                if (obj.fields[i].hiddencolumn == undefined) {
                    html_template += '<td>{{' + obj.fields[i].name + '}}</td> ';
                }
            }
        }
        if (obj.button != undefined) {
            if (obj.button.length > 0) {
                for (var j = 0 ; j < obj.button.length; j++) {
                    html_template += obj.button[j].fieldtemplate
                }
            }
        }
        html_template += '</tr>';
        html_template += '{{/results}}';
        html_template += ' </script>';
        $("#DataTable_tbody").html(html_template);
    }

    function load_DataTable_Values() {
        var field_name_html = "";
        var field_name = "";
        var expand_field_name = "";
        var expand_name = [];
        var listname_json = "";
        var obj = JSON.parse(jsonvalue);

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
        var endPointUrl="";
        if (expand_field_name != undefined) {
            endPointUrl = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + obj.listname + "')/items?$select=Modified," + field_name_html + "&$expand=" + expand_field_name+"&$orderby=Modified%20desc";
        }
        else {
            endPointUrl = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + obj.listname + "')/items?$select=Modified," + field_name_html + "&$orderby=Modified%20desc";

        }
        //_spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbyTitle('" + listname + "')/items?$select=Title,Location,Domain/Id,Domain/Title,Designation,Created,Modified&$expand=Domain";

        var headers = { "Accept": "application/json; odata=verbose" };

        jQuery.ajax({

            url: endPointUrl,

            type: "GET",

            headers: headers,

            success: function (data) {

                var source = $("#DataTable-template").html();

                var template = Handlebars.compile(source);

                var output = template(data.d);

                $("#DataTable_tbody").html(output);
                $('#DataTable_table').dataTable({
                    "columnDefs": [{
                        "targets": 'no-sort',
                        "orderable": false,
                    }]
                    //"pageLength": configuration_value
                });

                 $('#DataTable_table')
                           .on('page.dt', function () { setTimeout(function () { Click_Method(); }, 300); })
                           .on('order.dt', function () { setTimeout(function () { Click_Method(); }, 300); })
                           .on('length.dt', function () { setTimeout(function () { Click_Method(); }, 300); })
                           .on('search.dt', function () { setTimeout(function () { Click_Method(); }, 300); });
                Click_Method();
                
            },

            error: function (err) {

                alert("Error Occured:" + JSON.stringify(err));

            }

        });

    }
    Handlebars.registerHelper("FormatDate", function (date) {
        var format = keyCollection["Date Format"];
        return moment(date.toString()).format(format);
    });

Handlebars.registerHelper("Removedivtag", function (data) {
        var format = $(data).text();
        return format;
    });

 function Click_Method() {
        var obj = JSON.parse(jsonvalue);
        $("#DataTable_tbody #atagedit").unbind();
        $("#DataTable_tbody #atagedit").bind('click', function () {
            var target = $(this).data('target');
            window.location.href = _spPageContextInfo.webAbsoluteUrl + "" + obj.ViewRequesturl + "?Ticket_ID=" + target;
            
        });
        $("#DataTable_tbody #atagdelete").unbind();
        $("#DataTable_tbody #atagdelete").bind('click', function () {
            var target = $(this).data('target');
            var delete_item_cof = deleteItem();
            if (delete_item_cof) {
                DeleteListItem(target);
                
            }
           
        });
    }

    function deleteItem() {

        if (confirm("Are you sure want to delete this record?")) {
            return true;
        }
        return false;
    }
    /* Delete method ended  */
    //Delete Candidate Item started
    function DeleteListItem(target) {
        var restUrl = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/GetByTitle('" + listDisplayName + "')/items(" + target + ")";
        jQuery.ajax({
            url: restUrl,
            type: "POST",
            headers: {
                Accept: "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "IF-MATCH": "*",
                "X-HTTP-Method": "DELETE"
            },
            success: function (data, status, xhr) {
                location.reload();
            }
        });
    }

    function check_internalname() {
        var obj = JSON.parse(jsonvalue);
        for (var i = 0 ; i < obj.fields.length; i++) {
            for (var j = i; j < internal_name.length ; j++) {
                if (internal_name[j].Displayname == obj.fields[i].name) {
                    //console.log(internal_name[j].Intername);
                    if (obj.fields.length == i + 1) {
                        final_internal_name += internal_name[j].Intername;
                    }
                    else {
                        final_internal_name += internal_name[j].Intername + ",";
                    }
                    if (internal_name[j].expand != "") {
                        expand_internal_entry.push(internal_name[j].expand);
                    }
                }

            }
        }
        if (expand_internal_entry != null) {
            if (expand_internal_entry.length > 0) {
                for (var k = 0; k < expand_internal_entry.length; k++) {
                    if (expand_internal_entry.length == k + 1) {
                        expand_internal_name += expand_internal_entry[k];
                    }
                    else {
                        expand_internal_name += expand_internal_entry[k] + ",";
                    }
                }
            }
        }

        var requesturl = "";
        if (final_internal_name != "" && expand_internal_name == "") {
            requesturl = final_internal_name;
        }
        else if (final_internal_name != "" && expand_internal_name != "") {
            requesturl = final_internal_name + "&$expand=" + expand_internal_name;
        }
        load_DataTable_Values(requesturl);

        console.log(requesturl);


    }

    function internalname() {
        var obj = JSON.parse(jsonvalue);
        var endPointUrl = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + obj.listname + "')/fields";
        var headers = { "Accept": "application/json; odata=verbose" };
        jQuery.ajax({
            url: endPointUrl,
            type: "GET",
            headers: headers,
            success: function (data) {
                for (var int_i = 0; int_i < data.d.results.length ; int_i++) {

                    //User Type
                    if (data.d.results[int_i].TypeAsString == "User") {
                        var user_value = data.d.results[int_i].InternalName + "/Id," + data.d.results[int_i].InternalName + "/Title";
                        internal_name.push({ Intername: user_value, Displayname: data.d.results[int_i].Title, expand: data.d.results[int_i].InternalName, Urlfield: "" });
                    }

                    //Lookup Type
                    if (data.d.results[int_i].TypeAsString == "Lookup") {
                        var lookup_value = data.d.results[int_i].InternalName + "/Id," + data.d.results[int_i].InternalName + "/" + data.d.results[int_i].LookupField;
                        internal_name.push({ Intername: lookup_value, Displayname: data.d.results[int_i].Title, expand: data.d.results[int_i].InternalName, Urlfield: "" });
                    }

                    ////URL Type
                    if (data.d.results[int_i].TypeAsString == "URL") {
                        var url_value = data.d.results[int_i].InternalName + "/Description," + data.d.results[int_i].InternalName + "/Url";
                        internal_name.push({ Intername: url_value, Displayname: data.d.results[int_i].Title, expand: "", Urlfield: data.d.results[int_i].InternalName + "/Url" });
                    }

                    //Other Types
                    if (data.d.results[int_i].TypeAsString == "Text" || data.d.results[int_i].TypeAsString == "Choice"
                         || data.d.results[int_i].TypeAsString == "Number" || data.d.results[int_i].TypeAsString == "Integer"
                         || data.d.results[int_i].TypeAsString == "Note" || data.d.results[int_i].TypeAsString == "Boolean"
                         || data.d.results[int_i].TypeAsString == "DateTime"
                        ) {
                        internal_name.push({ Intername: data.d.results[int_i].InternalName, Displayname: data.d.results[int_i].Title, expand: "", Urlfield: "" });
                    }


                }
              //  bindhtml_Template();
                check_internalname();

            },

            error: function (err) {

                alert("Error Occured:" + JSON.stringify(err));

            }

        });
        console.log(internal_name);

    }
    function bindhtml_Template() {

        var html_template = "";
        html_template += '<script id="DataTable-template" type="text/x-handlebars-template">';
        html_template += '{{#results}}';
        html_template += '<tr>';
        var obj = JSON.parse(jsonvalue);
        for (var i = 0 ; i < obj.fields.length; i++) {
            for (var l = 0; l < internal_name.length; l++) {
                if (internal_name[l].Displayname == obj.fields[i].name) {

                    if (internal_name[l].expand != "") {
                        var expand_entry = internal_name[l].Intername.split(',')[1].split('/')[1];
                        var internal_entry = internal_name[l].Intername.split(',')[0].split('/')[0];
                        html_template += '<td>{{' + internal_entry + '}}{{' + expand_entry + '}}{{' + internal_entry + '}}</td> ';
                    }
                    if (internal_name[l].Urlfield != "") {
                        var split_entry1 = internal_name[l].Urlfield.split('/')
                        html_template += '<td>{{' + split_entry1[0] + '}}{{' + split_entry1[1] + '}}{{' + split_entry1[0] + '}}</td> ';
                    }
                    else if (internal_name[l].Urlfield == "" && internal_name[l].expand == "") {
                        html_template += '<td>{{' + internal_name[l].Intername + '}}</td> ';
                    }

                }
            }
        }
        html_template += '</tr>';
        html_template += '{{/results}}';
        html_template += ' </script>';
        $("#testbody").html(html_template);
    }












    function init() {
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
                  Webpart_Title = webPart.get_title();
                  console.log(webPart.get_title());
              }
          },
          function (sender, args) {
              console.log(args.get_message());
          });
    }
}
);