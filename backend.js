const express = require('express')
const OAuth = require('oauth-1.0a')
const crypto = require('crypto')
const fetch = require('node-fetch')
const mongo = require('mongodb').MongoClient

const app = express()

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const oauth = OAuth({
  consumer: {
    key: 'ttvjjBmoZyxZyNjgc2GiVNo3N',
    secret: '7E0QOUHqbwssciXLYaMWTst7QbuBciDjVi82K6aHQeFkx6VNyu',
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto
      .createHmac('sha1', key)
      .update(base_string)
      .digest('base64')
  },
})

const deserialize = string => {
  const data = {}
  const elements = string.split('&')
  elements.forEach(element => {
    const components = element.split('=')
    if(components.length == 1) {
      throw `Malformed string: ${element}`
    }
    const key = components[0]
    const value = components[1]
    data[key] = value
  })
  return data
}

const url = 'mongodb://localhost:27017'
const dbName = 'social_freight'
const collName = 'user_data'

const write = (name, data) => {
  mongo.connect(url, (e, client) => {
    if(e) {
      console.log(e)
      return
    }
    const db = client.db(dbName)
    const collection = db.collection(collName)
    collection.insertOne({
      name: name,
      data: data,
    }, (e) => {
      if(e) {
        console.log(e)
      }
      client.close()
    })
  })
}

const read = async (name) => {
  try {
    const client = await mongo.connect(url)
    const db = client.db(dbName)
    const collection = db.collection(collName)
    const data = await collection.findOne({
      'name': name,
    })
    client.close()
    return data.data
  }
  catch(e) {
    return {}
  }
}

const clear = () => {
  mongo.connect(url)
    .then(client => {
      const db = client.db(dbName)
      const collection = db.collection(collName)
      collection.deleteMany({})
    })
    .catch(e => console.log(e))
}

const error_403 = {
  error: {
    message: 'Forbidden',
    status: 403,
  },
}

app.get('/oauth_request', (req, res) => {

  const request_data = {
    url: 'https://api.twitter.com/oauth/request_token',
    method: 'POST',
    data: { oauth_callback: 'http://127.0.0.1:3000/callback' },
  }

  const headers = oauth.toHeader(oauth.authorize(request_data))
  
  fetch(request_data.url, {
    method: request_data.method,
    headers: headers,
  })
    .then(response => response.text())
    .then(string => {
      const auth_data = deserialize(string)
      write('auth_data', auth_data)
      if(auth_data.oauth_callback_confirmed == 'true') {
        const authorization_url = `https://api.twitter.com/oauth/authorize?oauth_token=${auth_data.oauth_token}`
        res.json({authorization_url})
      }
    })

})

app.get('/callback', async (req, res) => {

  const auth_data = await read('auth_data')

  if(Object.keys(auth_data).length === 0) {
    console.log('Unauthorized')
    res.redirect('http://127.0.0.1:8080')
    return
  }

  else if(req.query.oauth_token === auth_data.oauth_token) {

    try {
      const request_data = {
        url: 'https://api.twitter.com/oauth/access_token',
        method: 'POST',
        data: {
          oauth_token: req.query.oauth_token,
          oauth_verifier: req.query.oauth_verifier,
        },
      }

      const headers = oauth.toHeader(oauth.authorize(request_data))
      
      fetch(request_data.url, {
        method: request_data.method,
        headers: headers,
      })
        .then(response => response.text())
        .then(string => {
          const access_data = deserialize(string)
          write('access_data', access_data)
          res.redirect('http://127.0.0.1:8080')
        })
    }
    catch(e) {
      console.log(e)
      res.redirect('http://127.0.0.1:8080')
      return
    }
  }
  else {
    console.log('OAuth token mismatch')
    console.log(req.query.oauth_token)
    console.log(auth_data.oauth_token)
    res.redirect('http://127.0.0.1:8080')
    return
  }
})

app.post('/connect', async (req, res) => {

  const access_data = await read('access_data')

  if(Object.keys(access_data).length === 0) {
    res.status(403).json(error_403)
    return
  }

  const user_data = await read('user_data')

  if(Object.keys(user_data).length > 0) {
    res.json(user_data)
    return
  }

  const request_data = {
    url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
    method: 'GET',
  }

  const token = {
    key: access_data.oauth_token,
    secret: access_data.oauth_token_secret,
  }

  const headers = oauth.toHeader(oauth.authorize(request_data, token))
  
  fetch(request_data.url, {
    method: request_data.method,
    headers: headers,
  })
    .then(response => response.json())
    .then(user_data => {
      write('user_data', user_data)
      res.json(user_data)
    })
  
})

app.get('/tweets', async (req, res) => {

  const access_data = await read('access_data')
  
  if(Object.keys(access_data).length === 0) {
    res.status(403).json(error_403)
    return
  }
  
  const request_data = {
    url: `https://api.twitter.com/1.1/statuses/user_timeline.json?user_id=${access_data.user_id}&count=100`,
    method: 'GET',
  }

  const token = {
    key: access_data.oauth_token,
    secret: access_data.oauth_token_secret,
  }

  const headers = oauth.toHeader(oauth.authorize(request_data, token))

  try {
    fetch(request_data.url, {
      method: request_data.method,
      headers: headers,
    })
      .then(response => response.json())
      .then(json => res.json(json))
  }
  catch(e) {
    console.log(e);
  }
})

app.post('/disconnect', async (req, res) => {

  const access_data = await read('access_data')

  if(Object.keys(access_data).length === 0) {
    res.status(403).json(error_403)
    return
  }

  const user_id = access_data.user_id
  clear()
  res.json({user_id: user_id})
  
})

app.get('/update', async (req, res) => {

  const access_data = await read('access_data')

  if(Object.keys(access_data).length === 0) {
    res.status(403).json(error_403)
    return
  }

  const status = req.query.status

  const request_data = {
    url: `https://api.twitter.com/1.1/statuses/update.json?status=${status}`,
    method: 'POST',
  }

  const token = {
    key: access_data.oauth_token,
    secret: access_data.oauth_token_secret,
  }

  const headers = oauth.toHeader(oauth.authorize(request_data, token))

  fetch(request_data.url, {
    method: request_data.method,
    headers: headers,
  })
    .then(response => response.json())
    .then(json => res.json(json))

})

if(process.argv.length > 2 && process.argv[2] == 'run') {
  app.listen(3000, () => console.log(`Back end running at http://127.0.0.1:3000`))
  clear()
}

module.exports = { deserialize }
