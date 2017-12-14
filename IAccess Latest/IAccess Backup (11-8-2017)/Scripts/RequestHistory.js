$(function () {

    var itemId = getParameterByName("Ticket_ID");

    // keys and configurations
    var configStoreListName = "Config Store";
    var configStoreCategory = "IAccess";
    var keyCollection = {
        "WorkflowTaskListName": "", // default value
        "PastClearanceNotFoundMsg": "", // default value
        "InvalidParameterFoundMessage": "",// default value
        "Date Format":""
    };

    var commentContainer = $('#commentsContainer');

    var keys = Object.keys(keyCollection);
    var query = new CamlBuilder()
        .Where().TextField("Key").In(keys)
        .And().TextField("Category").EqualTo(configStoreCategory).ToString();
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', start());

    function start() {
        var clientContext = new SP.ClientContext(_spPageContextInfo.webAbsoluteUrl);
        var oList = clientContext.get_web().get_lists().getByTitle(configStoreListName);
        var camlQuery = new SP.CamlQuery();
        camlQuery.set_viewXml('<View><Query>' + query + '</Query></View>');
        this.collPCListItem = oList.getItems(camlQuery);
        clientContext.load(this.collPCListItem);
        clientContext.executeQueryAsync(Function.createDelegate(this, onQuerySucceeded), Function.createDelegate(this, onQueryFailed));
    }

    function onQuerySucceeded(sender, args) {
        var listItemEnumerator = this.collPCListItem.getEnumerator();
        while (listItemEnumerator.moveNext()) {
            var oListItem = listItemEnumerator.get_current();
            if (!keyCollection[oListItem.get_item('Key')]) {
                keyCollection[oListItem.get_item('Key')] = oListItem.get_item('Value');
            }
        }

        if (itemId == undefined || itemId == null) {
            $('#staticInfoContainer').find('strong').html(keyCollection["InvalidParameterFoundMessage"]);
            $('#staticInfoContainer').removeClass('hidden');
            $('#pastClearanceContainer').find('.form-group').hide();
            
        } else {
            // load past clearances
            loadPastClearance();
        }
    }

    function onQueryFailed(sender, args) {
        //$.showError(args.get_message() + '\n' + args.get_stackTrace());
    }

    function loadPastClearance() {

        var clientContext = new SP.ClientContext(_spPageContextInfo.webAbsoluteUrl);
        var oList = clientContext.get_web().get_lists().getByTitle(keyCollection["WorkflowTaskListName"]);
        var camlQuery = new SP.CamlQuery();

        camlQuery.set_viewXml("<View><Query>" +
                                "<Where>" +
                                        "<And>" +
                                        	"<Eq>" +
                                                "<FieldRef Name='TaskOutcome' />" +
                                                "<Value Type='OutcomeChoice'>Approved</Value>" +
                                         	"</Eq>" +
                                            "<Contains>" +
							        			"<FieldRef Name='RelatedItems' />" +
									    	    	"<Value Type='RelatedItems'>\"ItemId\":" + itemId + ",</Value>" +
      										"</Contains>" +
                                        "</And>" +
                                 "</Where></Query></View>");


        this.collPCListItemCollection = oList.getItems(camlQuery);
        clientContext.load(this.collPCListItemCollection);
        clientContext.executeQueryAsync(Function.createDelegate(this, onCollectionQuerySucceeded), Function.createDelegate(this, onQueryFailed));


        
    }

    var model = { "items": [] };

    function onCollectionQuerySucceeded(sender, args) {

        var clientContext = new SP.ClientContext(_spPageContextInfo.webAbsoluteUrl);
        var listItemEnumerator = this.collPCListItemCollection.getEnumerator();

        var index = 1;

        while (listItemEnumerator.moveNext()) {
            var oListItem = listItemEnumerator.get_current();
            isRecordFound = true;

            var assignedTo = oListItem.get_item('AssignedTo').get_lookupValue();
            var modifiedOn = oListItem.get_item('Modified');
            var outCome = oListItem.get_item('TaskOutcome');
            //var comments = oListItem.get_item('Comments');

            var newItem = {
                "Index": index++,
                "CommentedBy": assignedTo,
                "CommentedOn": modifiedOn,
                "ActionTaken": outCome
                //"Comment": comments
            };

            model.items.push(newItem);

            model.items[model.items.length - 1].user = clientContext.get_web().get_siteUsers().getById(oListItem.get_item('AssignedTo').get_lookupId());

            clientContext.load(model.items[model.items.length - 1].user);

        }

        clientContext.executeQueryAsync(Function.createDelegate(this, onGetUserSucceeded), Function.createDelegate(this, onUserQueryFailed));
           

    }
    Handlebars.registerHelper("FormatDate", function (date) {
        var format = keyCollection["Date Format"];
        return moment(date.toString()).format(format);
    });

    Handlebars.registerHelper("MainPeoplePicker", function (User) {
        var User_count = User.split(",");
        var format_User = "";
        if (User_count.length > 0) {
            for (var g = 0 ;g<User_count.length; g++) {
                if (User_count.length == g + 1) {
                    format_User += User_count[g].split('(')[0];
                }
                else {
                    format_User += User_count[g].split('(')[0] + ",";
                }
            }
        }
        return format_User;
    });

    function onUserQueryFailed(sender, args) {

        var template = Handlebars.compile($('#pastclearance-template').html());
        
        if (model.items.length > 0) {
            commentContainer.html(template(model));
        } else {
            $('#staticInfoContainer').addClass('hidden');
            commentContainer.html(keyCollection["PastClearanceNotFoundMsg"]);
            commentContainer.show();
        }

       
        
    }


    function onGetUserSucceeded(sender, args) {

        var template = Handlebars.compile($('#pastclearance-template').html());
        var isRecordFound = false;

        for (var index = 0; index < model.items.length; index++) {
            model.items[index].CommentedBy += "(" + model.items[index].user.get_loginName().split('|')[1] + ")";
            isRecordFound = true;
        }

        if (isRecordFound) {
            commentContainer.html(template(model));
        } else {
            $('#staticInfoContainer').addClass('hidden');
            commentContainer.html(keyCollection["PastClearanceNotFoundMsg"]);
            commentContainer.show();
        }

      
    }

    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        url = url.toLowerCase();
        name = name.toLowerCase();
        name = name.replace(/[\[\]]/g, "\\$&");

        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

});