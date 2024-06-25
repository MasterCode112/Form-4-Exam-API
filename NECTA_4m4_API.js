const https = require('https');
const cheerio = require('cheerio');

async function getResults() {
    const url = 'https://matokeo.necta.go.tz/results/2023/csee/CSEE2023/results/s4459.htm';

    try {
        const html = await fetchHTML(url);
        const results = extractResults(html);
        return results;
    } catch (error) {
        console.error('Error fetching or parsing data:', error);
        return null;
    }
}

function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                resolve(data);
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

function extractResults(html) {
    const results = [];
    const $ = cheerio.load(html);
    const table = $('table[cellspacing="2"][width="70%"][bgcolor="LIGHTYELLOW"]');
    
    if (table.length === 0) {
        throw new Error('Table not found or structure changed');
    }
    
    table.find('tr').each((index, row) => {
        if (index !== 0) {
            const $columns = $(row).find('td');
            const examNumber = $columns.eq(0).text().trim();
            const sex = $columns.eq(1).text().trim();
            const points = parseInt($columns.eq(2).text().trim(), 10);
            const division = $columns.eq(3).text().trim();
            const subjectsStr = $columns.eq(4).text().trim();

            const subjects = subjectsStr.split(/\s{2,}/).map(subject => {
                const parts = subject.split(' - ');
                return {
                    subjec: parts[0].trim(),
                    grade: parts[1].trim()
                };
            });

            const formattedSubjects = subjects.map(subject => ({
                subjec: subject.subjec,
                grade: subject.grade
            }));

            const result = {
                examNumber,
                sex,
                points,
                division,
                subjects: formattedSubjects
            };

            results.push(result);
        }
    });

    return results;
}

function resultsToAPA(results) {
    return results.map(result => ({
        examNumber: result.examNumber,
        sex: result.sex,
        points: result.points,
        division: result.division,
        subjects: result.subjects.map(subject => ({
            subjec: subject.subjec,
            grade: subject.grade
        }))
    }));
}

function resultsToJSON(results) {
    return JSON.stringify(results, null, 2);
}

getResults().then(results => {
    const jsonResults = resultsToJSON(results);
    console.log('JSON Format:');
    console.log(jsonResults);
}).catch(error => {
    console.error('Error:', error);
});
