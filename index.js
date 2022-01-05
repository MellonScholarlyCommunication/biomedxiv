import fetch from 'node-fetch';

const baseurl = 'https://api.biorxiv.org/details/biorxiv';

if (process.argv.length !== 4) {
    console.error('usage: index.js startDate endDate');
    process.exit(1);
}

let startDate  = process.argv[2];
let endDate    = process.argv[3];
let sleepTime  = 3000;
let maxRetries = 10;
let maxTime    = 60 * 1000;

fetchData(startDate,endDate);


async function fetchData(startDate,endDate) {
    let cursor    = 0;
    let recCount  = 0;
    let isReady   = false;

    do {
        const url = `${baseurl}/${startDate}/${endDate}/${cursor}`;
        const res = await fetchWithRetry(url,maxRetries);

        if (! res.ok ) {
            console.error(`failed to fetch: ${url}`);
            process.exit(2);
        }

        const data = await res.json();

        if (data['collection']) {
            recCount += data['collection'].length;
        }
        else {
            console.error('No more data');
            process.exit(0);
        }

        data['collection'].forEach( record => {
            console.log(JSON.stringify(record));
        });

        const count = data['messages'][0]['count'];
        const total = data['messages'][0]['total'];
        const newcursor = data['messages'][0]['cursor'];

        if (count && typeof newcursor !== 'undefined') {
            cursor = cursor + parseInt(count);
            console.error(`${recCount} = ${count} from ${total} ; ${newcursor} -> ${cursor}`);
        }
        else {
            isReady = true;
        }

        if (parseInt(newcursor) === cursor) {
            isReady = true;
        }
    } while (! isReady);
}

async function fetchWithRetry(url, retries) {
    if (typeof retries === "undefined") {
        retries = 0;
    }

    do {
        const res = await fetch(url, {timeout: maxTime });

        if (res.ok) {
            return res;
        }
        else {
            console.error(`${url} failed...`)
            retries--;
        }

        const s = Math.pow(2,maxRetries - retries) * sleepTime;
        console.error(`sleeping ${s} seconds...`);
        await sleep(s);
    } while (retries > 0);

    return undefined;
}