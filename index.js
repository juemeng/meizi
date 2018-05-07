const puppeteer = require('puppeteer');
const fs = require('fs')
const path = require('path')
const axios = require('axios')

async function downloadImage(url, path) {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
    })
    response.data.pipe(fs.createWriteStream(path))
    return new Promise((resolve, reject) => {
        response.data.on('end', () => {
            resolve()
        })
        response.data.on('error', () => {
            reject()
        })
    })
}


function fsExistsSync(path) {
    try {
        fs.accessSync(path, fs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
}

async function start() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (let i = 1; i <= 60; i++) {
        const pageUrl = `http://jandan.net/ooxx/page-${i}`;
        console.log(`start download ${pageUrl}`);

        await page.goto(pageUrl);
        const imageElements = await page.$$(".view_img_link");

        let images = await Promise.all(imageElements.map(async x => {
            let href = await x.getProperty('href');
            return href.toString().replace('JSHandle:', '');
        }));
        images = images.filter(x => x !== 'undefined');
        let folder = path.join(path.resolve('./'), 'images');
        if (!fsExistsSync(folder)) {
            fs.mkdirSync(folder)
        }

        await Promise.all(images.map(async x => {
            let filePath = path.join(folder, path.basename(x));
            return downloadImage(x, filePath);
        }))
    }

    await browser.close();
}

start();
