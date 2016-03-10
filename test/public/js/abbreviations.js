/**
 * Created by fisa on 8/3/15.
 */
/**
 * Why? 'document.querySelector()' vs 'q()' - 21 bits saved
 * 'document.getElementById()' vs 'q.id()' - 19 bits saved
 * 'document.querySelectorAll()' vs 'qAll()' - 21 bits saved
 */


/**
 * Abbreviation for native query selector
 * @param query
 * @returns {Element}
 */
q = function(query){
    return document.querySelector(query);
};


/**
 * Abbreviation for native queryAll selector
 * @param query
 * @returns {NodeList}
 */
qAll = function(query){
    return document.querySelectorAll(query);
};


/**
 * Abbreviation for native select by ID
 * @param id
 * @returns {Element}
 */
q.id = function(id){
    return document.getElementById(id);
};

/**
 * Abbreviation for native select by tag name
 * @param tagName
 * @returns {NodeList}
 */
q.tag = function(tagName){
    return document.getElementsByTagName(tagName);
};

/**
 * Abbreviation for native select by class
 * @param className
 * @returns {NodeList}
 */
q.class = function(className){
    return document.getElementsByClassName(className);
};

/**
 * Abbreviation for native select by name
 * @param id
 * @returns {NodeList}
 */
q.name = function(name){
    return document.getElementsByName(name);
};

/**
 * Also specify it for every Element for better search chain
 */
Element.prototype.q = Element.prototype.querySelector;
Element.prototype.q.tag = Element.prototype.getElementsByTagName;
Element.prototype.qAll = Element.prototype.querySelectorAll;

DocumentFragment.prototype.q = DocumentFragment.prototype.querySelector;
DocumentFragment.prototype.q.tag = DocumentFragment.prototype.getElementsByTagName;
DocumentFragment.prototype.qAll = DocumentFragment.prototype.querySelectorAll;

Document.prototype.q = Document.prototype.querySelector;
Document.prototype.q.tag = Document.prototype.getElementsByTagName;
Document.prototype.qAll = Document.prototype.querySelectorAll;