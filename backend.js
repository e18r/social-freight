const express = require('express')
const OAuth = require('oauth-1.0a')
const crypto = require('crypto')
const fetch = require('node-fetch')

const app = express()

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const oauth = OAuth({
  consumer: {
    key: 'ttvjjBmoZyxZyNjgc2GiVNo3N',
    secret: '7E0QOUHqbwssciXLYaMWTst7QbuBciDjVi82K6aHQeFkx6VNyu'
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
    components = element.split('=')
    key = components[0]
    value = components[1]
    data[key] = value
  })
  return data
}

let auth_data = {}
let access_data = {}

const error_403 = {
  error: {
    message: 'Forbidden',
    status: 403
  }
}

app.get('/oauth_request', (req, res) => {

  const request_data = {
    url: 'https://api.twitter.com/oauth/request_token',
    method: 'POST',
    data: { oauth_callback: 'http://127.0.0.1:3000/callback' }
  }

  const headers = oauth.toHeader(oauth.authorize(request_data))
  
  fetch(request_data.url, {
    method: request_data.method,
    headers: headers
  })
    .then(response => response.text())
    .then(string => {
      auth_data = deserialize(string)
      if(auth_data.oauth_callback_confirmed == 'true') {
        authorization_url = `https://api.twitter.com/oauth/authorize?oauth_token=${auth_data.oauth_token}`
        res.json({authorization_url})
      }
    })

})

app.get('/callback', (req, res) => {

  if(Object.keys(auth_data).length === 0) {
    res.status(403).json(error_403)
    return
  }

  else if(req.query.oauth_token === auth_data.oauth_token) {

    const request_data = {
      url: 'https://api.twitter.com/oauth/access_token',
      method: 'POST',
      data: {
        oauth_token: req.query.oauth_token,
        oauth_verifier: req.query.oauth_verifier
      }
    }

    const headers = oauth.toHeader(oauth.authorize(request_data))
    
    fetch(request_data.url, {
      method: request_data.method,
      headers: headers
    })
      .then(response => response.text())
      .then(string => {
        access_data = deserialize(string)
        res.redirect('http://127.0.0.1:8080')
      })
  }
  else {
    res.status(403).json(error_403)
  }
})

app.post('/connect', (req, res) => {

  if(Object.keys(access_data).length === 0) {
    res.status(403).json(error_403)
    return
  }

  const request_data = {
    url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
    method: 'GET'
  }

  const token = {
    key: access_data.oauth_token,
    secret: access_data.oauth_token_secret
  }

  const headers = oauth.toHeader(oauth.authorize(request_data, token))
  
  fetch(request_data.url, {
    method: request_data.method,
    headers: headers
  })
    .then(response => response.json())
    .then(json => res.json(json))
  
})

app.get('/tweets', (req, res) => {
  
  if(Object.keys(auth_data).length === 0) {
    res.status(403).json(error_403)
    return
  }
  
  const request_data = {
    url: `https://api.twitter.com/1.1/statuses/user_timeline.json?user_id=${access_data.user_id}&count=100`,
    method: 'GET'
  }

  const token = {
    key: access_data.oauth_token,
    secret: access_data.oauth_token_secret
  }

  const headers = oauth.toHeader(oauth.authorize(request_data, token))

  fetch(request_data.url, {
    method: request_data.method,
    headers: headers
  })
    .then(response => response.json())
    .then(json => res.json(json))
})

app.post('/disconnect', (req, res) => {

  if(Object.keys(auth_data).length === 0) {
    res.status(403).json(error_403)
    return
  }

  const user_id = access_data.user_id
  auth_data = {}
  access_data = {}
  res.json({user_id: user_id})
  
})

app.get('/update', (req, res) => {

  if(Object.keys(auth_data).length === 0) {
    res.status(403).json(error_403)
    return
  }

  const status = req.query.status

  const request_data = {
    url: `https://api.twitter.com/1.1/statuses/update.json?status=${status}`,
    method: 'POST'
  }

  const token = {
    key: access_data.oauth_token,
    secret: access_data.oauth_token_secret
  }

  const headers = oauth.toHeader(oauth.authorize(request_data, token))

  fetch(request_data.url, {
    method: request_data.method,
    headers: headers
  })
    .then(response => response.json())
    .then(json => res.json(json))

})

const port = 3000
app.listen(port, () => console.log(`Back end is running at:

http://127.0.0.1:${port}`))
