const assert = require('assert');
const backend = require('./backend');
const fetch = require('node-fetch');

describe('Backend', () => {
  
  describe('deserialize', () => {
    it('should deserialize a urlencoded string', () => {
      const input = 'oauth_token=4JAVYgAAAAAA4ufZAAABa91cc0U&oauth_token_secret=axJ7TKt3XhwvXwcorWW8dVT7J5D6RkEk&oauth_callback_confirmed=true'
      const expected = {
        oauth_token: '4JAVYgAAAAAA4ufZAAABa91cc0U',
        oauth_token_secret: 'axJ7TKt3XhwvXwcorWW8dVT7J5D6RkEk',
        oauth_callback_confirmed: 'true'
      }
      const actual = backend.deserialize(input);
      assert.deepEqual(expected, actual);
    });
    it('should throw an error with a malformed string', () => {
      const input = 'key=value&malformed&key2=value2'
      assert.throws(() => {
        backend.deserialize(input);
      });
    });
  });

  describe('/oauth_request', async () => {
    it('should return a valid auth request URL', async () => {
      const response = await fetch('http://127.0.0.1:3000/oauth_request', {
        method: 'GET'
      });
      const json = await response.json();
      assert.ok('authorization_url' in json);
      const components = json.authorization_url.split('?');
      assert.equal(components.length, 2);
      assert.equal(components[0], 'https://api.twitter.com/oauth/authorize');
      const query = components[1].split('=');
      assert.equal(query[0], 'oauth_token');
    });
    it('the URL should provide HTML code for user authentication', async () => {
      const response = await fetch('http://127.0.0.1:3000/oauth_request', {
        method: 'GET'
      });
      const json = await response.json();
      const response2 = await fetch(json.authorization_url, {
        method: 'GET'
      });
      const html = await response2.text();
      assert.ok(html.startsWith('<!DOCTYPE html>'));
      const formText = '<form action="https://api.twitter.com/oauth/authorize"';
      assert.notEqual(html.indexOf(formText), -1);
    });
  });
  
});
