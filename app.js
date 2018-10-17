const fs = require('fs');
const path = require('path');
const Koa = require('koa');

const app = new Koa();
const PATH = './resource';

app.use(async ctx => {
    const file = path.join(__dirname, `${PATH}${ctx.path}`);
    // 1、404检查
    try {
        fs.accessSync(file);
    } catch (e) {
        return ctx.response.status = 404;
    }
    const method = ctx.request.method;
    const { size } = fs.statSync(file);
    // 2、响应head请求，返回文件大小
    if ('HEAD' == method) {
        return ctx.set('Content-Length', size);
    }
    const range = ctx.headers['range'];
    // 3、通知浏览器可以进行分部分请求
    if (!range) {
        return ctx.set('Accept-Ranges', 'bytes');
    }
    const { start, end } = getRange(range);
    // 4、检查请求范围
    if (start >= size || end >= size) {
        ctx.response.status = 416;
        return ctx.set('Content-Range', `bytes */${size}`);
    }
    // 5、206分部分响应
    ctx.response.status = 206;
    ctx.set('Accept-Ranges', 'bytes');
    ctx.set('Content-Range', `bytes ${start}-${end ? end : size - 1}/${size}`);
    ctx.body = fs.createReadStream(file, { start, end });
});

app.listen(3000, () => console.log('partial content server start'));

function getRange(range) {
    var match = /bytes=([0-9]*)-([0-9]*)/.exec(range);
    const requestRange = {};
    if (match) {
        if (match[1]) requestRange.start = Number(match[1]);
        if (match[2]) requestRange.end = Number(match[2]);
    }
    return requestRange;
}