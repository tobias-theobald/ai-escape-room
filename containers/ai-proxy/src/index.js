import {createServer} from 'node:http';

const UPSTREAM_COMPLETION_URL = process.env.UPSTREAM_COMPLETION_URL;
if (!UPSTREAM_COMPLETION_URL) {
    console.error('UPSTREAM_COMPLETION_URL is not set');
    process.exit(1);
}

const UPSTREAM_BEARER_TOKEN = process.env.UPSTREAM_BEARER_TOKEN;
if (!UPSTREAM_BEARER_TOKEN) {
    console.error('UPSTREAM_BEARER_TOKEN is not set');
    process.exit(1);
}
const UPSTREAM_MODEL = process.env.UPSTREAM_MODEL;
if (!UPSTREAM_MODEL) {
    console.error('UPSTREAM_MODEL is not set');
    process.exit(1);
}
const VERBOSE = process.env.VERBOSE === 'true';

const readRequestJsonBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
    });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const handleRequest = async (req, res) => {
    if (req.url !== '/v1/chat/completions') {
        res.writeHead(404, {'Content-Type': 'application/json',});
        res.end(JSON.stringify({error: 'Not found', status: 404}));
        return;
    }
    if (req.method !== 'POST') {
        res.writeHead(405, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Method not allowed', status: 405}));
        return;
    }
    if (req.headers['content-type'] !== 'application/json') {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Invalid content type', status: 400}));
        return;
    }

    let parsedBody;
    try {
        parsedBody = await readRequestJsonBody(req);
    } catch (e) {
        console.error('Failed to parse request body:', e);
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Invalid JSON', status: 400}));
        return;
    }
    if (VERBOSE) {
        console.log('\n------------------------\nReceived request\n', JSON.stringify(parsedBody, null, 2));
    }

    // enforce the model
    parsedBody.model = UPSTREAM_MODEL;

    let response;
    try {
        response = await fetch(UPSTREAM_COMPLETION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${UPSTREAM_BEARER_TOKEN}`,
            },
            body: JSON.stringify(parsedBody),
        });
    } catch (e) {
        console.error('Failed to fetch upstream:', e);
        res.writeHead(503, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Failed to fetch upstream', status: 503}));
        return;
    }

    if (response.status !== 200) {
        try {
            const body = await response.text();
            console.error(`Upstream error: ${response.status} ${body}`);
        } catch (e) {
            console.error('Failed to read upstream response', response.status);
        }
        res.writeHead(response.status, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Upstream error', status: response.status}));
        return;
    }
    try {
        const body = await response.text();
        if (VERBOSE) {
            console.log('\nUpstream response\n', JSON.stringify(JSON.parse(body), null, 2));
        }

        await delay(2000);

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(body);
    } catch (e) {
        console.error('Failed to read upstream response:', e);
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Failed to read upstream response', status: 500}));
    }
}

createServer((req, res) => {
    handleRequest(req, res).catch(e => {
        console.error('Failed to handle request:', e);
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Internal server error', status: 500}));
    })
}).listen(80, () => console.log('Listening port 80'));
