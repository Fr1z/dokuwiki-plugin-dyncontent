/**
 * The Link Wizard v2
 *
 * @author Andreas Gohr <gohr@cosmocode.de>
 * @author Pierre Spring <pierre.spring@caillou.ch>
 * 
 * This is like standard link wizard but it put '>' for close tag instead '|'
 *
 */
 
 function addBtnActionLinkwizv2($btn, props, edid) {
    dw_linkwiz_v2.init(jQuery('#'+edid));
    jQuery($btn).click(function(e){
        dw_linkwiz_v2.val = props;
        dw_linkwiz_v2.toggle();
        e.preventDefault();
        return '';
    });
    return 'link__wiz';
}

var dw_linkwiz_v2 = {
    $wiz: null,
    $entry: null,
    result: null,
    timer: null,
    textArea: null,
    selected: null,
    selection: null,

    /**
     * Initialize the dw_linkwiz_v2ard by creating the needed HTML
     * and attaching the eventhandlers
     */
    init: function($editor){
        // position relative to the text area
        var pos = $editor.position();

        // create HTML Structure
        if(dw_linkwiz_v2.$wiz)
            return;
        dw_linkwiz_v2.$wiz = jQuery(document.createElement('div'))
               .dialog({
                   autoOpen: false,
                   draggable: true,
                   title: "Select page",
                   resizable: false
               })
               .html(
                    '<div>'+LANG.linkto+' <input type="text" class="edit" id="link__wiz_entryv2" autocomplete="off" /></div>'+
                    '<div id="link__wiz_resultv2"></div>'
                    )
               .parent()
               .attr('id','link__wizv2')
               .css({
                    'position':    'absolute',
                    'top':         (pos.top+20)+'px',
                    'left':        (pos.left+80)+'px'
                   })
               .hide()
               .appendTo('.dokuwiki:first');

        dw_linkwiz_v2.textArea = $editor[0];
        dw_linkwiz_v2.result = jQuery('#link__wiz_resultv2')[0];

        // scrollview correction on arrow up/down gets easier
        jQuery(dw_linkwiz_v2.result).css('position', 'relative');

        dw_linkwiz_v2.$entry = jQuery('#link__wiz_entryv2');
        if(JSINFO.namespace){
            dw_linkwiz_v2.$entry.val(JSINFO.namespace+':');
        }

        // attach event handlers
        jQuery('#link__wiz .ui-dialog-titlebar-close').click(dw_linkwiz_v2.hide);
        dw_linkwiz_v2.$entry.keyup(dw_linkwiz_v2.onEntry);
        jQuery(dw_linkwiz_v2.result).on('click', 'a', dw_linkwiz_v2.onResultClick);
    },

    /**
     * handle all keyup events in the entry field
     */
    onEntry: function(e){
        if(e.keyCode == 37 || e.keyCode == 39){ //left/right
            return true; //ignore
        }
        if(e.keyCode == 27){ //Escape
            dw_linkwiz_v2.hide();
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        if(e.keyCode == 38){ //Up
            dw_linkwiz_v2.select(dw_linkwiz_v2.selected -1);
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        if(e.keyCode == 40){ //Down
            dw_linkwiz_v2.select(dw_linkwiz_v2.selected +1);
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        if(e.keyCode == 13){ //Enter
            if(dw_linkwiz_v2.selected > -1){
                var $obj = dw_linkwiz_v2.$getResult(dw_linkwiz_v2.selected);
                if($obj.length > 0){
                    dw_linkwiz_v2.resultClick($obj.find('a')[0]);
                }
            }else if(dw_linkwiz_v2.$entry.val()){
                dw_linkwiz_v2.insertLink(dw_linkwiz_v2.$entry.val());
            }

            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        dw_linkwiz_v2.autocomplete();
    },

    /**
     * Get one of the results by index
     *
     * @param   num int result div to return
     * @returns DOMObject or null
     */
    getResult: function(num){
        DEPRECATED('use dw_linkwiz_v2.$getResult()[0] instead');
        return dw_linkwiz_v2.$getResult()[0] || null;
    },

    /**
     * Get one of the results by index
     *
     * @param   num int result div to return
     * @returns jQuery object
     */
    $getResult: function(num) {
        return jQuery(dw_linkwiz_v2.result).find('div').eq(num);
    },

    /**
     * Select the given result
     */
    select: function(num){
        if(num < 0){
            dw_linkwiz_v2.deselect();
            return;
        }

        var $obj = dw_linkwiz_v2.$getResult(num);
        if ($obj.length === 0) {
            return;
        }

        dw_linkwiz_v2.deselect();
        $obj.addClass('selected');

        // make sure the item is viewable in the scroll view

        //getting child position within the parent
        var childPos = $obj.position().top;
        //getting difference between the childs top and parents viewable area
        var yDiff = childPos + $obj.outerHeight() - jQuery(dw_linkwiz_v2.result).innerHeight();

        if (childPos < 0) {
            //if childPos is above viewable area (that's why it goes negative)
            jQuery(dw_linkwiz_v2.result)[0].scrollTop += childPos;
        } else if(yDiff > 0) {
            // if difference between childs top and parents viewable area is
            // greater than the height of a childDiv
            jQuery(dw_linkwiz_v2.result)[0].scrollTop += yDiff;
        }

        dw_linkwiz_v2.selected = num;
    },

    /**
     * deselect a result if any is selected
     */
    deselect: function(){
        if(dw_linkwiz_v2.selected > -1){
            dw_linkwiz_v2.$getResult(dw_linkwiz_v2.selected).removeClass('selected');
        }
        dw_linkwiz_v2.selected = -1;
    },

    /**
     * Handle clicks in the result set an dispatch them to
     * resultClick()
     */
    onResultClick: function(e){
        if(!jQuery(this).is('a')) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        dw_linkwiz_v2.resultClick(this);
        return false;
    },

    /**
     * Handles the "click" on a given result anchor
     */
    resultClick: function(a){
        dw_linkwiz_v2.$entry.val(a.title);
        if(a.title == '' || a.title.substr(a.title.length-1) == ':'){
            dw_linkwiz_v2.autocomplete_exec();
        }else{
            if (jQuery(a.nextSibling).is('span')) {
                dw_linkwiz_v2.insertLink(a.nextSibling.innerHTML);
            }else{
                dw_linkwiz_v2.insertLink('');
            }
        }
    },

    /**
     * Insert the id currently in the entry box to the textarea,
     * replacing the current selection or at the cursor position.
     * When no selection is available the given title will be used
     * as link title instead
     */
    insertLink: function(title){
        var link = dw_linkwiz_v2.$entry.val(),
            sel, stxt;
        if(!link) {
            return;
        }

        sel = DWgetSelection(dw_linkwiz_v2.textArea);
        if(sel.start == 0 && sel.end == 0) {
            sel = dw_linkwiz_v2.selection;
        }

        stxt = sel.getText();

        // don't include trailing space in selection
        if(stxt.charAt(stxt.length - 1) == ' '){
            sel.end--;
            stxt = sel.getText();
        }

        if(!stxt && !DOKU_UHC) {
            stxt=title;
        }

        // prepend colon inside namespaces for non namespace pages
        if(dw_linkwiz_v2.textArea.form.id.value.indexOf(':') != -1 &&
           link.indexOf(':') == -1){
           link = ':' + link;
        }

        var so = link.length;
        var eo = 0;
        if(dw_linkwiz_v2.val){
            if(dw_linkwiz_v2.val.open) {
                so += dw_linkwiz_v2.val.open.length;
                link = dw_linkwiz_v2.val.open+link;
            }
            link += '>'; //close TAG
            so += 1;
            if(stxt) {
                link += stxt;
            }
            if(dw_linkwiz_v2.val.close) {
                link += dw_linkwiz_v2.val.close;
                eo = dw_linkwiz_v2.val.close.length;
            }
        }

        pasteText(sel,link,{startofs: so, endofs: eo});
        dw_linkwiz_v2.hide();

        // reset the entry to the parent namespace
        var externallinkpattern = new RegExp('^((f|ht)tps?:)?//', 'i'),
            entry_value;
        if (externallinkpattern.test(dw_linkwiz_v2.$entry.val())) {
            if (JSINFO.namespace) {
                entry_value = JSINFO.namespace + ':';
            } else {
                entry_value = ''; //reset whole external links
            }
        } else {
            entry_value = dw_linkwiz_v2.$entry.val().replace(/[^:]*$/, '')
        }
        dw_linkwiz_v2.$entry.val(entry_value);
    },

    /**
     * Start the page/namespace lookup timer
     *
     * Calls autocomplete_exec when the timer runs out
     */
    autocomplete: function(){
        if(dw_linkwiz_v2.timer !== null){
            window.clearTimeout(dw_linkwiz_v2.timer);
            dw_linkwiz_v2.timer = null;
        }

        dw_linkwiz_v2.timer = window.setTimeout(dw_linkwiz_v2.autocomplete_exec,350);
    },

    /**
     * Executes the AJAX call for the page/namespace lookup
     */
    autocomplete_exec: function(){
        var $res = jQuery(dw_linkwiz_v2.result);
        dw_linkwiz_v2.deselect();
        $res.html('<img src="'+DOKU_BASE+'lib/images/throbber.gif" alt="" width="16" height="16" />')
            .load(
            DOKU_BASE + 'lib/exe/ajax.php',
            {
                call: 'linkwiz',
                q: dw_linkwiz_v2.$entry.val()
            }
        );
    },

    /**
     * Show the link wizard
     */
    show: function(){
        dw_linkwiz_v2.selection  = DWgetSelection(dw_linkwiz_v2.textArea);
        dw_linkwiz_v2.$wiz.show();
        dw_linkwiz_v2.$entry.focus();
        dw_linkwiz_v2.autocomplete();

        // Move the cursor to the end of the input
        var temp = dw_linkwiz_v2.$entry.val();
        dw_linkwiz_v2.$entry.val('');
        dw_linkwiz_v2.$entry.val(temp);
		
    },

    /**
     * Hide the link wizard
     */
    hide: function(){
        dw_linkwiz_v2.$wiz.hide();
        dw_linkwiz_v2.textArea.focus();
    },

    /**
     * Toggle the link wizard
     */
    toggle: function(){
        if(dw_linkwiz_v2.$wiz.css('display') == 'none'){
            dw_linkwiz_v2.show();
        }else{
            dw_linkwiz_v2.hide();
        }
    }
};
