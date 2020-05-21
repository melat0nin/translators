{
    "translatorID": "c04c2288-afbe-4d7b-b419-69e72ac8e9f5",
    "label": "Roam JSON",
    "creator": "Laurence Diver",
    "target": "json",
    "minVersion": "5.0",
    "maxVersion": "",
    "priority": 25,
    "configOptions": {"getCollections": true},
    "displayOptions": {"exportNotes": true},
    "inRepository": false,
    "translatorType": 2,
    "lastUpdated": "2020-05-21 00:09:00"
}

function cleanHtml(html) {
    // TODO this is hacky as all hell
    var cleanhtml = html.replace('<strong>', '**')
        .replace('</strong>', '**')
        .replace("<em>", "__")
        .replace("</em>", "__")
        .replace("<blockquote>", "> ")
        .replace("<u>", "^^")
        .replace("</u>", "^^"); // Convert styles to markdown
    // TODO ZU.parseMarkup to find anchor tags? https://github.com/zotero/zotero/blob/4.0/chrome/content/zotero/xpcom/utilities.js#L525
    cleanhtml = cleanhtml.replace(/([^+>]*)[^<]*(<a [^>]*(href="([^>^\"]*)")[^>]*>)([^<]+)(<\/a>[)])/gi, "$1___$2 ([$5]($4))"); // Convert anchors to markdown
    cleanhtml = cleanhtml.replace(/<[^>]*>?/gm, ""); // Strip remaining tags
    // TODO retain soft linebreaks within the paragraph
    return cleanhtml;
}

/* Get collections object */
function get1Collections() {
    var collections = [];
    while (collection = Zotero.nextCollection()) { // First grab all the collections
        // collections[collection.primary.key] = {};
        // collections[collection.primary.key].parentKey = collection.fields.parentKey;
        // collections[collection.primary.key].title = collection.fields.name;
        // collections[collection.primary.key].articles = {};
        // collections[collection.primary.key].collections = {};
        collections.push(collection);
        //collectionKeys.push(collection.primary.key);
    }

    return collections;
}

function getCollectionName(id) {
    var collections = getCollections();
    return collections[id].name;
}

function getTopics(item) {
    var itemCollections = item.collections,
        collectionTitlesArray = [],
        collectionTitle, collectionTitles;
    for (const collection of itemCollections) {
        collectionTitle = getCollectionName(collection);
        collectionTitlesArray.push(collectionTitle);
    }
    collectionTitles = collectionTitlesArray.join(", ");
    return collectionTitles;
}

function getItemType(item) {
    var zoteroType = item.itemType, type;
    // Adapted from Zotero RDF translator -- https://github.com/zotero/translators/blob/master/Zotero%20RDF.js
    if (item.url && ( item.url.includes("arxiv") || item.url.includes("ssrn") ) ) {
        type = "Preprint";
    } else if (zoteroType == "book") {
		type = "Book";
	} else if (zoteroType == "bookSection") {
		type = "Chapter";
	} else if (zoteroType == "journalArticle") {
		type = "Article";
	} else if (zoteroType == "magazineArticle") {
		type = "Magazine article";
	} else if (zoteroType == "newspaperArticle") {
		type = "Newspaper article";
	} else if (zoteroType == "thesis") {
		type = "Thesis";
	} else if (zoteroType == "letter") {
		type = "Letter";
	} else if (zoteroType == "manuscript") {
		type = "Manuscript";
	} else if (zoteroType == "interview") {
		type = "Interview";
	} else if (zoteroType == "film") {
		type = "Film";
	} else if (zoteroType == "artwork") {
		type = "Illustration";
	} else if (zoteroType == "webpage") {
		type = "Webpage";
	} else if (zoteroType == "report") {
        type = "Report";
	} else if (zoteroType == "bill") {
		type = "Legislation";
	} else if (zoteroType == "case") {
		type = "Legal case";
	} else if (zoteroType == "hearing") {
		type = "Hearing";
	} else if (zoteroType == "patent") {
		type = "Patent";
	} else if (zoteroType == "statute") {
		type = "Legislation";
	} else if (zoteroType == "email") {
		type = "Letter";
	} else if (zoteroType == "map") {
		type = "Image";
	} else if (zoteroType == "blogPost") {
		type = "Blog post";
	} else if (zoteroType == "instantMessage") {
		type = "Instant message";
	} else if (zoteroType == "forumPost") {
		type = "Forum post";
	} else if (zoteroType == "audioRecording") {
		type = "Recording";
	} else if (zoteroType == "presentation") {
		type = "Presentation";
	} else if (zoteroType == "videoRecording") {
		type = "Recording";
	} else if (zoteroType == "tvBroadcast") {
		type = "TV broadcast";
	} else if (zoteroType == "radioBroadcast") {
		type = "Radio broadcast";
	} else if (zoteroType == "podcast") {
		type = "Podcast";
	} else if (zoteroType == "computerProgram") {
		type = "Data";
	} else if (zoteroType == "encyclopediaArticle") {
		type = "Encyclopaedia article";
	} else if (zoteroType == "conferencePaper") {
		type = "Conference paper";
	}
    return type;
}

