/* JBoss, Home of Professional Open Source
* Copyright Red Hat, Inc., and individual contributors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* http://www.apache.org/licenses/LICENSE-2.0
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

/**
 * Module dependencies.
 */

var fs = require('fs');
var express = require('express');
var http = require('http');
var path = require('path');
var uuid = require('node-uuid');
var _ = require('lodash-node');

var app = express();

var dataz = [{
    id: uuid.v4(),
    chattext: "Welcome to AeroGear/BridgeIt chat",
}];

var filez = { };

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// This will be our REST endpoints we are going to connect to

app.get( '/items', function( request, response ) {
    response.send( dataz );
});

app.get( '/items/:id', function( request, response ) {
    var item,
        id = request.params.id;

    item = dataz.filter( function( value, index, list ) {
        return value.id === id;
    });

    response.send( item );
});

app.get( '/items/upload/:id', function( request, response ) {
    var file,
        id = request.params.id;
    file = filez[id];
    var header = {};
    header["Content-Type"] = file.headers['content-type'];
    var fileBuf = fs.readFileSync(file.path);

    if (!!request.headers.range)  {
        var range = request.headers.range;
        var ranges = range.replace(/bytes=/, "").split("-");
        var rangeStart = ranges[0];
        var rangeEnd = ranges[1];

        var total = fileBuf.length;
        
        var start = parseInt(rangeStart, 10);
        var end = rangeEnd ? parseInt(rangeEnd, 10) : total - 1;

        header["Content-Range"] = "bytes " + start + "-" + end + "/" + (total);
        header["Accept-Ranges"] = "bytes";
        header["Content-Length"] = (end - start) + 1;

        response.writeHead(206, header);
        //HTTP ranges are inclusive
        var rangeBuf = fileBuf.slice(start, end + 1);
        response.write(rangeBuf);
    } else {
        response.writeHead(206, header);
        response.write(fileBuf);
    }
    response.end();
});

app.post( '/items', function( request, response ) {
    var newData = request.body;
    newData.id = uuid.v4();
    dataz.push( newData );

    response.send( newData );
});

app.post( '/items/upload', function( request, response ) {
    var files = request.files;
    var id = uuid.v4();
    for (var file in files)  {
        filez[id] = files[file];
    }
    response.end(id);
});

app.put( '/items/:id', function( request, response ) {
    var updatedData = request.body;

    dataz = dataz.map( function( value ) {
        if( updatedData.id === value.id ) {
            value = updatedData;
        }
        return value;
    });
    response.send( 204 );
});

app.delete( '/items/:id', function( request, response ) {

    var id = request.params.id;

    dataz = _.reject( dataz, function( value ) {
        return value.id === id;
    });

    response.send( 204 );
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
