const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const PORT = process.env.PORT || 3000;
const REDIS_PORT = 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

// Set response
const setResponse = (username, repos) => {
  return `<h3>${username} has ${repos} Github repositories</h3>`
}

// Make request to Github for data
const getRepos = async (req, res, next) => {
  try {
    console.log('Fetching data...');
    const { username } = req.params;
    const response = await fetch(`https://api.github.com/users/${username}`)
    const data = await response.json();
    const repos = data.public_repos;
    // Set data to Redis
    // (key, seconds, value)
    client.setex(username, 3600, repos);

    res.send(setResponse(username, repos));
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

// Cache middleware
const cache = (req, res, next) => {
  const { username } = req.params

  client.get(username, (err, data) => {
    if(err) throw err;
    if(data !== null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  })
}

app.get('/repos/:username', cache, getRepos)

app.listen(PORT, () => console.log(`App listeing on PORT ${PORT}`))
