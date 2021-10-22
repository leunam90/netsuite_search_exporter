try {
    if (!isFirefox) {
        var isFirefox = false;
    }
    //chrome.storage.local.clear();
    //console.log("CHROME EXTENSION - NetSuite: Search Export-Import");
    if (!window._SEARCHEXPADDED) {
        (function() {
            //console.log('running the sript now');
            if (window.jQuery) {
                var UPDATE_INTERVAL = 2 * 60 * 60 * 1000; // Update after 2 hour
                //var UPDATE_INTERVAL = 60 * 1000; // Update after 1 min
                //console.log('UPDATE_INTERVAL',UPDATE_INTERVAL);
                // Retrieve file from storage
                chrome.storage.local.get({
                    lastUpdated: 0,
                    code1: '',
                    code2: '',
                    code3: ''
                }, function(items) {
                    //console.log('FUNCTION(ITEMS)',items);
                    //console.log('now:',Date.now());
                    //console.log('last updated:',items.lastUpdated);
                    //console.log('dif:',Date.now() - items.lastUpdated);

                    //					if (Date.now() - items.lastUpdated > UPDATE_INTERVAL) {
                    // Get updated file, and if found, save it.
                    //console.log('get updated file');
                    // "NLUtil.jsp","NLUtil.js","NLAPI.jsp__NS_VER2016.1.0.js"
                    get('/javascript/NLUtil.jsp', function(code1) {
                        if (!code1) return;
                        //							chrome.storage.local.set({lastUpdated: Date.now(), code1: code1});
                        //							console.log('NLUtil.jsp file saved to local storage');
                        try { window.eval(code1); } catch (e) { console.error(e); }
                        get('/javascript/NLUtil.js', function(code2) {
                            if (!code2) return;
                            //								chrome.storage.local.set({lastUpdated: Date.now(), code2: code2});
                            //								console.log('NLUtil.js file saved to local storage');
                            try { window.eval(code2); } catch (e) { console.error(e); }
                            get('/javascript/NLAPI.jsp', function(code3) {
                                if (!code3) return;
                                //									chrome.storage.local.set({lastUpdated: Date.now(), code3: code3});
                                //									console.log('NLAPI.jsp file saved to local storage');
                                try { window.eval(code3); } catch (e) {
                                    console.log('error3');
                                    console.error(e);
                                }
                                execute();
                            });
                        });
                    });
                    //					} else {
                    //						// load from local storage
                    //						//console.log('Loading code from local storage');
                    //						try { window.eval(items.code1); } catch (e) { 
                    //							get('/javascript/NLUtil.jsp', function(code1){if (!code1) console.error(e);});
                    //						}
                    //						try { window.eval(items.code2); } catch (e) { 
                    //							get('/javascript/NLUtil.js', function(code2){if (!code2) console.error(e);});
                    //						}
                    //						try { window.eval(items.code3); } catch (e) { 
                    //							get('/javascript/NLAPI.jsp', function(code3){if (!code3) console.error(e);});
                    //						}
                    //						execute();
                    //					}
                });

                // Typically run within a few milliseconds
                function execute(code) {
                    // Run the rest of the code.
                    try {
                        // this section of code was taken directly out of the nlapiLoadSearch function.
                        // the nsapiCheckUsage() function is causing an error and not allowing the search to load.
                        //						console.log('load the page search');
                        var id = nlapiGetRecordId();
                        //						console.log(id);

                        if (!id) {
                            jQuery(".page-title-menu>.ns-menu").append('<li class="ns-menuitem ns-header">' +
                                '<a id="eportsearchtoscript" href="#">Search Export - Save Required</a></li>');
                            jQuery('#eportsearchtoscript').click(function() {
                                jQuery('body').append('<div id="searchcode">' +
                                    '<p>This tool requires the search to be saved in order to export.<br><br>Please save the search before continuing.</p><br>' +
                                    "<p>You can always delete the search if you don't need it after exporting.</p><br>" +
                                    '</div>');
                                jQuery('#searchcode').dialog({
                                    width: 500,
                                    height: 350,
                                    closeText: "",
                                    position: { my: "right top", at: "right bottom", of: jQuery(this) }
                                });
                            });
                            return;
                        }
                        const queryString = window.location.search;
                        const urlParams = new URLSearchParams(queryString);
                        const product = urlParams.get('search_type');
                        var type = product;
                        nsapiCheckArgs([id], ['id'], 'nlapiLoadSearch');
                        //					    if (type)
                        //					    {
                        //					        nsapiCheckSearchType( type, 'nlapiLoadSearch' );
                        //					    }
                        //nsapiCheckUsage( );
                        id = id != null && !isNaN(parseInt(id)) ? parseInt(id) : id != null ? id : null;
                        var search = new nlobjSearch(type, id, null, null);
                        search._load();

                        // see above note why this didn't work anymore.
                        //						var search = nlapiLoadSearch(null,nlapiGetRecordId());
                    } catch (err) {
                        console.log(err);
                        // if we have an error loading this search it might not be supported
                        jQuery(".page-title-menu>.ns-menu").append('<li class="ns-menuitem ns-header">' +
                            '<a id="eportsearchtoscript" href="#">Export Search read me</a></li>');
                        jQuery('#eportsearchtoscript').click(function() {
                            jQuery('body').append('<div id="searchcode">' +
                                '<p>This search type needs to be specified.<br><br>Please add the type in the url using the parameter search_type, for example:</p><br>' +
                                '&search_type=inventorybalance' +
                                '</div>');
                            jQuery('#searchcode').dialog({
                                width: 500,
                                height: 350,
                                closeText: "",
                                position: { my: "right top", at: "right bottom", of: jQuery(this) }
                            });
                        });
                        return;
                    };

                    function buildUI(hideLabels) {
                        hideLabels = hideLabels === true ? hideLabels : false;

                        jQuery('#searchcode_container').remove();

                        //console.log(search);
                        var searchtype = search.getSearchType();
                        var searchcode1 = 'var ' + searchtype + 'Search = nlapiSearchRecord("' + searchtype + '",null,\n';
                        var sf = search.getFilterExpression();
                        var filterExpr = "[\n";
                        for (var f = 0; f < sf.length; f++) {
                            filterExpr += "   " + JSON.stringify(sf[f]);
                            filterExpr += ", \n";
                        }
                        //JSON.stringify(search.getFilterExpression());
                        filterExpr = filterExpr.substring(0, filterExpr.lastIndexOf(','));
                        if (filterExpr.length == 0) filterExpr = "[";
                        searchcode1 += filterExpr + "\n], \n";
                        //var colObjAry = JSON.parse(JSON.stringify(search.getColumns()));
                        var colObjAry = search.getColumns();
                        var colstr = "[\n";
                        var colstr2 = "[\n";
                        for (var co = 0; co < colObjAry.length; co++) {
                            var c = colObjAry[co];
                            if (c.formula) c.formula = c.formula.replace(/\"/g, '&#92;"');
                            // SS1.0
                            colstr += '   new nlobjSearchColumn("' + c.name + '",';
                            colstr += (c.join ? '"' + c.join + '",' : "null,");
                            colstr += (c.summary ? '"' + c.summary + '"' : "null");
                            if (c.formula) colstr += ').setFormula("' + c.formula + '")';
                            if (c.sortdir) colstr += (c.formula ? '' : ')') + '.setSort(' + (c.sortdir == 'DESC') + ')';
                            //if(c.label) colstr += (c.formula || c.sortdir ? '':')')+'.setLabel("'+c.label+'")';
                            //if(!c.formula && !c.sortdir && !c.label)colstr+=')';
                            if (!c.formula && !c.sortdir) colstr += ')';
                            colstr = colstr.replace(',null,null)', ')');
                            if (co < colObjAry.length - 1) colstr += ", \n";

                            // SS2.0
                            //if(!c.formula && !c.join && !c.summary && !c.sortdir && !c.label){
                            if (!c.formula && !c.join && !c.summary && !c.sortdir) {
                                if (c.label && !hideLabels) {
                                    // just the column name and label
                                    colstr2 += '      search.createColumn({name: "' +
                                        c.name + '", label: "' + c.label + '"}),\n';
                                } else {
                                    // just the name
                                    colstr2 += '      "' + c.name + '",\n';
                                }
                                continue;
                            }
                            // make an object out of it
                            colstr2 += '      search.createColumn({\n' +
                                '         name: "' + c.name + '",\n';
                            colstr2 += (c.join ? '         join: "' + c.join + '",\n' : "");
                            colstr2 += (c.summary ? '         summary: "' + c.summary + '",\n' : "");
                            colstr2 += (c.formula ? '         formula: "' + c.formula + '",\n' : "");
                            colstr2 += (c.sortdir ? '         sort: search.Sort.' + (c.sortdir) + ',\n' : "");
                            if (!hideLabels) colstr2 += (c.label ? '         label: "' + c.label + '",\n' : "");
                            colstr2 = colstr2.substring(0, colstr2.lastIndexOf(','));
                            colstr2 += '\n      }),\n';
                        }
                        colstr2 = colstr2.substring(0, colstr2.lastIndexOf(',')) + "\n   ]\n";
                        colstr += "\n]\n";
                        searchcode1 += colstr + ");";
                        //console.log(searchcode1);

                        filterExpr = filterExpr.replace(/   /g, "      ");
                        if (filterExpr.length == 0) filterExpr = "[";
                        filterExpr = filterExpr += "\n   ],";

                        var searchcode2 = 'let ' + searchtype + 'SearchObj = search.create({\n   type: "' + searchtype + '",\n' +
                            '   filters:\n   ' + filterExpr + "\n" +
                            '   columns:\n   ' + colstr2 + '});\n' +
                            'let searchResultCount = ' + searchtype + 'SearchObj.runPaged().count;\n' +
                            'log.debug("' + searchtype + 'SearchObj result count",searchResultCount);\n' +
                            searchtype + 'SearchObj.run().each((currentRow) => {\n   // .run().each has a limit of 4,000 results\n' +
                            '   return true;\n});';

                        jQuery('body').append('<div id="searchcode_container">' +
                            '<style>.h2{display: inline; margin-right: 25px;} .prettyprint{border:1px solid; padding:5px; overflow-x: auto;}</style>' +
                            '<h2 class="h2">SS2.X</h2><button id="ss2copy">Copy</button> <input id="ss2labels" type="checkbox" ' + (hideLabels ? 'checked' : '') + '>' +
                            '<label for="ss2labels"> No Labels</label><span><pre id="ss2" class="prettyprint"></pre></span>' +
                            '</div>');
                        // use jQuery text here to encode the html special characters
                        jQuery('#ss1').text(searchcode1.replace(/&#92;/g, '\\'));
                        jQuery('#ss2').text(searchcode2.replace(/&#92;/g, '\\'));
                        jQuery('#ss1copy').click(function() { copyCode('#ss1'); });
                        jQuery('#ss2copy').click(function() { copyCode('#ss2'); });
                        jQuery('#ss2labels').change(function() {
                            //console.log('hide labels');
                            buildUI(true);
                        });

                        jQuery('#searchcode_container').dialog({
                            title: "Saved Search Code",
                            width: 615,
                            height: 400,
                            closeText: "",
                            position: { my: "right top", at: "right bottom", of: jQuery('#eportsearchtoscript') }
                        });
                        //chrome.storage.local.getBytesInUse(null, function(bytesInUse){//console.log('used storage',bytesInUse);});
                    }

                    //console.log('running rest of code');
                    jQuery(".page-title-menu>.ns-menu").append('<li class="ns-menuitem ns-header">' +
                        '<a id="eportsearchtoscript" href="#">Export as Script</a></li>');
                    jQuery('#eportsearchtoscript').click(function(event) {
                        event.preventDefault();
                        //console.log('build ui with labels');
                        buildUI(true);
                        copyCode('#ss2');
                    });
                }


                function get(url, callback) {
                    //console.log('getting',url);
                    var x = new XMLHttpRequest();
                    x.onload = x.onerror = function() { callback(x.responseText); };
                    x.open('GET', url);
                    x.send();
                }

                function copyCode(fieldId) {
                    var searchStr = jQuery(fieldId).text();
                    // use a textarea for multiline support
                    jQuery('body').append('<textarea id="copyfieldid" />');
                    jQuery('#copyfieldid').text(searchStr);
                    // target element
                    var inp = document.querySelector('#copyfieldid');
                    // is element selectable?
                    if (inp && inp.select) {
                        // select text
                        inp.select();
                        try {
                            // copy text
                            document.execCommand('copy');
                            // copied animation
                            jQuery(fieldId).parent().prepend('<div id="copiednotice" style="text-align:center; color: #fff;background-color: #22a;border-radius: 3px;">Code Copied</div>');
                            jQuery('#copiednotice').animate({
                                opacity: 0.25
                            }, 2000, function() {
                                this.remove();
                            });
                        } catch (err) {
                            alert('Please use Ctrl/Cmd+C to copy');
                        }

                    }
                    jQuery('#copyfieldid').remove();
                }

            }
            window._SEARCHEXPADDED = true;
        }());
    }
} catch (e) {
    //console.log('error')
    //console.log(e);
}