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
 * -- Exchange 2007/2010 Contacts.
 * -- For Thunderbird.
 *
 * Author: Michel Verbraak (info@1st-setup.nl)
 * Website: http://www.1st-setup.nl/wordpress/?page_id=xx
 * email: exchangecontacts@extensions.1st-setup.nl
 *
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
Cu.import("resource://exchangecalendar/ecExchangeRequest.js");

Cu.import("resource:///modules/mailServices.js");
Cu.import("resource:///modules/iteratorUtils.jsm");

Cu.import("resource://exchangecalendar/erFindContacts.js");
Cu.import("resource://exchangecalendar/erGetContacts.js");
Cu.import("resource://exchangecalendar/erSyncContactsFolder.js");

Cu.import("resource://exchangecalendar/exchangeAbFunctions.js");

const nsIAP = Ci.nsIActivityProcess;  
const nsIAE = Ci.nsIActivityEvent;  
const nsIAM = Ci.nsIActivityManager;



//
// exchangeAbFolderDirectory
//

function exchangeAbFolderDirectory() {
	exchWebService.commonAbFunctions.logInfo("new exchangeAbFolderDirectory");
	this._isRoot = true;

	this._searchQuery = null;
	this._UUID = "";
	this._schema = null;

	this.prefs = null;
	this.isLoading = false;
	this.findContactsRequest = null;
	this.getContactsRequest = null;

	this.pollTimer = Cc["@mozilla.org/timer;1"]
					.createInstance(Ci.nsITimer);

	this.contacts = {};
	this.distLists = null;
	this.childDirs = {};

	this.syncState = null;
	this.weAreSyncing = false;

	this._isInitialized = false;
}

exchangeAbFolderDirectory.prototype = {

	classID: components.ID("{5963e917-bc68-4b68-b704-65538c81a628}"),
	contractID: "@mozilla.org/addressbook/directory;1?type=exchWebService-contactFolder-directory",
	classDescription: "Exchange 2007/2010 Contacts",

	activityManager : Cc["@mozilla.org/activity-manager;1"].getService(nsIAM),  

	// void getInterfaces(out PRUint32 count, [array, size_is(count), retval] out nsIIDPtr array);
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIAbDirectory,
						Ci.nsIAbItem,
						Ci.nsIAbCollection,
						Ci.nsISupports]),
//                                        Ci.nsIAbDirSearchListener,
//                                        Ci.nsIAbDirectorySearch]),

  /**
   * A universally-unique identifier for this item.
   *
   * If this item cannot be associated with a UUID for some reason, it MUST
   * return the empty string. The empty string MUST NOT be a valid UUID for any
   * item. Under no circumstances may this function throw an error.
   *
   * It is STRONGLY RECOMMENDED that implementations guarantee that this UUID
   * will not change between two different sessions of the application and that,
   * if this item is deleted, the UUID will not be reused.
   *
   * The format of the UUID for a generic nsIAbItem is purposefully left
   * undefined, although any item contained by an nsIAbDirectory SHOULD use
   * nsIAbManager::generateUUID to generate the UUID.
   */
  //readonly attribute AUTF8String uuid;
	get uuid()
	{
		//exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: uuid\n");
		if (this._UUID) {
			return this._UUID;
		}

		return "";
	},

  /**
   * @{
   * These constants reflect the possible values of the
   * mail.addr_book.lastnamefirst preferences. They are intended to be used in
   * generateName, defined below.
   */
   //const unsigned long GENERATE_DISPLAY_NAME = 0;
   //const unsigned long GENERATE_LAST_FIRST_ORDER = 1;
   //const unsigned long GENERATE_FIRST_LAST_ORDER = 2;
   /** @} */

  /** 
   * Generate a name from the item for display purposes.
   *
   * If this item is an nsIAbCard, then it will use the aGenerateFormat option
   * to determine the string to return.
   * If this item is not an nsIAbCard, then the aGenerateFormat option may be
   * ignored, and the displayName of the item returned.
   *
   * @param  aGenerateFormat The format to generate as per the GENERATE_*
   *                         constants above.
   * @param  aBundle         An optional parameter that is a pointer to a string
   *                         bundle that holds:
   *           chrome://messenger/locale/addressbook/addressBook.properties
   *                         If this bundle is not supplied, then the function
   *                         will obtain the bundle itself. If cached by the
   *                         caller and supplied to this function, then
   *                         performance will be improved over many calls.
   * @return                 A string containing the generated name.
   */
  //AString generateName(in long aGenerateFormat,
  //                     [optional] in nsIStringBundle aBundle);
	generateName: function _generateName(aGenerateFormat, aBundle)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: generateName\n");
		return "generateName";
	},

  /**
   * Generate a formatted email address from the card, that can be used for
   * sending emails.
   *
   * @param  aExpandList     If this card is a list, and this parameter is set
   *                         to true, then the list will be expanded to include
   *                         the emails of the cards within the list.
   * @param  aGroupMailLists If this card (or the items within this card) is a
   *                         list, and this is set to true, then the list will
   *                         be expanded in the RFC 2822 group format
   *                         "displayname : email1 ; email2 ; etc".
   * @param  aHeaderParser   An optional parameter pointing to the
   *                         nsIMsgHeaderParser service. If this is not supplied
   *                         the function will obtain the service itself. If
   *                         cached by the called and supplied to this function,
   *                         then performance will be improved over many calls.
   * @return                 A string containing a comma-separated list of
   *                         formatted addresses.
   */
  //AString generateFormattedEmail(in boolean aExpandList,
  //                               in boolean aAsGroupMailLists,
  //                               [optional] in nsIMsgHeaderParser aHeaderParser);
	generateFormattedEmail: function _generateFormattedEmail( aExpandList, aAsGroupMailLists, aHeaderParser)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: generateFormattedEmail\n");
		return "";
	},

  /**
   * Returns true if this collection is read-only.
   */
  //readonly attribute boolean readOnly;
	get readOnly()
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: readOnly\n");
		return true;
	},

  /**
   * Returns true if this collection is accessed over a network connection.
   */
  //readonly attribute boolean isRemote;
	get isRemote()
	{
		//exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: isRemote\n");
		return true;
	},


  /**
   * Returns true if this collection is accessed over a secure connection.
   *
   * If isRemote returns false, then this value MUST be false as well.
   */
  //readonly attribute boolean isSecure;
	get isSecure()
	{
		//exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: isSecure\n");
		return true;
	},


  /** 
   * Returns an address book card for the specified email address if found.
   *
   * If there are multiple cards with the given email address, this method will
   * return one of these cards in an implementation-defined manner.
   *
   * Matching is performed in a case-insensitive manner.
   *
   * This method performs a synchronous operation. If the collection cannot do
   * the search in such a manner, then it should throw NS_ERROR_NOT_IMPLEMENTED.
   *
   * @param  emailAddress The email address to find in any of the email address
   *                      fields. If emailAddress is empty, the database won't
   *                      be searched and the function will return as if no card
   *                      was found.
   * @return              An nsIAbCard if one was found, else returns NULL.
   * @exception NS_ERROR_NOT_IMPLEMENTED If the collection cannot do this.
   */
  //nsIAbCard cardForEmailAddress(in AUTF8String emailAddress);
	cardForEmailAddress: function _cardForEmailAddress(emailAddress)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: cardForEmailAddress");
		return null;
