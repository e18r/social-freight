const express = require('express')
const OAuth = require('oauth-1.0a')
const crypto = require('crypto')
const fetch = require('node-fetch')

const app = express()

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
    data: { oauth_callback: 'http://127.0.0.1:3000/connect' }
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

app.get('/connect', (req, res) => {
  if(Object.keys(auth_data).length === 0) {
    res.status(403).json(error_403)
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
  }
  else {
    res.status(403).json(error_403)
  }
})

app.get('/tweets', (req, res) => {

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

app.get('/disconnect', (req, res) => {

  const user_id = access_data.user_id
  auth_data = {}
  access_data = {}
  res.json({user_id: user_id})
  
})

app.get('/update', (req, res) => {

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
app.listen(port, () => console.log(`Please direct your browser to the following URL:

http://127.0.0.1:${port}`))
