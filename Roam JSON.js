{
    "translatorID": "c04c2288-afbe-4d7b-b419-69e72ac8e9f5",
    "label": "Roam JSON",
    "creator": "Laurence Diver",
    "target": "json",
    "minVersion": "5.0",
    "maxVersion": "",
    "priority": 25,
    "configOptions": {
        "getCollections": true
    },
    "displayOptions": {
        "exportNotes": true
    },
    "inRepository": false,
    "translatorType": 2,
    "lastUpdated": "2020-05-23 12:00:00"
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
    cleanhtml = cleanhtml.replace(/([^+>]*)[^<]"*(<a [^>]*(href="([^>^\"]*)")[^>]*>)([^<]+)(<\/a>[)])/gi, "$1___$2 ([$5]($4))"); // Convert anchors to markdown
    cleanhtml = cleanhtml.replace(/<[^>]*>?/gm, ""); // Strip remaining tags
    // TODO retain soft linebreaks within the paragraph
    return cleanhtml;
}

function getItemCollections(item) {
    // TODO: Get collection names to be [[linked]] and build out Roam topic links
    return item.collections.toString();
}

function getItemType(item) {
    var zoteroType = item.itemType,
        type;
    // Adapted from Zotero RDF translator -- https://github.com/zotero/translators/blob/master/Zotero%20RDF.js
    if (item.url && (item.url.includes("arxiv") || item.url.includes("ssrn"))) {
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
    var creators = item.creators,
        authorsArray = [],
        authorsString;
    for (let author of creators) {
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
    // TODO: Get collection names to be [[linked]] and build out Roam topic links
    // metadata.children.push({
    //     "string": "Topics:: " + getItemCollections(item)
    // });
    metadata.children.push({
        "string": "Type:: [[" + getItemType(item) + "]]"
    });
    if (item.date) {
        metadata.children.push({
            "string": "Date:: " + ZU.strToISO(item.date)
        });
    }
    if (item.attachments.length) {
        var attachmentURIs = [];
        for (let [i,attachment] of item.attachments.entries()) {
            if (attachment.contentType == "application/pdf") {
                let attString = "[PDF " + (i+1) + "](zotero://open-pdf/library/items/";
                attString += attachment.uri.substring(attachment.uri.lastIndexOf('/') + 1) + ")";
                attachmentURIs.push(attString);
            }
        }
        metadata.children.push({
            "string": "Zotero PDF(s):: " + attachmentURIs.join(", ")
        });
    }
    if (item.url) {
        metadata.children.push({
            "string": "URL:: [" + item.url + "](" + item.url + ")"
        });
    }
    if (item.tags[0]) {
        metadata.children.push({
            "string": "Tags:: " + item.tags.map(o => "#[[" + o.tag + "]]").join(", ")
        });
    }
    if (Object.keys(item.relations).length) {
        metadata.children.push({
            "string": "Related:: " + getRelatedItems(item)
        });
    }
    return metadata;
}

function getNotes(item) {
    var notes = {};
    notes.string = "**Notes**";
    notes.children = [];

    for (let note of item.notes) {
        var parasArray = note.note.split("\n"), // Convert linebreaks to individual nodes
            thisNoteObj = {},
            noteArray = [];
        thisNoteObj.string = cleanHtml(parasArray[0]); // Take first line as note's heading
        for (let para of parasArray) {
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

function getRelatedItems(item) {
    // TODO: Get the metadata for related items, included as [[links]], to build out Roam's web
    return Object.values(item.relations)[0].toString()
}

function doExport() {
    var item, exportData = [];
    while (item = Zotero.nextItem()) {
        //Z.write(ZU.varDump(item));
        var roamItem = {},
            itemChildren = [];
        roamItem.title = item.title;
        var metadata = getMetadata(item); // Get item metadata
        itemChildren.push(metadata);
        if (Zotero.getOption("exportNotes") && item.notes.length) { // Get notes if requested
            var notes = getNotes(item);
            itemChildren.push(notes);
        }
        roamItem.children = itemChildren;
        roamItem["edit-time"] = Date.parse(ZU.strToISO(item.dateModified)) / 1000;
        exportData.push(roamItem);
    }
    Zotero.write(JSON.stringify(exportData, null, "\t"));
}