//		throw Cr.NS_ERROR_NOT_IMPLEMENTED;
	},

  /**
   * Returns an address book card for the specified property if found.
   *
   * If there are multiple cards with the given value for the property, this
   * method will return one of these cards in an implementation-defined manner.
   *
   * This method performs a synchronous operation. If the collection cannot do
   * the search in such a manner, then it should throw NS_ERROR_NOT_IMPLEMENTED.
   *
   * If the property is not natively a string, it can still be searched for
   * using the string-encoded value of the property, e.g. "0". See
   * nsIAbCard::getPropertyAsAUTF8String for more information. Empty values will
   * return no match, to prevent spurious results.
   *
   * @param  aProperty      The property to look for.
   * @param  aValue         The value to search for.
   * @param  aCaseSensitive True if matching should be done case-sensitively.
   * @result                An nsIAbCard if one was found, else returns NULL.
   * @exception NS_ERROR_NOT_IMPLEMENTED If the collection cannot do this.
   */
  //nsIAbCard getCardFromProperty(in string aProperty, in AUTF8String aValue,
  //                              in boolean aCaseSensitive);
	getCardFromProperty: function _cardForEmailAddress(aProperty, aValue, aCaseSensitive)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: getCardFromProperty");
		throw Cr.NS_ERROR_NOT_IMPLEMENTED;
	},


  /**
   * Returns all address book cards with a specific property matching value
   *
   * This function is almost identical to getCardFromProperty, with the
   * exception of returning all cards rather than just the first.
   *
   * @param  aProperty      The property to look for.
   * @param  aValue         The value to search for.
   * @param  aCaseSensitive True if matching should be done case-sensitively.
   * @result                A nsISimpleEnumerator that holds nsIAbCard
   *                        instances.
   */
  //nsISimpleEnumerator getCardsFromProperty(in string aProperty,
  //                                         in AUTF8String aValue,
  //                                         in boolean aCaseSensitive);

	getCardsFromProperty: function _getCardsFromProperty(aProperty, aValue, aCaseSensitive)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: getCardsFromProperty");
		var result = [];
		return exchWebService.commonFunctions.CreateSimpleEnumerator(result);
	},


  /**
   * The chrome URI to use for bringing up a dialog to edit this directory.
   * When opening the dialog, use a JS argument of
   * {selectedDirectory: thisdir} where thisdir is this directory that you just
   * got the chrome URI from.
   */
  //readonly attribute ACString propertiesChromeURI;
	get propertiesChromeURI()
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get propertiesChromeURI 1");
		return "chrome://exchangecalendar/content/exchangeContactSettings.xul";
	},

  /**
   * The description of the directory. If this directory is not a mailing list,
   * then setting this attribute will send round a "DirName" update via
   * nsIAddrBookSession.
   */
  //attribute AString dirName;
	get dirName()
	{
		//exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get dirName\n");
		return exchWebService.commonAbFunctions.getDescription(this.uuid);
	},

	set dirName(aValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: set dirName\n");
		exchWebService.commonAbFunctions.setDescription(this.uuid. aValue);
	},

  // XXX This should really be replaced by a QI or something better
  //readonly attribute long dirType;
	get dirType()
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get dirType\n");
		return 2;
	},

  // eliminated a bit more.

  // The filename for address books within this directory.
  //readonly attribute ACString fileName;
	get fileName()
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get fileName\n");
		return "filename";
	},

  // The URI of the address book
  //readonly attribute ACString URI;
	get URI()
	{
		//exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get URI:"+this._URI);
		return this._URI;
	},

  // The position of the directory on the display.
  //readonly attribute long position;
	get position()
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get position\n");
		return 2;
	},

  // will be used for LDAP replication
  //attribute unsigned long lastModifiedDate;
	get lastModifiedDate()
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get lastModifiedDate\n");
		return this._lastModifiedDate;
	},

	set lastModifiedDate(aValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: set lastModifiedDate\n");
		this._lastModifiedDate = aValue;
	},

  // Defines whether this directory is a mail
  // list or not
  //attribute boolean isMailList;
	get isMailList()
	{
		//exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get isMailList\n");
		if (this._isMailList) {
			return this._isMailList;
		}

		return false;
	},

	set isMailList(aValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: set isMailList\n");
		this._isMailList = aValue;
	},

  // Get the children directories
  //readonly attribute nsISimpleEnumerator childNodes;
	get childNodes()
	{
		var result = [];
		return exchWebService.commonFunctions.CreateSimpleEnumerator(result);
	},

  /**
   * Get the cards associated with the directory. This will return the cards
   * associated with the mailing lists too.
   */
  //readonly attribute nsISimpleEnumerator childCards;
	get childCards()
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get childCards");
		return exchWebService.commonFunctions.CreateSimpleObjectEnumerator(this.contacts);
	},

  /**
   * Returns true if this directory represents a query - i.e. the rdf resource
   * was something like moz-abmdbdirectory://abook.mab?....
   */
  //readonly attribute boolean isQuery;
	get isQuery()
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get isQuery");
		if (this._searchQuery) {
			return true;
		}

		return false;
	},

  /**
   * Initializes a directory, pointing to a particular
   * URI
   */
  //void init(in string aURI);
	init: function _init(aURI)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: init. aURI:"+aURI+"\n");
		this._URI = aURI;

		this._Schema = null;
		this._UUID = "";
		this._searchQuery = null;

		if (this._isInitialized) {
			exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: '"+this.dirName+"' is allready initialized");
			return;
		}

		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: this is a childdir:"+aURI);

		if (aURI.indexOf("://") > -1) {
			this._Schema = aURI.substr(0, aURI.indexOf("://"));
			this._UUID = aURI.substr(aURI.indexOf("://")+3);

			if (this._UUID.indexOf("?") > -1) {

				this._searchQuery = this._UUID.substr(this._UUID.indexOf("?")+1);
				
				this._UUID = this._UUID.substr(0, this._UUID.indexOf("?"));

		exchWebService.commonAbFunctions.logInfo("Going to get children of '"+this._Schema+"://"+this._UUID+"'");

				var dir = MailServices.ab.getDirectory(this._Schema+"://"+this._UUID);
				if (dir) {
					this.contacts = exchWebService.commonAbFunctions.filterCardsOnQuery(this._searchQuery, dir.childCards);
					for each(var contact in this.contacts) {
						MailServices.ab.notifyDirectoryItemAdded(this, contact);
					}
				}
				else {
					exchWebService.commonAbFunctions.logInfo("ERROR Folderdirectory '"+this._Schema+"://"+this._UUID+"' does not exist.");
				}

			}
			else {
				// Non query directories we set the refresh timer for
			        let self = this;
				let timerCallback = {
					notify: function setTimeout_notify() {
						self.syncFolder();
					}
				};
				this.prefs = Cc["@mozilla.org/preferences-service;1"]
			            	.getService(Ci.nsIPrefService)
				    	.getBranch("extensions.exchangecontacts@extensions.1st-setup.nl.account."+this._UUID+".");

				this.pollTimer.initWithCallback(timerCallback, exchWebService.commonFunctions.safeGetIntPref(this.prefs, "pollinterval", 300, true) * 1000, this.pollTimer.TYPE_REPEATING_SLACK);

				this.loadContactsFromExchange();
			}


		}
		else {
			// ERROR
			exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: exchangeAbFolderDirectory.init: WE GOT TO A POINT WERE WE NEVER SHOULD GET TO.");
		}

		this._isInitialized = true;
	},

  // Deletes either a mailing list or a top
  // level directory, which also updates the
  // preferences
  //void deleteDirectory(in nsIAbDirectory directory);
	deleteDirectory: function _deleteDirectory(directory)
	{
		// We cannot remove the root.
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: deleteDirectory this:"+this.URI+", directory:"+directory.URI+"\n");

		//exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: deleteDirectory uri:"+directory.URI+"\n");
	},

  // Check if directory contains card
  // If the implementation is asynchronous the card
  // may not yet have arrived. If it is in the process
  // of obtaining cards the method will throw an
  // NS_ERROR_NOT_AVAILABLE exception if the card
  // cannot be found.
  //boolean hasCard(in nsIAbCard cards);
	hasCard: function _hasCard(cards)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: hasCard\n");
		return false;
	},


  // Check if directory contains directory
  //boolean hasDirectory(in nsIAbDirectory dir);
	hasDirectory: function _hasDirectory(dir)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: hasDirectory\n");

		return false;
	},

  /**
   * Adds a card to the database.
   *
   * This card does not need to be of the same type as the database, e.g., one
   * can add an nsIAbLDAPCard to an nsIAbMDBDirectory.
   *
   * @return "Real" card (eg nsIAbLDAPCard) that can be used for some
   *         extra functions.
   */
  //nsIAbCard addCard(in nsIAbCard card);
	addCard: function _addCard(card)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: addCard\n");
		return null;
	},

  /**
   * Modifies a card in the database to match that supplied.
   */
  //void modifyCard(in nsIAbCard modifiedCard);
	modifyCard: function _modifyCard(modifiedCard)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: modifyCard\n");
	},

  /**
   * Deletes the array of cards from the database.
   *
   * @param  aCards  The cards to delete from the database.
   */
  //void deleteCards(in nsIArray aCards);
	deleteCards: function _deleteCards(aCards)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: deleteCards\n");
	},

  //void dropCard(in nsIAbCard card, in boolean needToCopyCard);
	dropCard: function _dropCard(Card, needToCopyCard)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: dropCard\n");
	},

  /**
   * Whether or not the directory should be searched when doing autocomplete,
   * (currently by using GetChildCards); LDAP does not support this in online
   * mode, so that should return false; additionally any other directory types
   * that also do not support GetChildCards should return false.
   *
   * @param aIdentity  An optional parameter detailing the identity key (see
   *                   nsIMsgAccountManager) that this autocomplete is being
   *                   run against.
   * @return           True if this directory should/can be used during
   *                   local autocomplete.
   */
  //boolean useForAutocomplete(in ACString aIdentityKey);
	useForAutocomplete: function _useForAutocomplete(aIdentityKey)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: useForAutocomplete\n");

		return true;

