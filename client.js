import request from 'request';
import path from 'path';
import fs from 'fs';

const SINGLE = 1024 * 1000;
const SOURCE = 'http://127.0.0.1:3000/source.mp3';

request({
    method: 'HEAD',
    uri: SOURCE,
}, (err, res) => {
    if (err) return console.error(err);
    const file = path.join(__dirname, './download/source.mp3');
    try {
        fs.closeSync(fs.openSync(file, 'w'));
    } catch (err) {
        return console.error(err);
    }
    const size = Number(res.headers['content-length']);
    const length = parseInt(size / SINGLE);
    for (let i=0; i<length; i++) {
        let start = i * SINGLE;
        let end = i == length ? (i + 1) * SINGLE - 1 : size - 1;
        request({
            method: 'GET',
            uri: SOURCE,
            headers: {
                'range': `bytes=${start}-${end}`
            },
        }).on('response', (resp) => {
            const range = resp.headers['content-range'];
            const match = /bytes ([0-9]*)-([0-9]*)/.exec(range);
            start = match[1];
            end = match[2];
        }).pipe(fs.createWriteStream(file, {start, end}));
    }
});