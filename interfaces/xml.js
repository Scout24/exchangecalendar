/* ***** BEGIN LICENSE BLOCK *****
 * Version: GPL 3.0
 *
 * The contents of this file are subject to the General Public License
 * 3.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.gnu.org/licenses/gpl.html
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * Author: Michel Verbraak (info@1st-setup.nl)
 * Website: http://www.1st-setup.nl/wordpress/?page_id=133
 * email: exchangecalendar@extensions.1st-setup.nl
 *
 * This XML interface can be used to convert from xml-string to JXON object
 * and back.
 *
 * ***** BEGIN LICENSE BLOCK *****/

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;
var Cr = Components.results;
var components = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

Cu.import("resource://exchangecalendar/ecFunctions.js");

function mivIxml2jxon(aXMLString, aStartPos, aParent) {

	this.content = {};
	this.itemCount = 0;
	this.messageLength = 0;
	this.closed = false;

	this.logInfo("mivIxml2jxon.init",2);

	if (aXMLString) {
		this.processXMLString(aXMLString, aStartPos, aParent);
	}
	else {
		this.isXMLHeader = true;
		this.XMLHeader = '<?xml version="1.0" encoding="utf-8"?>';
	}
}

var xml2jxonGUID = "d7165a60-7d64-42b2-ac48-6ccfc0962abb";

const tagSeparator = ":";


