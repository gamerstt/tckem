/**
 * Created by lunik on 04/07/2017.
 */

import Express from 'express'
import Delogger from 'delogger'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import enforce from 'express-sslify'
import https from 'https'
import fs from 'fs'

import Config from '../model/config'
var config = new Config()

export default class Server {
  constructor () {
    this.app = Express()
    this.app.use(compression())
    this.app.use(cookieParser())
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.urlencoded({
      extended: true
    }))

    if (config.server.https) {
      this.app.use(enforce.HTTPS())
    }

    require('./auth')(this.app)
    this.baseFolder = require('./folder')(this.app)
    require('./file')(this.app, this.baseFolder)
    require('./torrent')(this.app, this.baseFolder)

    this.app.use(Express.static(__dirname + '/public'))

    this.log = new Delogger('Server')
  }

  listen () {
    let host = '0.0.0.0'

    let options = {}

    if (config.server.https) {
      Object.assign(options, {
        hostname: config.server.hostname,
        key: fs.readFileSync(config.server.certs.privatekey),
        cert: fs.readFileSync(config.server.certs.certificate),
        ca: fs.readFileSync(config.server.certs.chain)
      })

      // ssl server
      this.server = https.createServer(options, this.app).listen(config.server.https, () => this.log.info(`Server listening at port ${config.server.https}`))
    }

    // http server
    this.app.listen(config.server.port, host, () => this.log.info(`Server listening on ${host}:${config.server.port}`))
  }
}