function getAuthors(item) {
    var creators = item.creators, authorsArray = [], authorsString;
    for (const author of creators) {
        if (author.creatorType == "author") {
            var authString = "";
            if (author.firstName) authString += author.firstName;
            if (author.lastName) authString += " " + author.lastName;
            authString = "[[" + ZU.trim(authString) + "]]";
            authorsArray.push(authString);
        }
    }
    authorsString = authorsArray.join(", ");
    return authorsString;
}

function getMetadata(item) {
    var metadata = {},
        itemAuthors = [];
    metadata.string = "**Metadata**";
    metadata.children = [];
    if (typeof item.creators[0] === "object") {
        metadata.children.push({
            "string": "Author(s):: " + getAuthors(item)
        });
    }
    metadata.children.push({
        "string": "Topics:: " + item.collections.toString()
    });
    metadata.children.push({
        "string": "Type:: [[" + getItemType(item) + "]]"
    });
    if (item.date) {
        metadata.children.push({
            "string": "Date:: " + ZU.strToISO(item.date)
        });
    }
    if (item.url) {
        metadata.children.push({
            "string": "URL:: [" + item.url + "](" + item.url + ")"
        });
    }
    if (item.tags) {
        metadata.children.push({
            "string": "Tags:: " + item.tags.map(o => "#[[" + o.tag + "]]").join(", ")
        });
    }
    return metadata;
}

function getNotes(item) {
    // TODO - headings, separate notes, summary note
    var notes = {};
    notes.string = "**Notes**";
    notes.children = [];

    for (const note of item.notes) {
        var parasArray = note.note.split("\n"), // Convert linebreaks to individual nodes
            thisNoteObj = {},
            noteArray = [];
        thisNoteObj.string = cleanHtml(parasArray[0]); // Take first line as note's heading
        for (const para of parasArray) {
            noteArray.push({
                "string": cleanHtml(para)
            });
        }
        noteArray.splice(0, 1); // Don't repeat the first line (been used as heading)
        thisNoteObj.children = noteArray;
        notes.children.push(thisNoteObj);
    }
    return notes;
}

function doExport() {

    var item, exportData = [];
    while (item = Zotero.nextItem()) {

        //Z.debug(ZU.varDump(item.getCollections()));



        var roamItem = {}, itemChildren = [];
        roamItem.title = item.title;
        var metadata = getMetadata(item); // Get item metadata
        itemChildren.push(metadata);
        if (Zotero.getOption("exportNotes")) { // Get notes if requested
            var notes = getNotes(item);
            itemChildren.push(notes);
        }
        roamItem.children = itemChildren;
        //roamItem["edit-time"] = Date.parse(item.dateModified)/1000;
        exportData.push(roamItem);
    }
    Zotero.write(JSON.stringify(exportData, null, "\t"));




    /*

        articles = getArticles();



        // Add articles to their respective collection(s)
        for (var key in articles) {
            if (!articles.hasOwnProperty(key)) continue; // skip loop if the property is from prototype
            var article = articles[key];
            var artCollections = article.collections;
            for (var i = 0; i < artCollections.length; i++) { // Loop collection keys this article is in
                var collectionKey = artCollections[i]; // Current collection key
                if (typeof collections[collectionKey] != 'undefined' && collections[collectionKey] instanceof Object) {
                    collections[collectionKey].articles[key] = article;
                }
            }
        }

        // Nest child collections
        var nestedCollections = new Array();
        for (var key in collections) {
            if (!collections.hasOwnProperty(key)) continue; // skip loop if the property is from prototype
            var collection = collections[key];
            if (collectionKeys.indexOf(collection.parentKey) > -1) { // If a collection's parent isn't the root
                collections[collection.parentKey].collections[key] = collection; // Nest this collection in its parent
                nestedCollections.push(key);
            }
        }
        for (var i = 0; i < nestedCollections.length; i++) { // Delete nested collections from root level (they've been nested)
            delete collections[nestedCollections[i]];
        }

        // Output
        Z.write(JSON.stringify(collections, null, 4));
    */
}