//		return true;
	},

  /** 
   * Does this directory support mailing lists? Note that in the case
   * this directory is a mailing list and nested mailing lists are not
   * supported, this will return false rather than true which the parent
   * directory might.
   */
  //readonly attribute boolean supportsMailingLists;
	get supportsMailingLists()
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get supportsMailingLists\n");
		return true;
	},

  /**
   * This attribute serves two purposes
   *  1. If this directory is not a mail list, directories are stored here
   *  2. If it is a mail list card entries are stored here
   *
   * @note This is a *live* array and not a static copy
   */
  //attribute nsIMutableArray addressLists
	get addressLists()
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get addressLists\n");
		return this._addressLists;
	},

	set addressLists(aValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: set addressLists\n");
		this._addressLists = aValue;
	},

  // Specific to a directory which stores mail lists

  /**
   * Creates a new mailing list in the directory. Currently only supported 
   * for top-level directories.
   *
   * @param  list  The new mailing list to add.
   * @return The mailing list directory added, which may have been modified.
   */
  //nsIAbDirectory addMailList(in nsIAbDirectory list);
	addMailList: function _addMailList(list)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: addMailList\n");
		return list;
	},

  /**
   * Nick Name of the mailing list. This attribute is only really used when
   * the nsIAbDirectory represents a mailing list.
   */
  //attribute AString listNickName;
	get listNickName()
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get listNickName\n");
		return this._listNickName;
	},

	set listNickName(aValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: set listNickName\n");
		this._listNickName = aValue;
	},

  /**
   * Description of the mailing list. This attribute is only really used when
   * the nsIAbDirectory represents a mailing list.
   */
  //attribute AString description;
	get description()
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get description\n");
		return this._description;
	},

	set description(aValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: set description\n");
		this._description = aValue;
	},

  /**
   * Edits an existing mailing list (specified as listCard) into its parent
   * directory. You should call this function on the resource with the same
   * uri as the listCard.
   *
   * @param  listCard  A nsIAbCard version of the mailing list with the new
   *                   values.
   */
  //void editMailListToDatabase(in nsIAbCard listCard);
	editMailListToDatabase: function _editMailListToDatabase(listCard)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: editMailListToDatabase\n");
	},

  // Copies mail list properties from the srcList
  //void copyMailList(in nsIAbDirectory srcList);
	copyMailList: function _copyMailList(srcList)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: copyMailList\n");
	},


  /**
   * Only creates a top level address book
   * which is stored in the preferences
   *
   * Need to change to factory based approach
   * to create new address books
   *
   * This method should become redundant or 
   * be only associated with card folders
   *
   * The parameters are the same as for
   * nsIAbManager::newAddressBook
   */
  //ACString createNewDirectory(in AString aDirName, in ACString aURI,
  //                            in unsigned long aType, in ACString aPrefName);
	createNewDirectory: function _createNewDirectory(aDirName, aURI, aType, aPrefName)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: createNewDirectory uuid:"+this.uuid+"\n");
		return "createNewDirectory";
	},


  /* create a directory by passing the display name and address book uri */
  //void createDirectoryByURI(in AString displayName, in ACString aURI);
	createDirectoryByURI: function _createDirectoryByURI(displayName, aURI)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: createDirectoryByURI uuid:"+this.uuid+"\n");
	},
  /**
   * The id of the directory used in prefs e.g. "ldap_2.servers.pab"
   * Setting this will cause directoryPrefs to be updated.
   */
  //attribute ACString dirPrefId;
	get dirPrefId()
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: get dirPrefId: "+this.uuid);
		return this._dirPrefId;
	},

	set dirPrefId(aValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: set dirPrefId\n");
		this._dirPrefId = aValue;
	},
  /**
   * @name  getXXXValue
   *
   * Helper functions to get different types of pref, but return a default
   * value if a pref value was not obtained.
   *
   * @param aName         The name of the pref within the branch dirPrefId to
   *                      get a value from.
   *
   * @param aDefaultValue The default value to return if getting the pref fails
   *                      or the pref is not present.
   *
   * @return              The value of the pref or the default value.
   *
   * @exception           NS_ERROR_NOT_INITIALIZED if the pref branch couldn't
   *                      be obtained (e.g. dirPrefId isn't set).
   */
  //@{
  //long getIntValue(in string aName, in long aDefaultValue);
	getIntValue: function _getIntValue(aName, aDefaultValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: getIntValue\n");
		return aDefaultValue;
	},

  //boolean getBoolValue(in string aName, in boolean aDefaultValue);
	getBoolValue: function _getBoolValue(aName, aDefaultValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: getBoolValue\n");
		return aDefaultValue;
	},

  //ACString getStringValue(in string aName, in ACString aDefaultValue);
	getStringValue: function _getStringValue(aName, aDefaultValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: getStringValue\n");
		return aDefaultValue;
	},

  //AUTF8String getLocalizedStringValue(in string aName, in AUTF8String aDefaultValue);
	getLocalizedStringValue: function _getLocalizedStringValue(aName, aDefaultValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: getLocalizedStringValue\n");
		return aDefaultValue;
	},

  //@}

  /**
   * The following attributes are read from an nsIAbDirectory via the above methods:
   *
   * HidesRecipients (Boolean)
   *    If true, and this nsIAbDirectory is a mailing list, then when sending mail to
   *    this list, recipients addresses will be hidden from one another by sending
   *    via BCC.
   */

  /**
   * @name  setXXXValue
   *
   * Helper functions to set different types of pref values.
   *
   * @param aName         The name of the pref within the branch dirPrefId to
   *                      get a value from.
   *
   * @param aValue        The value to set the pref to.
   *
   * @exception           NS_ERROR_NOT_INITIALIZED if the pref branch couldn't
   *                      be obtained (e.g. dirPrefId isn't set).
   */
  //@{
  //void setIntValue(in string aName, in long aValue);
	setIntValue: function _setIntValue(aName, aValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: setIntValue\n");
	},

  //void setBoolValue(in string aName, in boolean aValue);
	setBoolValue: function _setBoolValue(aName, aValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: setBoolValue\n");
	},

  //void setStringValue(in string aName, in ACString aValue);
	setStringValue: function _setStringValue(aName, aValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: setStringValue\n");
	},

  //void setLocalizedStringValue(in string aName, in AUTF8String aValue);
	setLocalizedStringValue: function _setLocalizedStringValue(aName, aValue)
	{
		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: setLocalizedStringValue\n");
	},

  //@}

	get user() {
		return this.domain+"\\"+exchWebService.commonFunctions.safeGetCharPref(this.prefs, "user", "");
	},

	set user(value) {
		if (value.indexOf("\\") > -1) {
			this.domain = value.substr(0,value.indexOf("\\"));
			this.prefs.setCharPref("user", value.substr(value.indexOf("\\")+1));
		}
		else {
			this.prefs.setCharPref("user", value);
		}
	},

	get domain() {
		return exchWebService.commonFunctions.safeGetCharPref(this.prefs, "domain", "");
	},

	set domain(value) {
		return this.prefs.setCharPref("domain", value);
	},

	get mailbox() {
		return exchWebService.commonFunctions.safeGetCharPref(this.prefs, "mailbox", "");
	},

	get serverUrl() {
		return exchWebService.commonFunctions.safeGetCharPref(this.prefs, "server", "");
	},

	get folderBase() {
		return exchWebService.commonFunctions.safeGetCharPref(this.prefs, "folderbase", "contacts");
	},

	get folderPath() {
		return exchWebService.commonFunctions.safeGetCharPref(this.prefs, "folderpath", "/");
	},

	get folderID() {
		return exchWebService.commonFunctions.safeGetCharPref(this.prefs, "folderid", null);
	},

	set folderID(aValue) {
		this.prefs.setCharPref("folderid", aValue);
	},

	get changeKey() {
		return exchWebService.commonFunctions.safeGetCharPref(this.prefs, "changekey", null);
	},

	set changeKey(aValue) {
		this.prefs.setCharPref("changekey", aValue);
	},

	saveCredentials: function _saveCredentials(aCredentials)
	{
		if (aCredentials) {
			if ((aCredentials.user != "") && (aCredentials.user != "\\") && (aCredentials.user != "/")) {
				this.user = aCredentials.user;
			}
		}
	},

	loadContactsFromExchange: function _loadContactsFromExchange()
	{
		if (this.isLoading) {
			return;
		}

		this.isLoading = true;

		var self = this;

		this.findContactsRequest = new erFindContactsRequest(
						{user: this.user, 
						 mailbox: this.mailbox,
						 folderBase: this.folderBase,
						 serverUrl: this.serverUrl,
						 folderID: this.folderID,
						 changeKey: this.changeKey,
				 		 actionStart: Date.now()},
						function(erFindContactsRequest, aContacts, aDistLists) { self.contactsFoundOk(erFindContactsRequest, aContacts, aDistLists);}, 
						function(erFindContactsRequest, aCode, aMsg) { self.contactsFindError(erFindContactsRequest, aCode, aMsg);},
						null);

	},

	ecUpdateCard: function _ecUpdateCard(contact)
	{
			var newCard = Cc["@mozilla.org/addressbook/cardproperty;1"]
				.createInstance(Ci.nsIAbCard);
	
			newCard.directoryId = this.uuid;
			newCard.localId = contact.getAttributeByTag("t:ItemId", "Id");
			newCard.setProperty("X-ChangeKey", contact.getAttributeByTag("t:ItemId", "ChangeKey", ""));
			newCard.setProperty("DisplayName", contact.getTagValue("t:DisplayName", ""));
			newCard.setProperty("FirstName", contact.getTagValue("t:GivenName", ""));
			newCard.setProperty("LastName", contact.getTagValue("t:Surname", ""));
			newCard.setProperty("PrimaryEmail", contact.getTagValueByXPath('/t:EmailAddresses/t:Entry[@Key="EmailAddress1"]', ""));
			newCard.setProperty("SecondEmail", contact.getTagValueByXPath('/t:EmailAddresses/t:Entry[@Key="EmailAddress2"]', ""));

			newCard.setProperty("JobTitle", contact.getTagValue("t:JobTitle", ""));
			newCard.setProperty("Department", contact.getTagValue("t:Department", ""));
			newCard.setProperty("Company", contact.getTagValue("t:CompanyName", ""));

			newCard.setProperty("HomePhone", contact.getTagValueByXPath('/t:PhoneNumbers/t:Entry[@Key="HomePhone"]', ""));

			newCard.setProperty("WorkPhone", contact.getTagValueByXPath('/t:PhoneNumbers/t:Entry[@Key="BusinessPhone"]', ""));
			newCard.setProperty("WorkPhone2", contact.getTagValueByXPath('/t:PhoneNumbers/t:Entry[@Key="BusinessPhone2"]', ""));
			newCard.setProperty("CellularNumber", contact.getTagValueByXPath('/t:PhoneNumbers/t:Entry[@Key="MobilePhone"]', ""));
			newCard.setProperty("PagerNumber", contact.getTagValueByXPath('/t:PhoneNumbers/t:Entry[@Key="Pager"]', ""));
			newCard.setProperty("FaxNumber", contact.getTagValueByXPath('/t:PhoneNumbers/t:Entry[@Key="Telex"]', ""));

			var homeDetails = contact.XPath('/t:PhysicalAddresses/t:Entry[@Key="Home"]');
			if (homeDetails.length > 0) {
				newCard.setProperty("HomeAddress", homeDetails[0].getTagValue('t:Street', ""));
				newCard.setProperty("HomeCity", homeDetails[0].getTagValue('t:City', ""));
				newCard.setProperty("HomeState", homeDetails[0].getTagValue('t:State', ""));
				newCard.setProperty("HomeCountry", homeDetails[0].getTagValue('t:CountryOrRegion', ""));
				newCard.setProperty("HomeZipCode", homeDetails[0].getTagValue('t:PostalCode', ""));
			}

			var workDetails = contact.XPath('/t:PhysicalAddresses/t:Entry[@Key="Business"]');
			if (workDetails.length > 0) {
				newCard.setProperty("WorkAddress", workDetails[0].getTagValue('t:Street', ""));
				newCard.setProperty("WorkCity", workDetails[0].getTagValue('t:City', ""));
				newCard.setProperty("WorkState", workDetails[0].getTagValue('t:State', ""));
				newCard.setProperty("WorkCountry", workDetails[0].getTagValue('t:CountryOrRegion', ""));
				newCard.setProperty("WorkZipCode", workDetails[0].getTagValue('t:PostalCode', ""));
			}

			var otherDetails = contact.XPath('/t:PhysicalAddresses/t:Entry[@Key="Other"]');
			if (otherDetails.length > 0) {
				newCard.setProperty("OtherAddress", workDetails[0].getTagValue('t:Street', ""));
				newCard.setProperty("OtherCity", workDetails[0].getTagValue('t:City', ""));
				newCard.setProperty("OtherState", workDetails[0].getTagValue('t:State', ""));
				newCard.setProperty("OtherCountry", workDetails[0].getTagValue('t:CountryOrRegion', ""));
				newCard.setProperty("OtherZipCode", workDetails[0].getTagValue('t:PostalCode', ""));
			}

			newCard.setProperty("_AimScreenName", contact.getTagValueByXPath('/t:ImAddresses/t:Entry[@Key="ImAddress"]', ""));
			newCard.setProperty("WebPage1", contact.getTagValue("t:BusinessHomePage", ""));

			newCard.setProperty("Notes", contact.getTagValue("t:Body", ""));

			var birthDay = contact.getTagValue("t:Birthday");

			if (birthDay) {
				newCard.setProperty("BirthYear", birthDay.substr(0,4));
				newCard.setProperty("BirthMonth", birthDay.substr(5,2));
				newCard.setProperty("BirthDay", birthDay.substr(8,2));
			}


			if (this.contacts[newCard.localId]) {
				exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory:  == We allready know this card. Lets see what has changed");

				// Check which properties changed.
				for (var cardProperty in fixIterator(newCard.properties, Ci.nsIProperty)) {
					if (cardProperty.name) {
						try {
							var oldValue = this.contacts[newCard.localId].getProperty(cardProperty.name, "");
							var newValue = cardProperty.value;
							if ( oldValue != newValue) {
								// And existing property has changed.
								exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: --Property Changed name:"+cardProperty.name+", oldvalue:"+oldValue+", newValue:"+newValue);
								this.contacts[newCard.localId].setProperty(cardProperty.name, newValue);
								MailServices.ab.notifyItemPropertyChanged(this.contacts[newCard.localId],
				                                 cardProperty.name,
				                                 oldValue,
				                                 newValue);
							}
						}
						catch(err) {
							// We have a new property which was not set in the previous state. Add it
							exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory:  == Err:"+err);
							exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: --Property added name:"+cardProperty.name+", value:"+cardProperty.value);
							this.contacts[newCard.localId].setProperty(cardProperty.name, cardProperty.value);
							MailServices.ab.notifyItemPropertyChanged(this.contacts[newCard.localId],
			                                 cardProperty.name,
			                                 null,
			                                 newValue);
						}
					}
				}

				// We check if properties were removed.
				for (var cardProperty in fixIterator(this.contacts[newCard.localId].properties, Ci.nsIProperty)) {
					if (cardProperty.name) {
						var oldValue = cardProperty.value; 
						try {
							var newValue = newCard.getProperty(cardProperty.name, "");
							
							if ( oldValue != newValue) {
								// If we get here something went wrong before this call.
							}
						}
						catch(err) {
							// Property is not available in new state. We have to remove it.
							exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: --Property removed name:"+cardProperty.name+", value:"+cardProperty.value);
							this.contacts[newCard.localId].deleteProperty(cardProperty.name);
							MailServices.ab.notifyItemPropertyChanged(this.contacts[newCard.localId],
			                                 cardProperty.name,
			                                 oldValue,
			                                 null);
						}
					}
				}
			}
			else {
				exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory:  || This card is new. We do not know it yet.");
				this.contacts[newCard.localId] = newCard;
				MailServices.ab.notifyDirectoryItemAdded(this, newCard);
			}
	
			exchWebService.commonAbFunctions.logInfo(this.uuid+": newCard.localId:"+newCard.localId);		
	},

	contactsFoundOk: function _contactsFoundOk(erFindContactsRequest, aContacts, aDistLists)
	{
		this.saveCredentials(erFindContactsRequest.argument);

		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: contactsFoundOk: contacts:"+aContacts.length+", distributionlists:"+aDistLists.length);

		if (aContacts.length > 0) {
			var self = this;
			this.getContactsRequest = new erGetContactsRequest(
							{user: this.user, 
							 mailbox: this.mailbox,
							 folderBase: this.folderBase,
							 serverUrl: this.serverUrl,
							 folderID: this.folderID,
							 changeKey: this.changeKey,
							 ids: aContacts,
					 		 actionStart: Date.now()},
							function(erGetContactsRequest, aContacts) { self.contactsLoadOk(erGetContactsRequest, aContacts);}, 
							function(erGetContactsRequest, aCode, aMsg) { self.contactsFindError(erGetContactsRequest, aCode, aMsg);},
							null);
		}

/*		for each(var contact in aContacts) {
			exchWebService.commonAbFunctions.logInfo("Contact card:"+contact.toString(),2);
			exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: new childCards:"+contact.nsTypes::Subject.toString());//+String(contact));
			this.ecUpdateCard(contact);

		}*/

		//this.distLists = aDistLists.slice();

//		this.isLoading = false;

	},

	contactsFindError: function _contactsFindError(erFindContactsRequest, aCode, aMsg)
	{
		this.saveCredentials(erFindContactsRequest.argument);
		this.isLoading = false;
	},

	contactsLoadOk: function _contactsLoadOk(erGetContactsRequest, aContacts)
	{
		this.saveCredentials(erGetContactsRequest.argument);

		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: contactsLoadOk: contacts:"+aContacts.length);

		for each(var contact in aContacts) {
			exchWebService.commonAbFunctions.logInfo("Contact card:"+contact.toString(),2);
			exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: new childCards:"+contact.getTagValue("t:Subject"));//+String(contact));
			this.ecUpdateCard(contact);

		}

		this.isLoading = false;

	},

	syncFolder: function _syncFolder()
	{
		if ((this.weAreSyncing) || (this.isLoading)) {
			return;
		}

		this.weAreSyncing = true;
		var self = this;

		var tmpObject = new erSyncContactsFolderRequest(
			{user: this.user, 
			 mailbox: this.mailbox,
			 serverUrl: this.serverUrl,
			 folderBase: this.folderBase,
			 folderID: this.folderID,
			 changeKey: this.changeKey,
			 syncState: this.syncState,
			 actionStart: Date.now() }, 
			function(erSyncContactsFolderRequest, creations, updates, deletions, syncState) { self.syncFolderOK(erSyncContactsFolderRequest, creations, updates, deletions, syncState);}, 
			function(erSyncContactsFolderRequest, aCode, aMsg) { self.syncFolderError(erSyncContactsFolderRequest, aCode, aMsg);},
			null);
	},

	syncFolderOK: function _syncFolderOK(erSyncContactsFolderRequest, creations, updates, deletions, syncState)
	{
		//exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: syncFolderOK "+ this.dirName);
		this.saveCredentials(erSyncContactsFolderRequest.argument);

		if ((creations.contacts.length > 0) || (updates.contacts.length > 0) || (deletions.contacts.length > 0)) {
			this.addActivity(exchWebService.commonFunctions.getString("ExchangeContacts","syncFolderEventMessage",[creations.contacts.length, updates.contacts.length, deletions.contacts.length, this.dirName],"exchangecalendar"), "", erSyncContactsFolderRequest.argument.actionStart, Date.now())
			exchWebService.commonAbFunctions.logInfo(exchWebService.commonFunctions.getString("ExchangeContacts","syncFolderEventMessage",[creations.contacts.length, updates.contacts.length, deletions.contacts.length, this.dirName],"exchangecalendar"));
		}

		var newCards = [];
		for each(var newCard in creations.contacts) {
			exchWebService.commonAbFunctions.logInfo("New Contact card:"+newCard.toString(),2);
			newCards.push(newCard)
			//this.ecUpdateCard(newCard);
		}

		for each(var updatedCard in updates.contacts) {
			exchWebService.commonAbFunctions.logInfo("Updated Contact card:"+updatedCard.toString(),2);
			newCards.push(updatedCard)
			//this.ecUpdateCard(updatedCard);
		}
		
		if (newCards.length > 0) {
			var self = this;
			this.getContactsRequest = new erGetContactsRequest(
							{user: this.user, 
							 mailbox: this.mailbox,
							 folderBase: this.folderBase,
							 serverUrl: this.serverUrl,
							 folderID: this.folderID,
							 changeKey: this.changeKey,
							 ids: newCards,
					 		 actionStart: Date.now()},
							function(erGetContactsRequest, aContacts) { self.contactsLoadOk2(erGetContactsRequest, aContacts);}, 
							function(erGetContactsRequest, aCode, aMsg) { self.contactsFindError(erGetContactsRequest, aCode, aMsg);},
							null);
		}
	
		for each(var deletedCard in deletions.contacts) {
			exchWebService.commonAbFunctions.logInfo("Deleted Contact card:"+deletedCard.toString(),2);
			if (this.contacts[deletedCard.getAttributeByTag("t:ItemId", "Id")]) {
				MailServices.ab.notifyDirectoryItemDeleted(this, this.contacts[deletedCard.getAttributeByTag("t:ItemId", "Id")]);
				delete this.contacts[deletedCard.getAttributeByTag("t:ItemId", "Id")];
			}
		}

		this.syncState = syncState;

		if (newCards.length == 0) {
			this.weAreSyncing = false;
		}
	},

	syncFolderError: function _syncFolderError(erSyncContactsFolderRequest, aCode, aMsg)
	{
		this.saveCredentials(erSyncContactsFolderRequest.argument);

		this.weAreSyncing = false;
	},

	contactsLoadOk2: function _contactsLoadOk2(erGetContactsRequest, aContacts)
	{
		this.saveCredentials(erGetContactsRequest.argument);

		exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: contactsLoadOk2: contacts:"+aContacts.length);

		for each(var contact in aContacts) {
			exchWebService.commonAbFunctions.logInfo("Contact card:"+contact.toString(),2);
			exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: new childCards:"+contact.getTagValue("t:Subject"));
			this.ecUpdateCard(contact);

		}

		this.weAreSyncing = false;

	},

	addActivity: function _addActivity(aTitle, aText, aStartDate, aEndDate)
	{
		let event = Cc["@mozilla.org/activity-event;1"].createInstance(nsIAE);  
  
		event.init(aTitle,  
		           null,   
		           aText,   
		           aStartDate,     
		           aEndDate);          
  
		this.activityManager.addActivity(event);
	},

};


function NSGetFactory(cid) {

	exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: NSGetFactory for exchangeAbFolderDirectory 1");
	try {
		if (!NSGetFactory.exchWebService_ab4) {
			exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: NSGetFactory for exchangeAbFolderDirectory 1a");

			NSGetFactory.exchWebService_ab4 = XPCOMUtils.generateNSGetFactory([exchangeAbFolderDirectory]);
	}

	} catch(e) {
		Components.utils.reportError(e);
		exchWebService.commonAbFunctions.logInfo(e);
		throw e;
	}

	exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: NSGetFactory for exchangeAbFolderDirectory 2");
	return NSGetFactory.exchWebService_ab4(cid);
}

exchWebService.commonAbFunctions.logInfo("exchangeAbFolderDirectory: init.");

