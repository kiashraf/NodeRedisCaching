let express = require('express');
let axios = require('axios');
let responseTime = require('response-time');
let redis = require('redis');

let app = express();

let port = 3000;

let client = redis.createClient();


client.on('error', (err) => {
    console.log('Error', err);

})

app.use(responseTime());

app.get('/api/search', (req, res, next) => {

    let query = (req.query.query).trim();

    const searchUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&page=${query}`;

    return client.get(`wikipidea:${query}`, (err, result) => {

        if (result) {

            let resultJson = JSON.parse(result);
            return res.status(200).json(resultJson);

        } else {
            return axios.get(searchUrl).then((response) => {

                let responseJSon = response.data;
                client.setex(`wikipidea:${query}`, 3600, JSON.stringify({ source: 'Redis Cache', ...responseJSon, }))
                return res.status(200).json({ source: 'Wikipedia API', ...responseJSon, });

            }).catch((err) => {
                return res.json(err);
            });
        }
    })
})

app.listen(port, () => {
    console.log('Server is listening at port', port);
})