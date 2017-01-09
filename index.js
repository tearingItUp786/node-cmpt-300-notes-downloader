const cheerio = require('cheerio');
const fs = require('fs');
const request = require('request');
const path = require('path');

var baseURL = "http://www.cs.sfu.ca/~ashriram/Courses/2017/CS300/";
var baseDirectory = process.argv[2] || __dirname;
var scheduleURL = "http://www.cs.sfu.ca/~ashriram/Courses/2017/CS300/includes/schedule.html";

scanForLinks(scheduleURL, getDocuments);

function scanForLinks(url, callback) {
    request(url, (err, response, body) => {
        if (err) return consle.log(err);

        $ = cheerio.load(body);

        $("table table table a").each(function pushLink(index, element) {
            var $linkTag = $(element);

            if ($linkTag.attr('href').match(/..slides\//i)) {

                let cleanedAttr = $linkTag.attr('href').slice(3); //get rid of the ../
                let changedURL = baseURL + cleanedAttr; //new location to change to
                let directoryName = cleanedAttr.slice(7, -1); //remove the ../slides/

                var directoryObject = {
                    "link": changedURL,
                    "directory": directoryName,
                    "parentDirectory": baseDirectory
                };

                callback(directoryObject);
            }
        });

    });
}



function getDocuments(directoryObject) {
    var {
        link,
        directory,
        parentDirectory
    } = directoryObject || {};

    var fullPath = path.join(parentDirectory, directory);
    createDirectory(fullPath);

    request(link, (err, response, body) => {
        if (err) return console.log(error);
        $ = cheerio.load(body);

        $anchorTags = $('a');

        $anchorTags.each(function downloadPDFS(index, element) {
            if ($(element).attr('href').match(/^[a-zA-Z0-9._-]*\.*[a-zA-Z0-9_-]*$/i)) {
                downloadDocs(link + $(element).attr('href'), path.join(fullPath, $(element).attr('href')));
            }
            if ($(element).attr('href').match(/^[/a-zA-Z]+[/]$/i)) {
                var directoryName = $(element).attr('href').slice(0, $(element).attr('href').length - 2);
                var subLink = link + $(element).attr('href');
                return getDocuments({
                    "link": subLink,
                    "directory": directoryName,
                    "parentDirectory": fullPath
                });
            }
        });
    });
}

function downloadDocs(url, location, directory) {
    const file = fs.createWriteStream(location);

    request(url)
        .pipe(file)
        .on('error', function(error) {
            console.error(error);
        });
    file.on('open', function() {
        console.log(`Opening file ${location} and the working directory is ${location}`);
    });
    file.on('close', function() {
        console.log(`Closing ${location} and the working directory is ${location}`);
    });
}

function createDirectory(dirName, callback) {
    if (!fs.existsSync(dirName)) {
        console.log(`Created directory ${dirName}`);
        return fs.mkdirSync(dirName);
    }
}
