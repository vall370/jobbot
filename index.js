const { Cluster } = require('puppeteer-cluster');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs').promises;
const os = require('os');
const fs1 = require('fs');

(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
        monitor: true,
	puppeteerOptions: {
        	headless: true,
        	args: [
            	'--no-sandbox',
            	'--disable-setuid-sandbox',
        ]
    },
    });
    var test2 = [];

    const extractTitle = async ({ page, data: url }) => {
        await page.goto(url);
        if ((await page.$$('#__next > main > div.grid > div.grid__unit.u-r-size2of3 > nav > a')).length === 0) {
            var urls = await page.$$eval('article', list => {
                links = list.map(el => el.querySelector('a').href)
                return links;
            });
            for (let i = 0; i < urls.length; i++) {
                test2.push(urls[i]);
            }
        }
        if ((await page.$$('#__next > main > div.grid > div.grid__unit.u-r-size2of3 > nav > a')).length === 1) {
            var urls = await page.$$eval('article', list => {
                links = list.map(el => el.querySelector('a').href)
                return links;
            });
            for (let i = 0; i < urls.length; i++) {

                test2.push(urls[i]);

            }
            const username2 = await page.waitForSelector('#__next > main > div.grid > div.grid__unit.u-r-size2of3 > nav > a');
            await username2.click();
            // await page.waitFor(5000);
            let x = 1;
            let nextPageExists = true
            do {
                x++;
                if (x = 1) {
                    var urls = await page.$$eval('article', list => {
                        links = list.map(el => el.querySelector('a').href)
                        return links;
                    });
                    for (let i = 0; i < urls.length; i++) {

                        test2.push(urls[i]);

                    }
                }
                const username3 = await page.waitForSelector('#__next > main > div.grid > div.grid__unit.u-r-size2of3 > nav > a.button.button--pill.button--has-icon.button--icon-right');
                await username3.click();

                await page.waitFor(1000);
                if ((await page.$$('a[class="button button--pill button--has-icon button--icon-right"]')).length === 0) {
                    nextPageExists = false
                    break
                }
            } while (nextPageExists === true)

        }

    };
    // Extracts document.title of the crawled pages
    await cluster.task(async ({ page, data: url }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const pageTitle = await page.evaluate(() => document.title);
        // console.log(`Page title of ${url} is ${pageTitle}`);
    });

    // In case of problems, log them
    cluster.on('taskerror', (err, data) => {
        console.log(`  Error crawling ${data}: ${err.message}`);
    });

    // Read the top-1m.csv file from the current directory
    const csvFile = await fs.readFile(__dirname + '/kategorier.csv', 'utf8');
    const lines = csvFile.split('\n');
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const splitterIndex = line.indexOf(',');
        if (splitterIndex !== -1) {
            const domain = line.substr(splitterIndex + 1);
            // queue the domain
            cluster.queue(domain, extractTitle);
        }
    }

    await cluster.idle();

    await cluster.close();
    // console.log(test2)
    const filename = path.join(__dirname, 'jobAds.csv');
    const output = []; // holds all rows of data

    test2.forEach((d) => {
        output.push(d); // by default, join() uses a ','
      });
  
      fs1.writeFileSync(filename, output.join(os.EOL));
    // var test4 = [];

    // for (let i = 0; i < test2.length; i++) {
    //     test4.push({ jobAd: test2[i] })
    // }
    // const csvWriter = createCsvWriter({
    //     path: 'jobAds.csv',
    //     header: [
    //         { id: 'jobAd', title: 'jobAd' }
    //     ],
    //     append: true
    // });

    // csvWriter
    //     .writeRecords(test4);



    function runScript() {
        return spawn('python3', [
            "-u",
            path.join(__dirname, 'removeDuplicates.py')
        ]);
    }

    const subprocess = runScript()

    // print output of script
    subprocess.stdout.on('data', (data) => {
        console.log(`data:${data}`);
    });
    subprocess.stderr.on('data', (data) => {
        console.log(`error:${data}`);
    });
    subprocess.on('close', () => {
        console.log("Closed");
    });


})();
