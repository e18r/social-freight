# Social Freight #
An app where you can tweet about DexFreight to your heart's content

## Installation ##

### Prerequisites ###
* [Git](https://git-scm.com)
* [Node.js](https://nodejs.org) version 10.15.3. Similar versions will probably work. It can be installed by means of [NVM](https://github.com/nvm-sh/nvm).
* [MongoDB](http://mongodb.com/). The database service should be running on port `27017` (the default) and not use authentication.
* A modern web browser
* Some command-line knowledge

### Build Steps ###
1. `git clone https://github.com/e18r/social-freight.git`
2. `cd social-freight`
3. `npm i`

### Usage ###
1. Run `npm start`
2. Point your browser to [http://127.0.0.1:8080]
3. Enjoy!

### Testing ###
* Run the tests *and* the linter: `npm test`
* Run the tests only: `npm run baretest`
* Run the linter only: `npm run lint`
* Run the backend: `npm run backend`
* Run the front end: `npm run frontend`