mivIxml2jxon.prototype = {

	// methods from nsISupport

	_refCount: 0,

	//nsrefcnt AddRef();
	AddRef: function _AddRef()
	{
		this._refCount++;
		return this._refCount;
	},

	/* void QueryInterface(
	  in nsIIDRef uuid,
	  [iid_is(uuid),retval] out nsQIResult result
	);	 */
	QueryInterface: XPCOMUtils.generateQI([Ci.mivIxml2jxon,
			Ci.nsIClassInfo,
			Ci.nsISupports]),

	//nsrefcnt Release();
	Release: function _Release()
	{
		this._refCount--;
		return this._refCount;
	},

	// methods from nsIClassInfo

	// nsISupports getHelperForLanguage(in PRUint32 language);
	getHelperForLanguage: function _getHelperForLanguage(language) {
		return null;
	},

	// void getInterfaces(out PRUint32 count, [array, size_is(count), retval] out nsIIDPtr array);
	getInterfaces: function _getInterfaces(count) 
	{
		var ifaces = [Ci.mivIxml2jxon,
			Ci.nsIClassInfo,
			Ci.nsISupports];
		count.value = ifaces.length;
		return ifaces;
	},

	// Attributes from nsIClassInfo

	classDescription: "XML to JXON and back conversion functionality.",
	classID: components.ID("{"+xml2jxonGUID+"}"),
	contractID: "@1st-setup.nl/conversion/xml2jxon;1",
	flags: Ci.nsIClassInfo.THREADSAFE,
	implementationLanguage: Ci.nsIProgrammingLanguage.JAVASCRIPT,

	// External methods

	// External attributes
/*	ERR_MISSING_SPECIAL_TAG: 1,
	ERR_INVALID_TAG: 2,
	ERR_INVALID_SPECIAL_TAG: 3,
	ERR_WRONG_CLOSING_TAG: 4,*/

	// Internal methods.

	xmlError: function _xmlError(aErrorID)
	{
		switch (aErrorID) {
			case Ci.mivIxml2jxon.ERR_MISSING_SPECIAL_TAG: 
				this.logInfo(this.tagName+":Error:ERR_MISSING_SPECIAL_TAG. ("+exchWebService.commonFunctions.STACKshort()+")");
				return { name: "ERR_MISSING_SPECIAL_TAG",
					 message: "A special tag like '?' is missing",
				         code: aErrorID};
			case Ci.mivIxml2jxon.ERR_INVALID_TAG: 
				this.logInfo(this.tagName+":Error:ERR_INVALID_SPECIAL_TAG. ("+exchWebService.commonFunctions.STACKshort()+")");
				return { name: "ERR_INVALID_SPECIAL_TAG",
					 message: "Tag is invalid",
				         code: aErrorID};
			case Ci.mivIxml2jxon.ERR_INVALID_SPECIAL_TAG: 
				this.logInfo(this.tagName+":Error:ERR_INVALID_SPECIAL_TAG. ("+exchWebService.commonFunctions.STACKshort()+")");
				return { name: "ERR_INVALID_SPECIAL_TAG",
					 message: "Special Tag is invalid",
				         code: aErrorID};
			case Ci.mivIxml2jxon.ERR_WRONG_CLOSING_TAG: 
				this.logInfo(this.tagName+":Error:ERR_WRONG_CLOSING_TAG. ("+exchWebService.commonFunctions.STACKshort()+")");
				return { name: "ERR_WRONG_CLOSING_TAG",
					 message: "Found wrong closing tag. Expected another.",
				         code: aErrorID};
			case Ci.mivIxml2jxon.ERR_WRONG_ATTRIBUTE_SEPARATOR: 
				this.logInfo(this.tagName+":Error:ERR_WRONG_ATTRIBUTE_SEPARATOR. ("+exchWebService.commonFunctions.STACKshort()+")");
				return { name: "ERR_WRONG_ATTRIBUTE_SEPARATOR",
					 message: "Found wrong attribute separator. Expected '=' character.",
				         code: aErrorID};
			case Ci.mivIxml2jxon.ERR_ATTRIBUTE_VALUE_QUOTES: 
				this.logInfo(this.tagName+":Error:ERR_ATTRIBUTE_VALUE_QUOTES. ("+exchWebService.commonFunctions.STACKshort()+")");
				return { name: "ERR_ATTRIBUTE_VALUE_QUOTES",
					 message: "Found error in attribute value quotes.",
				         code: aErrorID};
		}
	},

	addToContent: function _addToContent(aValue)
	{
		this.content[this.itemCount] = aValue;
		this.itemCount++;
	},

	trim: function _trim(aValue)
	{
		var strLength = aValue.length;
		var leftPos = 0;
		while ((leftPos < strLength) && (aValue.substr(leftPos,1) == " ")) {
			leftPos++;
		}
		var rightPos = strLength-1;
		while ((rightPos >= 0) && (aValue.substr(rightPos,1) == " ")) {
			rightPos--;
		}
		return aValue.substr(leftPos, rightPos - leftPos + 1);
	},

	explodeAttribute: function _explodeAttribute(aValue)
	{
		var splitPos = aValue.indexOf("=");
		if (splitPos == -1) {
			throw this.xmlError(Ci.mivIxml2jxon.ERR_WRONG_ATTRIBUTE_SEPARATOR);
		}
 
		// trim left and right.
		var attributeName = this.trim(aValue.substr(0, splitPos));
		var attributeValue = this.trim(aValue.substr(splitPos+1));

		if ((attributeValue.substr(0,1) == "'") || (attributeValue.substr(0,1) == '"')) {
			var valueLength = attributeValue.length;
			if (attributeValue.substr(0,1) == attributeValue.substr(valueLength-1,1)) {
				// Remove quote around attribute value.
				attributeValue = attributeValue.substr(1, valueLength-2);
			}
			else {
				throw this.xmlError(Ci.mivIxml2jxon.ERR_ATTRIBUTE_VALUE_QUOTES);
			}
		}

		if (attributeName.toLowerCase().indexOf("xmlns") == 0) {
			if (!this.nameSpaces) {
				this.nameSpaces = {};
			}
			var xmlnsPos = attributeName.indexOf(":");
			if (xmlnsPos > -1) {
				this.logInfo("Found xml namespace:"+attributeName.substr(xmlnsPos+1)+"="+attributeValue, 2);
				this.nameSpaces[attributeName.substr(xmlnsPos+1)] = attributeValue;
			}
			else {
				this.logInfo("Found xml namespace:_default_="+attributeValue, 2);
				this.nameSpaces["_default_"] = attributeValue;
			}
		}
		else {
			this.logInfo("Added attribute to tag '"+this.tagName+"'. "+attributeName+"="+attributeValue,2);

			this["@"+attributeName] = attributeValue;
		}
	},

	setAttribute: function _setAttribute(aAttribute, aValue)
	{
		this["@"+aAttribute] = aValue;
	},

	addChildTagObject: function _addChildTagObject(aObject)
	{
		if (!aObject) {
			return;
		}

		var aNameSpace = aObject.nameSpace;
		var aTagName = aObject.tagName;
		if (!this[aNameSpace+tagSeparator+aTagName]) {
			this.logInfo("First childTag: "+this.tagName+"."+aNameSpace+tagSeparator+aTagName+"="+aObject,2);
			this[aNameSpace+tagSeparator+aTagName] = aObject;
			this.addToContent(aObject);
			this.isNotAnArray = true;
		}
		else {
			if (this.isNotAnArray) {
				var firstObject = this[aNameSpace+tagSeparator+aTagName];
				this[aNameSpace+tagSeparator+aTagName] = new Array();
				this[aNameSpace+tagSeparator+aTagName].push(firstObject);
				this.isNotAnArray = false;
			}
			this.logInfo("childTag : "+this.tagName+"."+aNameSpace+tagSeparator+aTagName+"["+(this[aNameSpace+tagSeparator+aTagName].length+1)+"]",2);
			this[aNameSpace+tagSeparator+aTagName].push(aObject);
			this.addToContent(aObject);
		}
		if (aObject != this) {
			aObject.addChildTagObject(aObject);
		}
	},

	addChildTag: function _addChildTag(aTagName, aNameSpace, aValue)
	{
		if (aNameSpace) {
			var nameSpace = aNameSpace;
		}
		else {
			if (aParent.nameSpace) {
				var nameSpace = aParent.nameSpace;
			}
			else {
				var nameSpace = "_default_";
			}
		}

		if ((aValue) && (aValue != "")) {
			var result = new mivIxml2jxon("<"+nameSpace+":"+aTagName+">"+aValue+"</"+nameSpace+":"+aTagName+">", 0, this);
		}
		else {
			var result = new mivIxml2jxon("<"+nameSpace+":"+aTagName+"/>", 0, this);
		}

//		this.addChildTagObject(result);
		return result;
	},

	addSibblingTag: function _addChildTag(aTagName, aNameSpace, aValue)
	{
		if (!aParent) return null;

		if (aNameSpace) {
			var nameSpace = aNameSpace;
		}
		else {
			if (aParent.nameSpace) {
				var nameSpace = aParent.nameSpace;
			}
			else {
				var nameSpace = "_default_";
			}
		}

		var result = new mivIxml2jxon("<"+nameSpace+":"+aTagName+"/>", 0, this);
		result.addToContent(aValue);
		aParent.addToContent(result);
		return result;
	},

	contentStr: function _contentStr()
	{
		if (this.content[0]) {
			this.logInfo("We have content getting first string record.", 2);
			var index = 0;
			var value = "";
			while ((index < this.itemCount) && (value == "")) {
				if ((typeof this.content[index] === "string") || (this.content[index] instanceof String)) {
					this.logInfo(" @@: index:"+index+", content:"+this.content[index], 2);
					value = this.content[index];
				}
				index++;
			}
			return value;
		}
		else {
			this.logInfo("We have no content.tagName:"+this.tagName, 2);
			return "";
		}
	},

	attributesToString: function _attributesToString()
	{
		var result = "";
		for (var index in this) {
			if (index.substr(0,1) == "@") {
				result += " "+index.substr(1) + '="'+this[index]+'"';
			}
		}
		return result;
	},

	nameSpacesToString: function _nameSpacesToString()
	{
		var result = "";
		for (var index in this.nameSpaces) {
			if (index == "_default_") {   
				result += ' xmlns="'+this.nameSpaces[index]+'"';
			}
			else {
				result += " xmlns:"+index+'="'+this.nameSpaces[index]+'"';
			}
		}
		return result;
	},

	toString: function _toString()
	{
		this.logInfo(this.tagName+":toString", 2);
		var result = "";
		var contentCount = 0;
		for (var index in this.content) {
			contentCount++;
			if ((this.content[index] instanceof Ci.mivIxml2jxon) || (this.content[index] instanceof mivIxml2jxon)) {

				if (this.content[index].tagName != this.tagName) {
					this.logInfo(this.tagName+":Found object at content index '"+index+"'.", 2);
					result += this.content[index].toString();
				}
			}
			else {
				if ((typeof this.content[index] === "string") || (this.content[index] instanceof String)) {
					this.logInfo(this.tagName+":Found string at content index '"+index+"'.", 2);
					result += this.content[index];
				}
				else {
					this.logInfo(this.tagName+":Found UNKNOWN at content index '"+index+"'.", 2);
				}
			}
		}

		var attributes = this.attributesToString();
		var nameSpaces = this.nameSpacesToString();

		var nameSpace = this.nameSpace;
		if (nameSpace == "_default_") {
			nameSpace = "";
		}
		else {
			nameSpace += ":";
		}

		if (contentCount == 0) {
			result = "<"+nameSpace+this.tagName+attributes+nameSpaces+"/>";
		}
		else {
			result = "<"+nameSpace+this.tagName+attributes+nameSpaces+">" + result + "</"+nameSpace+this.tagName+">";
		}

		return result;
	},

	XPath: function XPath(aPath)
	{
		//this.logInfo("XPath:"+aPath,1);
		var tmpPath = aPath;
		var result = new Array();

		if (tmpPath.substr(0, 1) == "/") {
			tmpPath = tmpPath.substr(1);
		}

		switch (tmpPath.substr(0,1)) {
		case "/" : // Find all elements by specified element name
			var allTag = tmpPath.substr(1);
			var nextForwardSlashSplit = allTag.indexOf("/");
			var nextSquareBracketSplit = allTag.indexOf("[");

			var nextSplit = 99999;
			if ((nextForwardSlashSplit < nextSplit) && (nextForwardSlashSplit > -1)) {
				nextSplit = nextForwardSlashSplit;
			}
			if ((nextSquareBracketSplit < nextSplit) && (nextSquareBracketSplit > -1)) {
				nextSplit = nextSquareBracketSplit;
			}

			if (nextSplit < 99999) {
				allTag = allTag.substr(0, nextSplit);
			}

			for (var index in this) {
				if ((index.indexOf(":") > -1) && (this[index].tagName != this.tagName)) {
					result.push(this[index]);
				}
			}
			tmpPath = "/"+tmpPath;
			break;

		case "@" : // Find attribute within this element
			this.logInfo("Attribute search:"+tmpPath+" in tag '"+this.tagName+"'", 2);
			if (this[tmpPath]) {
				this.logInfo("  --==--:"+this[tmpPath], 2);
				result.push(this[tmpPath]);
			}
			tmpPath = "";
			break;

		case "*" : // Wildcard. Will parse all children.
			tmpPath = tmpPath.substr(1);
			for (var index in this) {
				if ((index.indexOf(":") > -1) && (this[index].tagName != this.tagName)) {
					this.logInfo(" -- tag:"+index, 2);
					result.push(this[index]);
				}
			}
			break;

		case "[" : // Compare/match function
			this.logInfo("Requested XPath contains an index, attribute or compare request.", 2);
			var tmpPos = 1;
			var index = "";
			var notClosed = true;
			var notQuoteOpen = true;
			var quotesUsed = "";
			while ((tmpPos < tmpPath.length) && (notClosed)) {
				if ((tmpPath.substr(tmpPos,1) == "'") || (tmpPath.substr(tmpPos,1) == '"')) {
					// We found quotes. Do they belong to our string.
					if (notQuoteOpen) {
						quotesUsed = tmpPath.substr(tmpPos,1);
						notQuoteOpen = false;
					}
					else {
						if (tmpPath.substr(tmpPos,1) == quotesUsed) {
							quotesUsed = "";
							notQuoteOpen = true;
						}
					}
				}

				if ((tmpPath.substr(tmpPos,1) == "]") && (notQuoteOpen)) {
					notClosed = false;
				}
				else {
					index += tmpPath.substr(tmpPos,1);
				}
				tmpPos++;
			}

			if (!notClosed) {
				tmpPath = tmpPath.substr(tmpPos);
			}

			this.logInfo("["+index+"], tmpPath:"+tmpPath,2);

//			var pathPart = tmpPath.substr(1);
//			var index = tmpPath.substr(1, tmpPath2.indexOf("]"));
			index = this.trim(index); // We expect it is normally closed.. TODO: Checkfor this.

			// No square brackets or the content is an attribute or compare request
			if (index != "") {
				// We have a compare request. The index could be a number, string or XPath.

				// See if we have to compare something? <=>
				var smallerThen = index.indexOf("<");
				var equalTo = index.indexOf("=");
				var biggerThen = index.indexOf(">");

				if ((smallerThen > -1) || (equalTo > -1) || (biggerThen > -1)) {

					var minValue = smallerThen;
					if (minValue == -1) minValue = 999;
					if ((equalTo < minValue) && (equalTo > -1)) {
						minValue = equalTo;
					}
					if ((biggerThen < minValue) && (biggerThen > -1)) {
						minValue = biggerThen;
					}
					var value1 = this.trim(index.substr(0,minValue));
					var value2 = this.trim(index.substr(Math.max(smallerThen, equalTo, biggerThen)+1));
				}
				else {
					var value1 = index;
					var value2 = "";
				}

				// Find left side results.
				if (value1 != "") {
					if ((value1.substr(0,1) == "/") || (value1.substr(0,1) == ".") || (value1.substr(0,1) == "@")) {
						// Left side is a XPath query.
						this.logInfo("1 Left side is a XPath query. value1:"+value1,2);
						var tmpResult1 = this.XPath(value1);
					}
					else {
						// Left side is a number or string.
						var tmpResult1 = new Array();
						if (isNaN(value1)) {
							tmpResult1.push(new String(value1.substr(1,value1.length-2)));
						}
						else {
							tmpResult1.push(value1);
						}
					}
				}

				// Find right side results
				this.logInfo("-- value2:"+value2,2);
				if (value2 != "") {
					if ((value2.substr(0,1) == "/") || (value2.substr(0,1) == ".") || (value2.substr(0,1) == "@")) {
						// Right side is a XPath query
						var tmpResult2 = this.XPath(value2);
					}
					else {
						// Right side is a number or string.
						var tmpResult2 = new Array();
						if (isNaN(value1)) {
							this.logInfo(" Right side is a String. value2:"+value2.substr(1,value2.length-2),2);
							tmpResult2.push(new String(value2.substr(1,value2.length-2)));
						}
						else {
							this.logInfo(" Right side is a number. value2:"+value2,2);
							tmpResult2.push(value2);
						}
					}
				}

				if (tmpResult1.length > 0) {
					this.logInfo("tmpResult1.length:"+tmpResult1.length,2);
					if ((smallerThen > -1) || (equalTo > -1) || (biggerThen > -1)) {
						// Filter out ony the valid ones.
						if (tmpResult2.length > 0) {
							this.logInfo("tmpResult2.length:"+tmpResult2.length,2);
							this.logInfo("Going to match found results to compare function",2);
							var x = 0;
							var matchFound = false;
							while ((x < tmpResult1.length) && (!matchFound)) {

								if ((typeof tmpResult1[x] === "string") || (tmpResult1[x] instanceof String)) {
									var left = tmpResult1[x];
								}
								else {
									var left = tmpResult1[x].contentStr();
								}

								var y = 0;
								while ((y < tmpResult2.length) && (!matchFound)) {

									if ((typeof tmpResult2[y] === "string") || (tmpResult2[y] instanceof String)) {
										var right = tmpResult2[y];
									}
									else {
										var right = tmpResult2[y].contentStr();
									}

									matchFound = ( ((smallerThen > -1) && (left < right)) ||
											((equalTo > -1) && (left == right)) ||
											((biggerThen > -1) && (left > right)) );
									y++;
								}
								x++;
							}
							if (matchFound) {
								this.logInfo(" @@@@@@@@@@@@ -------- MATCHFOUND ---------- @@@@@@@@@@@@@", 2);
								result.push(this);
							}
						}
						else {
							// Error... We have nothing to compare against...!
							this.logInfo("XPath compare error:"+this.tagName+"["+index+"]");
							throw "XPath compare error:"+this.tagName+"["+index+"]";
						}
					}
					else {
						// Return all results.
						result.push(this);
					}
				}
			}
			else {
				this.logInfo("Nothing specified between the square brackets!!??");
				throw "XPath compare error:No Value between square brackets:"+this.tagName+"["+index+"]";
			}
			break;

		default:
			var bracketPos = tmpPath.indexOf("[");
			var forwardSlashPos = tmpPath.indexOf("/");
			var splitPos = tmpPath.length;
			if ((bracketPos < splitPos) && (bracketPos > -1)) {
				splitPos = bracketPos;
			}
			if ((forwardSlashPos < splitPos) && (forwardSlashPos > -1)) {
				splitPos = forwardSlashPos;
			}

			var tmpPath2 = tmpPath.substr(0, splitPos);
			tmpPath = tmpPath.substr(splitPos);

			if (tmpPath2 != "") {

				this.logInfo("We will check if specified element '"+tmpPath2+"' exists as child in '"+this.tagName+"'", 2);
				for (var index in this) {
					if (index.indexOf(":") > -1) {
						this.logInfo(" %%:"+index, 2);
						if (index == tmpPath2) {
							if (Array.isArray(this[index])) {
								this.logInfo(" ^^ found tag:"+index+" and is an array with "+this[index].length+" elements.", 2);
								for (var index2 in this[index]) {
									result.push(this[index][index2]);
								}
							}
							else {
								this.logInfo(" ^^ found tag:"+index, 2);
								result.push(this[index]);
							}
						}
					}
				}

			}

		} // End of switch

			this.logInfo("tmpPath:"+tmpPath+", result.length="+result.length,2);
		if ((result.length > 0) && (tmpPath != "")) {
			this.logInfo("tmpPath:"+tmpPath,2);
			var finalResult = new Array();
			for (var index in result) {

				if ((typeof result[index] === "string") || (result[index] instanceof String)) {
					finalResult.push(result[index]);
				}
				else {
					this.logInfo("~~a:"+result[index].tagName, 2);
					var tmpResult = result[index].XPath(tmpPath);
					if (tmpResult) {
						for (var index2 in tmpResult) {
							finalResult.push(tmpResult[index2]);
						}
					}
				}
			}
			result = finalResult;
		}
		else {
			if ((tmpPath != "") && (tmpPath.substr(0,2) != "//")) {
				var finalResult = new Array();
				this.logInfo("~~b:"+this.tagName, 2);
				var tmpResult = this.XPath(tmpPath);
				if (tmpResult) {
					for (var index2 in tmpResult) {
						finalResult.push(tmpResult[index2]);
					}
				}
				result = finalResult;
			}
		}

			this.logInfo("@@ tmpPath:"+tmpPath+", tag:"+this.tagName+", allTag:"+allTag+", result.length="+result.length,2);
		if ((tmpPath != "") && (tmpPath.substr(0,2) == "//") && (this[allTag]) && (this.tagName == this[allTag].tagName)) {
			this.logInfo(" !!:tag:"+this.tagName, 2);

			tmpPath = tmpPath.substr(1); // We remove one of double forward slash so it becomes a normal xpath and filtering will take place.
			if ((tmpPath != "") && (tmpPath.substr(0,2) != "//")) {
				var finalResult = new Array();
				this.logInfo("~~c:"+this.tagName, 2);
				var tmpResult = this.XPath(tmpPath);
				if (tmpResult) {
					for (var index2 in tmpResult) {
						finalResult.push(tmpResult[index2]);
					}
				}
				result = finalResult;
			}

//			result.push(this);
		}

		this.logInfo("XPath return.....",2);
		return result;
	},

	processXMLString: function _processXMLString(aString, aStartPos, aParent)
	{
		//Search for Tag opening character "<"
		var pos = this.findCharacter(aString, aStartPos, "<");
		var strLength = aString.length;

		if (pos > -1) {
			// Found opening character for Tag.
			this.startPos = pos;
			this.skipped = pos - aStartPos;
			if ((this.skipped > 0) && (aParent)) {
				this.logInfo("Added content '"+aString.substr(aStartPos, this.skipped)+"' to tag '"+aParent.tagName+"'.", 2);
				aParent.addToContent(new String(aString.substr(aStartPos, this.skipped)));
			}

			pos++;
			// check if next character is special character "?"
			if ( (pos < strLength) && (aString.substr(pos, 1) == "?")) {
				// found special character "?"
				// Next four characters should be "xml " or else error.
				pos++;
				if (aString,substr(pos, 4) == "xml ") {
					// We have a header.
					var tmpPos = this.findString(aString, pos, "?>");
					if (tmpPos == -1) {
						throw this.xmlError(Ci.mivIxml2jxon.ERR_INVALID_SPECIAL_TAG);
					}
					else {
						// found complete special tag.
						this.isXMLHeader = true;
						this.XMLHeader = aString.substr(this.startPos, tmpPos-this.startPos+1);
						this.addToContent(new mivIxml2jxon(aString, tmpPos+2, this));
						this.messageLength = tmpPos - this.startPos + 3;
						this.closed = true; 
						return;						
					}
				}
				else {
					// Error no valid header.
					throw this.xmlError(Ci.mivIxml2jxon.ERR_MISSING_SPECIAL_TAG);
				}
			}
			else {
				if ( (pos < strLength) && (aString.substr(pos, 1) == "/")) {
					// found special character "/" at start of tag
					// this should be a closing tag.
					pos++;
					var tmpStartPos = pos;
					if (pos < strLength) {
						// We still have characters left.
						var tmpPos = this.findCharacter(aString, pos, ">");
						if (tmpPos > -1) {
							// We found a closing character.
							// Disassemble the tag. And see if it is the same tag as our parent. If so return else Error.
							var closingTag = aString.substr(tmpStartPos, tmpPos-tmpStartPos);
							var xmlnsPos = closingTag.indexOf(":");
							if (xmlnsPos > -1) {
								var nameSpace = closingTag.substr(0, xmlnsPos);
								closingTag = closingTag.substr(xmlnsPos+1);
							}
							else {
								var nameSpace = "_default_";
							}

							if ((aParent) && (closingTag == aParent.tagName) && (nameSpace == aParent.nameSpace)) {
								this.logInfo("Found closing tag '"+closingTag+"' in namespace '"+nameSpace+"'",2);
								this.lastPos = tmpPos;
								this.closed = true;
								return;
							}
							else {
								this.logInfo("Found closing tag '"+closingTag+"' in namespace '"+nameSpace+"' but expected tag '"+aParent.tagName+"' in namespace '"+aParent.nameSpace+"'",1);
								throw this.xmlError(Ci.mivIxml2jxon.ERR_WRONG_CLOSING_TAG);
							}
						}
						else {
							throw this.xmlError(Ci.mivIxml2jxon.ERR_INVALID_TAG);
						}
					}
					else {
						// No more characters left in aString.
						throw this.xmlError(Ci.mivIxml2jxon.ERR_INVALID_TAG);
					}
				}
				else {
					// did not find special character or aString is not long enough.
					if (pos < strLength) {
						// We still have characters left.
						var tmpPos = this.findCharacter(aString, pos, ">");
						if (tmpPos > -1) {
							// We found a closing character.
							// Disassemble the tag. And process the content.
						
							// get tag name.
							var tmpStart = this.startPos + 1;
							this.tagName = "";
							while ((tmpStart < strLength) && (aString.substr(tmpStart,1) != ">") && 
								(aString.substr(tmpStart,1) != "/") && (aString.substr(tmpStart,1) != " ")) {
								this.tagName = this.tagName + aString.substr(tmpStart,1);
								tmpStart++;
							}

							var xmlnsPos = this.tagName.indexOf(":");
							if (xmlnsPos > -1) {
								this.nameSpace = this.tagName.substr(0, xmlnsPos);
								this.tagName = this.tagName.substr(xmlnsPos+1);
							}
							else {
								this.nameSpace = "_default_";
							}
							this.logInfo("Found opening tag '"+this.tagName+"' in xml namespace '"+this.nameSpace+"'",2);
							if (aParent) {
								aParent.addChildTagObject(this);
							}
							else {
								this.addChildTagObject(this);
							}

							if ((tmpStart < strLength) && (aString.substr(tmpStart,1) == "/")) {
								this.logInfo("a. Found close character '/' at end of opening tag.",2); 
								this.messageLength = tmpStart - this.startPos + 2;
								this.lastPos = tmpStart+1;
								//this.closed = false;
								return;
							}
							else {
								if ((tmpStart < strLength) && (aString.substr(tmpStart,1) == " ")) {
									this.logInfo("Found space character ' '. There are attributes.",2); 

									// get attributes &
									// get namespaces
									var attribute = "";
									var attributes = [];
									tmpStart++;
									var quoteOpen = false;
									var quoteChar = "";
									while ((tmpStart < strLength) && 
										(((aString.substr(tmpStart,1) != ">") && (aString.substr(tmpStart,1) != "/")) || (quoteOpen)) ) {
										attribute = attribute + aString.substr(tmpStart,1);
										if ((aString.substr(tmpStart,1) == '"') || (aString.substr(tmpStart,1) == "'")) {
											if ((!quoteOpen) || ((quoteOpen) && (quoteChar == aString.substr(tmpStart,1)))) {
												quoteOpen = !quoteOpen;
												if (quoteOpen) {
													this.logInfo("Found opening quote:"+tmpStart,2);
													quoteChar = aString.substr(tmpStart,1);
												}
												else {
													this.logInfo("Found closing quote:"+tmpStart,2);
												}
											}
										}

										tmpStart++;

										if ((tmpStart < strLength) && (aString.substr(tmpStart,1) == " ") && (!quoteOpen)) {
											this.logInfo("a. Found attribute '"+attribute+"' for tag '"+this.tagName+"'",2);
											attributes.push(attribute);
											this.explodeAttribute(attribute);
											attribute = "";
											tmpStart++;
										}
									}

									if ((tmpStart < strLength) && ((aString.substr(tmpStart,1) == "/") || (aString.substr(tmpStart,1) == ">"))) {
										this.logInfo("b. Found attribute '"+attribute+"' for tag '"+this.tagName+"'",2);
										attributes.push(attribute);
										this.explodeAttribute(attribute);
									}

									if ((tmpStart < strLength) && (aString.substr(tmpStart,1) == "/")) {
										// Found opening tag with attributes which is also closed.
										this.logInfo("b. Found close character '/' at end of opening tag.",2); 
										this.messageLength = tmpStart - this.startPos + 2;
										this.lastPos = tmpStart+1;
										return;
									}
									else {
										if ((tmpStart < strLength) && (aString.substr(tmpStart,1) == ">")) {
											// Found opening tag with attributes.
										}
										else {
											// Found opening tag but is not closed and we reached end of string.
											throw this.xmlError(Ci.mivIxml2jxon.ERR_WRONG_CLOSING_TAG);
										}
									}

								}
								else {
									if ((tmpStart < strLength) && (aString.substr(tmpStart,1) == ">")) {
										// Found opening tag without attributes and not a closing character '/'
									}
									else {
										// Found opening tag but is not closed and we reached end of string.
										throw this.xmlError(Ci.mivIxml2jxon.ERR_WRONG_CLOSING_TAG);
									}
								}
						
							}


							var tmpChild = null;
							while ((!tmpChild) || (!tmpChild.closed)) {
								this.logInfo("Going to proces content of tag '"+this.tagName+"'.startPos:"+this.startPos+", messageLength:"+this.messageLength, 2);
								tmpChild = new mivIxml2jxon(aString, tmpPos+1, this);
								if (tmpChild.tagName) {
									this.logInfo("This child contains a tagName '"+tmpChild.tagName+"' so going to add it to the content of tag '"+this.tagName+"'.", 2);
									//this.addToContent(tmpChild);
								}
								else {
									this.logInfo("This child DOES NOT contain a tagName so NOT going to add it to the content.", 2);
								}
								this.messageLength = tmpChild.lastPos - this.startPos + 1;
								tmpPos = tmpChild.lastPos;

								if (tmpChild.tagName) {
									this.logInfo("finished processing content of tag '"+tmpChild.tagName+"'.startPos:"+this.startPos+", messageLength:"+this.messageLength+",tmpChild.lastpos:"+tmpChild.lastPos, 2);
								}
								else {
									this.logInfo("finished processing content of tag '"+this.tagName+"'.startPos:"+this.startPos+", messageLength:"+this.messageLength+",tmpChild.lastpos:"+tmpChild.lastPos, 2);
								}
							}
							this.lastPos = tmpPos;

							
						}
						else {
							throw this.xmlError(Ci.mivIxml2jxon.ERR_INVALID_TAG);
						}
					}
					else {
						// No more characters left in aString.
						throw this.xmlError(Ci.mivIxml2jxon.ERR_INVALID_TAG);
					}
				}
			}
		}
		else {
			// Did not find opening character for Tag.
			// We stop here.
			if (aParent) {
				this.logInfo(" =======++++++++++");
				aParent.addToContent(new String(aString));
				aParent.messageLength = aParent.messageLength+aString.length; 
			}
			this.lastPos = aString.length - 1;
			return;
		}
	},

	findCharacter: function _findCharacter(aString, aStartPos, aChar)
	{
		var pos = aStartPos;
		var strLength = aString.length;
		while ((pos < strLength) && (aString.substr(pos, 1) != aChar)) {
			pos++;
		}

		if ((pos < strLength) && (aString.substr(pos, 1) == aChar)) {
			return pos;
		}
	
		return -1;
	},

	findString: function _findString(aString, aStartPos, aNeedle)
	{
		var pos = aStartPos;
		var strLength = aString.length;
		var needleLength = aNeedle.length;
		while ((pos < strLength) && (aString.substr(pos, needleLength) != aNeedle)) {
			pos++;
		}

		if ((pos < strLength) && (aString.substr(pos, needleLength) == aNeedle)) {
			return pos;
		}
	
		return -1;
	},


	logInfo: function _logInfo(message, aDebugLevel) {

		if (!aDebugLevel) {
			var debugLevel = 1;
		}
		else {
			var debugLevel = aDebugLevel;
		}

		var prefB = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
		var storedDebugLevel = exchWebService.commonFunctions.safeGetIntPref(prefB, "extensions.1st-setup.xml2jxon", 1, true);
		var storedDebugLevel = 1;

		if (debugLevel <= storedDebugLevel) {
			exchWebService.commonFunctions.LOG("[xml2jxon] "+message + " ("+exchWebService.commonFunctions.STACKshort()+")");
		}
	},

}

function NSGetFactory(cid) {

	try {
		if (!NSGetFactory.xml2json) {
			// Load main script from lightning that we need.
			NSGetFactory.xml2json = XPCOMUtils.generateNSGetFactory([mivIxml2jxon]);
			
	}

	} catch(e) {
		Components.utils.reportError(e);
		dump(e);
		throw e;
	}

	return NSGetFactory.xml2json(cid);
} 
