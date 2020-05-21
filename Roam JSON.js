{
    "translatorID": "c04c2288-afbe-4d7b-b419-69e72ac8e9f5",
    "label": "Roam JSON",
    "creator": "Laurence Diver",
    "target": "json",
    "minVersion": "5.0",
    "maxVersion": "",
    "priority": 25,
    "configOptions": {
        "getCollections": "true"
    },
    "inRepository": false,
    "translatorType": 2,
    "lastUpdated": "2020-05-21 00:07:00"
}

function cleanHtml(html) {
    // TODO this is hacky as all hell
    var cleanhtml = html.replace('<strong>', '**')
        .replace('</strong>', '**')
        .replace("<em>", "__")
        .replace("</em>", "__")
        .replace("<blockquote>", "> ")
        .replace("<u>", "**")
        .replace("</u>", "**"); // Convert styles to markdown
    cleanhtml = cleanhtml.replace(/([^+>]*)[^<]*(<a [^>]*(href="([^>^\"]*)")[^>]*>)([^<]+)(<\/a>[)])/gi, "$1___$2 ([$5]($4))"); // Convert anchors to markdown
    cleanhtml = cleanhtml.replace(/<[^>]*>?/gm, ''); // Strip remaining tags
    return cleanhtml;
}

/* Get collections object */
function getCollections() {
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

function getMetadata(item) {
    var metadata = {},
        itemAuthors = [];
    metadata.string = "**Metadata**";
    metadata.children = [];
    metadata.children.push({
        "string": "Author:: " + item.creators.map(o => "[[" + o.firstName + " " + o.lastName + "]]").join(", ")
    });
    metadata.children.push({
        "string": "Topics:: " + item.collections.toString()
    });
    metadata.children.push({
        "string": "Type:: [[" + item.itemType + "]]"
    });
    metadata.children.push({
        "string": "Date:: " + item.date
    });
    metadata.children.push({
        "string": "URL:: [" + item.url + "](" + item.url + ")"
    });
    metadata.children.push({
        "string": "Tags:: " + item.tags.map(o => o.tag).join(", ")
    });
    return metadata;
}

function getNotes(item) {
    // TODO - headings, separate notes, summary note
    var notes = {};
    notes.string = "**Notes**";
    notes.children = [];

    for (const note of item.notes) {
        // put child part here to group the same paras under one note heading
        var parasArray = note.note.split("\n"),
            thisNoteObj = {},
            noteArray = [];
        thisNoteObj.string = cleanHtml(parasArray[0]);
        for (const para of parasArray) {
            noteArray.push({
                "string": cleanHtml(para)
            });
        }
        noteArray.splice(0, 1);
        thisNoteObj.children = noteArray;
        notes.children.push(thisNoteObj);
    }
    return notes;
}

function doExport() {

    var collection, collections = [];
    while (collection = Zotero.nextCollection()) {
        Zotero.debug(collection);
        collection.push(collection);
    }




    var item, data = [];
    while (item = Zotero.nextItem()) {
        var roamItem = {},
            itemChildren = [];
        roamItem.title = item.title;
        //var roamChildren = ZU.itemToCSLJSON(item);


        var metadata = getMetadata(item); // Get item metadata
        itemChildren.push(metadata);

        var notes = getNotes(item); // Get notes
        itemChildren.push(notes);


        roamItem.children = itemChildren;
        //roamItem["edit-time"] = Date.parse(item.dateModified)/1000;
        data.push(roamItem);
    }
    Zotero.write(JSON.stringify(data, null, "\t"));




    /*

        articles = getArticles();
        collections = getCollections();


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
