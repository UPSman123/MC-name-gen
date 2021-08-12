const http = require('http');           // To create the http server
const statc = require('node-static');   // To serve static files
const open = require('open');           // To open the index.html page in the browser
const fetch = require('node-fetch');    // To make the requests to mojang
const websocket = require('websocket'); // To communicate with the browser
const getPort = require('get-port');    // To get a free port number
const path = require('path');           // To have cross platform file paths

const www = './www';

const apiUrl = 'https://api.mojang.com/profiles/minecraft';

const checkChunk = async (igns) => {
    const res = await fetch(apiUrl, {
        headers: {'Content-Type': 'application/json'},
        method: 'post',
        body: JSON.stringify(igns),
    })
        .catch(() => {throw new Error('mojang error')});
    if (!res.ok) {
        throw new Error('too many requests');
    }

    const data = await res.json();
    const takenIgns = data.map(account => account.name);
    return igns.filter(ign => takenIgns.every(takenIgn => takenIgn.toUpperCase() !== ign.toUpperCase()));
};

const handleMessage = (msg, connection) => {
    const request = JSON.parse(msg.utf8Data);
    if (request.requestType !== 'check igns') {
        console.error(`bad request: ${request}`);
        return;
    }
    processRequest(request, connection);
};

const processRequest = (request, connection) => {
    let processed = [];
    let available = [];
    let totalRequestsCreated = 0;
    let totalRequestsClosed = 0;
    const mainPromise = new Promise(async (resolve, reject) => {
        let openRequests = 0;
        let canceled = false;
        let unprocessedIgns = request.igns;

        const foo = () => {
            if (unprocessedIgns.length === 0) return;

            openRequests++;
            totalRequestsCreated++;
            const chunk = unprocessedIgns.splice(0, 10);
            checkChunk(chunk)
                .then(chunkAvailableIgns => {
                    // Set the igns as processed and save the available ones.
                    processed.push(...chunk);
                    available.push(...chunkAvailableIgns);

                    openRequests--;
                    totalRequestsClosed++;
                    // If this was the last open request and all requests have been made then resolve.
                    if (unprocessedIgns.length === 0 && openRequests === 0) {
                        resolve();
                    }
                })
                .catch(() => {
                    totalRequestsClosed++;
                    if (!canceled) {
                        console.log('too many requests');
                        canceled = true;
                        setTimeout(reject, 10 * 1000);
                    }
                });

            // Process the next chunk. Timeout is to allow responses to be processed.
            setTimeout(foo, 0);
        };

        // Start the loop.
        setTimeout(foo, 0);

        // In case the requests immediately resolve.
        // This should never happen but you never know.
        if (openRequests === 0 && unprocessedIgns.length === 0) {
            resolve();
        }
    });

    const sendBackResults = () => {
        // Send the results back.
        connection.send(JSON.stringify({
            requestNr: request.requestNr,
            processed: processed,
            available: available,
        }));
        console.log(`${request.requestNr}: finished. \
Nr mojang requests created: ${totalRequestsCreated}, requests closed: ${totalRequestsClosed}`);
    };

    // Wait for requests to finish.
    mainPromise.then(sendBackResults).catch(sendBackResults);
};

const main = async () => {
    const port = await getPort({port: 8000});
    console.log('port: ' + port);
    let nr_connections = 0;

    // Create simple http server to serve static files from the www folder.
    console.log('starting http server');
    const staticServer = new statc.Server(path.join(__dirname, www), {cache: 0});
    const httpServer = http.createServer((req, res) => {
        const url = req.url.split('/').filter(Boolean);
        if (url.length > 0 && url[0] === 'query') {
            handleMessage(req, res);
        } else {
            staticServer.serve(req, res);
        }
    });
    httpServer.listen(port);

    // Listen for websocket connections.
    const wsServer = new websocket.server({httpServer: httpServer});
    wsServer.on('request', request => {
        if (request.origin !== `http://localhost:${port}`) {
            request.reject();
            console.error(`ws connection rejected: ${request.origin}`);
            return;
        }

        const connection = request.accept();
        nr_connections++;
        console.log(`ws connection accepted: ${request.origin}`);
        connection.on('message', msg => handleMessage(msg, connection));
        connection.on('close', () => {
            nr_connections--;
            if (nr_connections === 0) {
                // Give some time to relead the page.
                setTimeout(() => {
                    if (nr_connections > 0) return;
                    console.log('stopping server');
                    wsServer.shutDown();
                    httpServer.close();
                    process.exit(0);
                }, 1000);
            }
        });
    });

    if (process.argv.lenth < 3 || !process.argv.includes('headless', 2)) {
        // Open index.html in the browser.
        console.log('opening index.html');
        open(`http://localhost:${port}/index.html`);
    }

    console.log('startup complete');
};

main();
