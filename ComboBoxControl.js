define(function (require)
{
    require("jquery");
    require("jquery-ui");


    function ComboBoxControl(container,options)
    {
        // make sure container is a jQuery object
        var container = $(container);
        var control;
        var self = this;

        self.OriginalElement = container;
        self.InputElement = null;

	    self.FieldName = null;

        var _input;
        var _selectedValue;

        var _cache = {};
        var _userSource;

        if (!(self instanceof ComboBoxControl)) { throw new TypeError("ComboBoxControl must be called using New."); }

        var defaults =
        {
            autocomplete : {
                delay: 200,
                minLength: 2,
                source: [],
	            autoFocus:true
            },
            wrapperCSS: {position: "relative", display: "inline-block","white-space":"nowrap"},
            toggleCSS: {
                position: "relative",
                top: "-1px",
                bottom: 0,
                "margin-left": "-1px",
                /*"font-size":"1em",*/
                "width":"auto",
                "padding": "5px 6px",
                "border": "1px solid gray"
            },
            inputCSS: {
                margin: 0,
                padding: "2px 5px",
                "font-weight" : "normal",
                "background" : "white",
                "color": "black",
                "border": "1px solid gray",
                "border-right": "0",
                "min-width": "300px",
                "height":"17px",
                "position": "relative"
            },
            autocompleteMenuCSS: { "font-size":"1em", "box-shadow": "8px 6px 6px gray","text-align":"left"},
            useCache: true

        };

        var settings = $.extend(true,{},defaults,options);

        /**
         * Initialize Control. Called at end.
         * @constructor
         */
        var Init = function()
        {
            control = CreateControl();
        };


        /**
         * Creates the control
         * @constructor
         */
        var CreateControl = function()
        {
            var control = $("<span>").addClass("custom-combobox").css(settings.wrapperCSS);

	        $.each(container.data,function(key,value){
                self.data(key,value);
		        container.removeAttr("data-" + key);
	        });

	        if (container.data("field-name"))
	        {
		        self.FieldName = container.data("field-name");
		        container.data("field-name",null);
		        container.removeAttr("data-field-name");
	        }

            var autocomplete = CreateAutoComplete();
            var dropdown = CreateDropDownButton();

            control.append(autocomplete,dropdown);

            if (container.is("select") || container.is("input"))
            {
                control.insertAfter(container);
                container.hide();
            }
            else
            {
                container.append(control);
            }

            return control;
        };

        /**
         * Creates the autocomplete box
         * @returns {*|jQuery}
         * @constructor
         */
        var CreateAutoComplete = function()
        {
            _input = $("<input type='text'>")
                    .css(settings.inputCSS)
                    .attr("title", "")
                    .addClass("custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left")
                    .tooltip({tooltipClass: "ui-state-highlight"});

            self.InputElement = _input;

	        if (self.FieldName)
	        {
	        	_input.attr("data-field-name",self.FieldName);
		        _input.data("field-name",self.FieldName);
	        }

            settings.autocomplete.select = Select;


            _userSource = settings.autocomplete.source;
            settings.autocomplete.source = Source;

	        settings.autocomplete.appendTo = (container.is("select") || container.is("input")) ? container.parent() : container;

            _input.autocomplete(settings.autocomplete);
            _input.autocomplete("widget").css(settings.autocompleteMenuCSS);

            _input.data("ComboBox",self);
            container.data("ComboBox",self);

            return _input;
        };

        /**
         * Creates the drop down button
         * @returns {*|jQuery}
         * @constructor
         */
        var CreateDropDownButton = function ()
        {
            var wasOpen = false;
            var dropDownButton = $("<a>")
                .css(settings.toggleCSS)
                .attr("tabIndex", -1)
                .attr("title", "Show All Items")
                .tooltip()
                .button({
                    icons: {
                        primary: "ui-icon-triangle-1-s"
                    },
                    text: false
                })
                .removeClass("ui-corner-all")
                .addClass("custom-combobox-toggle ui-corner-right")
                .mousedown(function () {
                    var input = control.find("input");
                    wasOpen = input.autocomplete("widget").is(":visible");
                })
                .click(function () {
                    var input = control.find("input");
                    input.focus();

                    // Close if already visible
                    if (wasOpen) { return; }

                    // save minLength value
                    var minLength = input.autocomplete( "option", "minLength" );

                    // set minLength to 0 so we can show all
                    input.autocomplete( "option", "minLength", 0 );

                    // Pass empty string as value to search for, displaying all results
                    input.autocomplete("search", "");

                    // set minLength back to previous value
                    input.autocomplete( "option", "minLength", minLength );
                });

            return dropDownButton;
        };

        /**
         * Remove text from the input if not an item in the list. Not currently used.
         * @param event
         * @param ui
         * @constructor
         */
        var RemoveIfInvalid = function (event, ui)
        {

            // Selected an item, nothing to do
            if (ui.item) {
                return;
            }

            // Search for a match (case-insensitive)
            var value = this.input.val(),
                valueLowerCase = value.toLowerCase(),
                valid = false;
            this.element.children("option").each(function () {
                if ($(this).text().toLowerCase() === valueLowerCase) {
                    this.selected = valid = true;
                    return false;
                }
            });

            // Found a match, nothing to do
            if (valid) {
                return;
            }

            // Remove invalid value
            this.input
                .val("")
                .attr("title", value + " didn't match any item")
                .tooltip("open");
            this.element.val("");
            this._delay(function () {
                this.input.tooltip("close").attr("title", "");
            }, 2500);
            this.input.autocomplete("instance").term = "";
        };

        /**
         * Caching function to use if user's source is a function
         * @param request
         * @param response
         * @constructor
         */
        var Source = function (request, response)
        {
            if (settings.useCache && _cache[request.term])
            {
                response(_cache[request.term]);
            }else{
                if (typeof _userSource === "function")
                {
                    _userSource.call(self,request, function (userSourceResponseData) {
                        _cache[request.term] = userSourceResponseData;
                        response(userSourceResponseData)
                    });
                }else if (typeof _userSource === "string"){
                    $.get(_userSource,request,function(getResponse)
                    {
                        if (!getResponse.status) {
                            _cache[request.term] = getResponse;
                            response(getResponse);
                        }
                    });
                }
            }
        };

        /**
         * Triggered when an dropdown item is selected. sets value of original input/select
         * @param event
         * @param ui
         * @returns {boolean}
         * @constructor
         */
        var Select = function( event, ui )
        {
            _input.val( ui.item.label );
            _selectedValue = ui.item.value;
            if ($(container).is("select"))
            {
                // remove existing options from select
                container.find("option").remove();

                // add new option to select
                container.append(String.format("<option value='{0}'>{1}</option>",ui.item.value,ui.item.label))
            }

            // set original element value and trigger change event on original input
            container.val(_selectedValue).change();

            // let others know a select happened
            $(self).trigger("select");

            // resize to fit
            self.Autosize();

            return false;
        };

        /**
         * Set combobox text and value
         * @param displayText
         * @param value
         * @constructor
         */
        this.SetValue = function(displayText,value)
        {
            Select(null,{item:{label:displayText,value:value}});
        };

        /**
         * Remove the control and restore the select (if we started with a select)
         */
        this.Destroy = function()
        {
            control.remove();
            container.show();
        };

        /**
         * Automatically size the input to be wide enough to show entire text
         * @constructor
         */
        this.Autosize = function()
        {
            var span = $("<span></span>").text(_input.val()).css("visibility","hidden");
            span.appendTo("body");
            _input.css("width",span.width() + 40);
            span.remove();
        };

        // do it!
        Init();
    }

    return ComboBoxControl;


});