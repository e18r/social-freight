import React, { Component } from 'react'
import ReactDOM from 'react-dom'

const styles = {
  app: {
    paddingTop: 40,
    textAlign: 'center',
  },
}

const login = async () => {
  const response = await fetch('http://127.0.0.1:3000/oauth_request', {
    method: 'GET'
  })
  const json = await response.json()
  const authorization_url = json.authorization_url
  window.location = authorization_url
}



class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loggedIn: false
    }
  }

  componentDidMount = () => {
    this.checkLoggedIn()
    this.interval = setInterval(this.checkLoggedIn, 10000)
  }

  checkLoggedIn = async () => {
    let loggedIn = false
    try {
      const response = await fetch('http://127.0.0.1:3000/connect', {
        method: 'POST'
      })
      const json = await response.json()
      console.log(json)
      if('name' in json) {
        loggedIn = true
      }
      else {
        loggedIn = false
      }
    }
    catch (e) {
      loggedIn = false
    }
    this.setState({ loggedIn })
  }
  
  render() {
    console.log(this.state)
    return (
      <div style={styles.app}>
        <button onClick={login}>
        log in to twitter</button>
      </div>
    )
  }
}

const root = document.querySelector('#app')
ReactDOM.render(<App />, root)
