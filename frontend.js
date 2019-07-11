import React from 'react';
import ReactDOM from 'react-dom';
import { TwitterLoginButton } from 'react-social-login-buttons';

const styles = {
  app: {
    padding: '40 0',
    fontFamily: 'helvetica, arial, sans-serif',
    backgroundColor: '#E8F5FD',
    width: '100%',
    borderRadius: 10
  },
  button: {
    backgroundColor: '#4AB3F4',
    borderStyle: 'none',
    borderRadius: '20px',
    color: 'white',
    padding: '10px 15px',
    fontWeight: 'bold'
  }
};

export class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      ready: false,
      loggedIn: false,
      name: null,
      screenName: null,
      profileImageUrl: null,
      biggerImageUrl: null,
      showTweets: false,
      tweets: [],
      newTweet: '',
    };
  }

  componentDidMount = () => {
    this.checkLoggedIn();
    this.refreshInterval = setInterval(this.refresh, 1100);
  }

  componentDidUpdate = (prevProps, prevState) => {
    if(!prevState.loggedIn) {
      this.checkLoggedIn();
    }
    if(!prevState.ready) {
      this.setState({ ready: true });
    }
  }

  componentWillUnmount = () => {
    this.setState({ready: false});
    clearInterval(this.refreshInterval);
  }

  login = async () => {
    const response = await fetch('http://127.0.0.1:3000/oauth_request', {
      method: 'GET',
    });
    const json = await response.json();
    const authorizationURL = json.authorization_url;
    window.location = authorizationURL;
  };

  checkLoggedIn = async () => {
    const { loggedIn } = this.state;
    try {
      const response = await fetch('http://127.0.0.1:3000/connect', {
        method: 'POST',
      });
      const json = await response.json();
      if('name' in json) {
        if(!loggedIn) {
          const biggerImageUrl = json.profile_image_url
                .replace('normal', 'bigger');
          this.setState({ loggedIn: true,
                          name: json.name,
                          screenName: json.screen_name,
                          profileImageUrl: json.profile_image_url,
                          biggerImageUrl
                        });
        }
      }
      else {
        if(loggedIn) {
          this.setLogout();
        }
      }
    }
    catch (e) {
      if(loggedIn) {
        this.setLogout();
      }
    }
  }

  logout = async () => {
    this.checkLoggedIn();
    const { loggedIn } = this.state;
    if(!loggedIn) {
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:3000/disconnect', {
        method: 'POST',
      });
      await response.json();
      this.setLogout();
    }
    catch (e) {
      this.setLogout();
    }
  }

  setLogout = () => {
    this.setState({ loggedIn: false,
                    name: null,
                    screenName: null,
                    profileImageUrl: null,
                    biggerImageUrl: null,
                    tweets: [],
                    newTweet: '',
                  });
  }

  showTweets = () => {
    this.setState({ showTweets: true });
    this.refresh();
  }

  refresh = async () => {
    if(!this.state.showTweets) {
      return;
    }
    this.checkLoggedIn();
    const { loggedIn } = this.state;
    if(!loggedIn) {
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:3000/tweets', {
        method: 'GET',
      });
      const json = await response.json();
      this.setState({ tweets: json });
    }
    catch (e) {
      console.log(e);
    }
  }

  update = async () => {
    this.checkLoggedIn();
    const { loggedIn, newTweet } = this.state;
    if(!loggedIn) {
      return;
    }
    try {
      const status = encodeURIComponent(newTweet);
      const query = `status=${status}`;
      const endpoint = 'http://127.0.0.1:3000/update';
      const url = `${endpoint}?${query}`;
      const response = await fetch(url, { method: 'GET' });
      await response.json();
      this.showTweets();
    }
    catch (e) {
      console.log(e);
    }
  }
  
  render() {
    console.log(this.state);
    const {
      ready,
      loggedIn,
      name,
      screenName,
      profileImageUrl,
      biggerImageUrl,
      tweets,
      newTweet,
    } = this.state;
    return (
      <div style={styles.app}>
        { ready && loggedIn && (
          <div>
            <div style={{display: 'flex'}}>
              <div className='avatar' style={{padding: '0 40'}}>
                <img src={biggerImageUrl} style={{borderRadius: '50%'}} />
                <div>
                  <span style={{fontSize: '20px', fontWeight: 'bold'}}>
                    {name}
                  </span>
                  <br/>
                  <span style={{color: 'gray'}}>
                    @{screenName}
                  </span>
                </div>
              </div>
              <div className='tweet' style={{marginTop: '0px'}}>
                <div>
                  <input
                    placeholder="Say something about #DexFreight"
                    value={newTweet}
                    onChange={e => this.setState({newTweet: e.target.value})}
                    style={{
                      height: '80px',
                      width: '500px',
                      borderColor: 'lightBlue',
                      borderStyle: 'solid',
                      borderRadius: '10px'
                    }}
                  />
                </div>
                <div style={{
                  width: '500px',
                  textAlign: 'right',
                  paddingTop: 10
                }}>
                  <button style={styles.button} onClick={this.update}>
                    Tweet
                  </button>
                </div>
              </div>
          </div>
            <div className='buttons' style={{padding: 40}}>
              <span>
                <button style={styles.button} onClick={this.showTweets}>
                  Refresh Tweets
                </button>
              </span>
              <span style={{paddingLeft: 20}}>
                <button style={styles.button} onClick={this.logout}>
                  Logout
                </button>
              </span>
            </div>
            <div className='feed' style={{padding: 40}}>
              {tweets.map((tweet, i) => (
                <div key={i} style={{
                  display: 'flex',
                  padding: 20,
                  backgroundColor: 'white',
                  borderBottom: 1,
                  borderBottomStyle: 'solid',
                  borderBottomColor: '#EEEEEE'
                }}>
                  <div>
                    <img src={profileImageUrl} style={{borderRadius: '50%'}} />
                  </div>
                  <div style={{paddingLeft: 10}}>
                    <div>
                      <span style={{paddingRight: '6px', fontWeight: 'bold'}}>
                        {name}
                      </span>
                      <span style={{color: 'gray', paddingRight: '6px'}}>
                        @{screenName}
                      </span>
                      <span style={{color: 'gray'}}>
                        &middot; {tweet.created_at}
                      </span>
                    </div>
                    <div style={{paddingTop: 10}}>
                      {tweet.text}
                    </div>
                </div>
                </div>
              ))}
            </div>
          </div>
        )}
        { ready && !loggedIn && (
          <div style={{width: '300px'}}>
            <TwitterLoginButton onClick={this.login} />
          </div>
        )}
        { !ready && (
          <div>loading...</div>
        )}
      </div>
    );
  }
}

const root = document.querySelector('#app');
ReactDOM.render(<App />, root);
