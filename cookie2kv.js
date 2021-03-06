/*\
|*|
|*|	:: cookies.js ::
|*|
|*|	A complete cookies reader/writer framework with full unicode support.
|*|
|*|	Revision #3 - July 13th, 2017
|*|
|*|	https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
|*|	https://developer.mozilla.org/User:fusionchess
|*|	https://github.com/madmurphy/cookies.js
|*|
|*|	This framework is released under the GNU Public License, version 3 or later.
|*|	http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|	Syntaxes:
|*|
|*|	* docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
|*|	* docCookies.getItem(name)
|*|	* docCookies.removeItem(name[, path[, domain]])
|*|	* docCookies.hasItem(name)
|*|	* docCookies.keys()
|*|
\*/

!(function(g){
	"use strict";

	/**
	 * parse url
	 * @param {String} url 
	 * @return {HTMLAnchorElement}
	 */
	function parseUrl(url) {
		var div = document.createElement('div');
		div.innerHTML = "<a></a>";
		div.firstChild.href = url; // Ensures that the href is properly escaped
		div.innerHTML = div.innerHTML; // Run the current innerHTML back through the parser
		return div.firstChild;
	}

	/**
	 * path list to root path
	 * @param {String} path 
	 */
	function parentsToRoot(path){
		var pathParents = path.split('/');
		var list = [path];
		for(
			var i=1;
			i<pathParents.length-1;
			i++
		){
			var currentPathParents = pathParents.slice(0,-i);
			list.push(currentPathParents.join('/'));
		}
		list.push('/');
		return list;
	}

	/*
	function forIn(arr,iterator,thisObj){
		if(thisObj === undefined){
			thisObj = null;
		}
		for(var i=0;i<arr.length;i++){
			iterator.call(thisObj,arr[i],i);
		}
	}
	*/

	function init(document){
		var docCookies = {
			/**
			 * @param {String} sKey
			 * @return {String}
			 */
			getItem: function (sKey) {
				if (!sKey) { return null; }
				return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
			},

			/**
			 * @param {String} sKey
			 * @param {String} sValue
			 * @param {Number|String|Date} vEnd
			 * @param {String} sPath
			 * @param {String} sDomain
			 * @param {String} bSecure
			 */
			setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
				if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
				var sExpires = "";
				if (vEnd) {
					switch (vEnd.constructor) {
						case Number:
							sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
							/*
							Note: Despite officially defined in RFC 6265, the use of `max-age` is not compatible with any
							version of Internet Explorer, Edge and some mobile browsers. Therefore passing a number to
							the end parameter might not work as expected. A possible solution might be to convert the the
							relative time to an absolute time. For instance, replacing the previous line with:
							*/
							/*
							sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; expires=" + (new Date(vEnd * 1e3 + Date.now())).toUTCString();
							*/
							break;
						case String:
							sExpires = "; expires=" + vEnd;
							break;
						case Date:
							sExpires = "; expires=" + vEnd.toUTCString();
							break;
					}
				}

				if(sPath==null) sPath = location.pathname;
				sPath = parseUrl(sPath).pathname;

				document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
				return true;
			},

			/**
			 * @param {String} sKey
			 * @param {String} sPath
			 * @param {String} sDomain
			 */
			removeItem: function (sKey, sPath, sDomain) {
				if (!this.hasItem(sKey)) { return false; }

				if(sPath==null) sPath = location.pathname;
				sPath = parseUrl(sPath).pathname;

				document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
				return true;
			},

			/**
			 * @param {String} sKey
			 */
			hasItem: function (sKey) {
				if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
				return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
			},

			/**
			 * @return {Array<String>}
			 */
			keys: function () {
				var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
				for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
				return aKeys;
			},

			//----------------------------------------------------
			clear: function(sPath, sDomain){
				var list = this.keys();
				for(
					var i;
					i < list.length;
					i++
				){
					this.removeItem(list[i],sPath,sDomain);
				}
			},

			removeItemAllPath: function(key,sDomain){
				var pathArray = parentsToRoot(location.pathname);
				for(var index=0;index<pathArray.length;index++){
					var value = pathArray[index];
					this.removeItem(key,value,sDomain);
					if(value!=='/'){
						this.removeItem(key,value+'/',sDomain);
					}
				}
			},
			clearAllPath: function(sDomain){
				var keyList = this.keys();
				for(var i=0;i<keyList.length;i++){
					var item = keyList[i];
					this.removeItemAllPath(item,sDomain);
				}
			}
		};
		return docCookies;
	}

	function C2K(doc){
		if(!doc) doc = document;
		return init(doc);
	}

	// output
	if (typeof module === "object" && typeof module.exports === "object") {
		module.exports = C2K;
	}
	else if (typeof define === "function" && define.amd) {
		define(["require", "exports"], ()=>C2K);
	}else{
		g.cookie2kv = C2K;
	}
})(this);
