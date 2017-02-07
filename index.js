let request = require("request");
let cheerio = require("cheerio");
let Q = require('q');

var express = require('express')
var app = express()
var http = require('http')

app.use(express.static(__dirname + '/public'));
app.use('/', express.static(__dirname + '/public/index.html'));
app.use('/assets', express.static(__dirname + '/public'));


app.get('/books/:word', function(req, res) {
    response = [];
    doSearch(req.params.word).then(function(r) {
        results = []
        results.push(r[0].value)
        results.push(r[1].value)
        results.push(r[2].value)

        let index = 0;
        let keepGoing = true
        while (keepGoing) {
            keepGoing = false
            for (let j = 0; j < results.length; j++) {
                if (results[j][index] !== undefined) {
                    response.push(results[j][index])
                    keepGoing = true
                }
            }
            index++
        }
        res.json(results)
    })
})




function doSearch(word) {
    return Q.allSettled([
        doMofiboSearch(word),
        doStorytelSearch(word),
        doBookBeatSearch(word)
    ])
}

function doMofiboSearch(searchword) {
    let p = Q.defer()
    let url = "https://mofibo.com/se/sv/books/?SearchTerm=" + searchword + "&CurrentPage=AudioBookOnly&SelectedGenreId=0&SelectedSorting=read&BookTypeFilter=AudioBookOnly";
    request(url, function(error, response, body) {
        if (!error) {
            let result = []
            let $ = cheerio.load(body)
            $(".book-content").each((i, book) => {
                result.push({ source: "Mofibo", author: $(book).find('.authors').text(), title: $(book).find('.title').text(), img: $(book).find('.cover').attr('src') })

            })
            p.resolve(result)
        } else {
            p.reject("Mofibo failed with error" + error)
            console.log("We’ve encountered an error: " + error);
        }
    });
    return p.promise
}

function doStorytelSearch(searchword) {
    let url = "https://www.storytel.se/api/search.action?q=" + searchword;
    let path = ["books"]
    let p = Q.defer()
    request(url, function(error, response, body) {
        if (!error) {
            let result = []
            let body = JSON.parse(response.body);
            path.forEach(function(p) {
                body = body[p]
            })
            body.forEach(function(books) {
                result.push({ source: "Storytel", author: books.book.authors.map(a => a.name).join(", "), title: books.book.name, img: "http://www.storytel.se/" + books.book.cover })
            })
            p.resolve(result)
        } else {
            p.reject("Storytel failed with error" + error)
            console.log("We’ve encountered an error: " + error);
        }
    });
    return p.promise
}

function doBookBeatSearch(searchword) {
    let url = "https://www.bookbeat.com/api/search.instant;limit=100;offset=0;query=" + searchword + "?returnMeta=true";
    let path = ["data", "_embedded", "books"]
    let innerPath = ["_embedded", "books"]
    let p = Q.defer()

    request(url, function(error, response, body) {
        if (!error) {
            let result = []
            let body = JSON.parse(response.body);
            path.forEach(function(p) {
                body = body[p]
            })
            body.forEach(function(books) {
                innerPath.forEach(function(p) {
                    books = books[p]
                })
                books.forEach(function(book) {
                    result.push({ source: "BookBeat", author: book.author, title: book.title, img: book.image })
                })
            })
            p.resolve(result)
        } else {
            p.reject("bookbeat failed with error" + error)
            console.log("We’ve encountered an error: " + error);
        }
    });

    return p.promise


}



app.listen(3000, function() {
    console.log('Example app listening on port 3000!')
})