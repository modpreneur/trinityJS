import _ from 'lodash';
import Dom from '../utils/Dom';
import events from '../utils/closureEvents';
import {EventEmitter} from 'fbemitter';
import Gateway from '../Gateway';


/**
 * Trinity Tab
 */
export default class TrinityTab extends EventEmitter {
    /**
     * Heads of tab component
     * @param [tabHeads] {Array<HTMLElement>}
     */
    constructor(tabHeads){
        tabHeads = tabHeads || document.querySelectorAll('.tab-head');
        if(tabHeads.length < 1){
            throw new Error('No "tabHeads" provided or elements with "tab-head" class not found!');
        }
        super();
        this.heads = tabHeads;
        this.tabs = {};
        this.__activeTabID = null;
        _initialize.call(this);
    }

    /**
     * Set active Tab by provided tabID
     * @param tabID {string}
     * @throws {Error} if tab with provided ID does't exit
     * @public
     */
    setActiveTab(tabID){
        if(!this.tabs.hasOwnProperty(tabID)){
            if(TrinityTab.settings.debug){
                throw new Error('Tab with id: '+ tabID + ' does not exist!');
            }
            return;
        }
        if(tabID === this.__activeTabID){
            return;
        }
        let prevTab = this.__activeTabID;
        this.__activeTabID = tabID;
        this.tabs[prevTab].head.removeAttribute('checked');
        this.tabs[prevTab].head.checked = false;
        this.tabs[tabID].head.setAttribute('checked', 'checked');
        this.tabs[tabID].head.checked = true;

        //Update Hash URL
        __pushHistory(tabID);

        // Emit change
        this.emit('tab-changed', {
            previous: prevTab,
            id: tabID,
            tab: this.tabs[tabID]
        });
    }

    /**
     * Returns active tab
     * @NOTE: may return NULL if active tab still processing
     * @public
     * @returns {Tab}
     */
    getActiveTab(){
        return this.tabs[this.__activeTabID];
    }

    /**
     * Reloads content of tab
     * @param tabID {string || Array<string>}
     */
    reload(tabID){
        if(_.isArray(tabID)){
            let tab = _.find(this.tabs, (t)=>{
                return t.id === tabID;
            });
            if(tab){
                tab.reloadContent();
            }
        } else {
            _.map(this.tabs, (t)=>{
                if(tabID.indexOf(t.id) !== -1){
                    t.reloadContent();
                }
            });
        }
    }

    /**
     * Reload content of all tabs
     */
    reloadAll(){
        _.map(this.tabs, (t)=>{
            t.reloadContent();
        })
    }

    onLoad(tabID, callback, context){
        this.addListener(tabID, callback, context);
    }

}

TrinityTab.settings = {debug : false};

/**
 * Initialize TrinityTab wrapper
 * @private
 */
function _initialize(){
    //Check which tab to load first
    let tabID = location.hash.substring(1),
        activeHead = null;

    if(tabID.length > 0){
        activeHead = document.getElementById(tabID);
        activeHead.setAttribute('checked', 'checked');
    } else {
        activeHead = _.find(this.heads, (tab)=>{
            return !_.isNull(tab.getAttribute('checked'));
        });
        if(!activeHead){
            activeHead = this.heads[0];
        }
        tabID = activeHead.getAttribute('id');
        __pushHistory(tabID);
    }
    this.__activeTabID = tabID;
    // Add new Tab to tabs
    this.tabs[tabID] = new Tab(activeHead, this);

    /** Attach click event Listeners to other heads **/
    _.map(this.heads, (head)=>{
        events.listen(head, 'click', __handleTabClick.bind(this, head));
    });

    // Navigation
    events.listen(window, 'popstate', __handleNavigation, false, this);
}

/**
 * Handles pop state navigation
 * @private
 */
function __handleNavigation(){
    let tabID = location.hash.substring(1);
    if(tabID.length > 0) {
        this.setActiveTab(tabID);
    }
}

/**
 * Handles click event on Tab
 * @param head {HTMLElement}
 * @param [e] {Event}
 * @private
 */
function __handleTabClick(head, e){
    let tabID = head.getAttribute('id');
    // If undefined -> Create and Set as Active
    if(_.isUndefined(this.tabs[tabID])) {
        this.tabs[tabID] = new Tab(head, this);
    }
    this.setActiveTab(tabID);
}

/**
 * Push new history
 * @param newHash
 * @param label
 * @private
 */
function __pushHistory(newHash, label){
    if(newHash !== window.location.hash.substring(1)){
        window.history.pushState(null, label ? label.join(''):'',[location.pathname,'#',newHash].join(''))
    }
}



/**
 * Tab class
 */
export class Tab {
    constructor(head, parent){
        this.id = head.getAttribute('id');
        this.head = head;
        this.parent = parent;
        this.root = null;
        this.forms = [];

        // Tab body
        this.bodyElement = document.getElementById(this.id.replace('tab', 'tab-body-'));

        __showLoading(this.bodyElement);

        //link of body for root child
        this.dataSource = this.bodyElement.getAttribute('data-source');
        this.loadContent();
    }

    loadContent(){
        __requestWidget(this.dataSource, this, null);
    }

    reloadContent(){
        __showLoading(this.bodyElement);
        Dom.removeNode(this.root);
        __requestWidget(this.dataSource, this, null);
    }
}

function __requestWidget(link, tab, callback){
    Gateway.get(link, null, function(data){
        // @NOTE: note sure if this if is necessary
        if(typeof data === 'object'){
            if(data.go != undefined){
                __requestWidget(data.go, tab, callback);
                return;
            }
            throw new Error('Unexpected response: ', data);
        }

        let tmpDiv =  Dom.createDom('div', null, data.trim());
        tab.root = tmpDiv.children.length === 1 ? tmpDiv.children[0] : tmpDiv;

        __hideLoading(tab.bodyElement);
        tab.bodyElement.appendChild(tab.root);

        // Dispatch global event
        // tab doesn't inherit from EventEmitter class, but his parent does
        let descriptionID = tab.root.getAttribute('id') || tab.id;
        tab.parent.emit('tab-loaded', {
            id: descriptionID,
            tab: tab,
            element: tab.bodyElement
        });

        // Dispatch tabID-specific event
        tab.parent.emit(descriptionID, {
            tab: tab,
            element: tab.bodyElement
        });

        // IF callback provided
        if(callback) {
            callback.call(tab, this.bodyElement);
        }
    }, function(error){
        //TODO: Refresh button and Error somehow
        console.error(error);
    });
}

//TODO: loading icon to settings
function __showLoading(element){
    let loader = element.querySelector('.trinity-tab-loader');
    if(_.isNull(loader)){
        let icon = Dom.createDom('i', {'class': 'tiecons tiecons-loading tiecons-rotate font-40'});
        loader = Dom.createDom('div', {'class':'trinity-tab-loader tab-loader'}, icon);
        element.appendChild(loader);
    } else {
        Dom.classlist.remove(loader, 'display-none');
    }
}

function __hideLoading(element){
    let loader = element.querySelector('.trinity-tab-loader');
    if(loader){
        Dom.classlist.add(loader, 'display-none');
    }
}