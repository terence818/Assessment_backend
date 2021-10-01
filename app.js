const http = require('http');
const https = require('https');
const express = require('express');
const cors = require("cors");
const cookieParser = require('cookie-parser');
const mysql = require('mysql');
const session = require('express-session');
const cookie = require('cookie-parser');

const conf = require('./utils/conf.js');
const log = require('./utils/logger.js');
const multer = require('multer');
const os = require("os");
const fs = require('fs');

const ProductRouteController = require('./controllers/ProductRouteController.js');


conf.appName = 'assessment_backend';
conf.version = '1.0.0';
conf.LMD = '2021-09-30';
console.log(conf.appName + ', ' + conf.version + ', ' + conf.LMD);
if (process.argv.includes('-v')) {
  return
}

log.init(conf.version, conf.log_path, conf.log_name, conf.log_extension, conf.log_size, conf.log_transactionIdLength, conf.log_moduleIdLength);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static('public'));
app.use(session({
  resave: true,
  saveUninitialized: false,
  secret: 'secret'
}));

var dir_upload = './upload';
if (!fs.existsSync(dir_upload)) {
  fs.mkdirSync(dir_upload);
}

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'upload')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})
var upload = multer({ storage: storage })

app.use(cors());
app.use((req, res, next) => {
  var hrTime = process.hrtime()
  req.tid = hrTime[0] * 1000000 + hrTime[1]

  let paths = req.path.split('/')
  let tag = paths.length > 0 ? paths[paths.length - 1] : ''

  log.logIn(req.tid, tag, `${req.method} ${req.originalUrl} ${JSON.stringify(req.body)}`);

  const defaultWrite = res.write;
  const defaultEnd = res.end;
  const chunks = [];

  res.write = (...restArgs) => {
    defaultWrite.apply(res, restArgs);
    chunks.push(Buffer.from(restArgs[0]));
  };

  res.end = (...restArgs) => {
    defaultEnd.apply(res, restArgs);
    if (restArgs[0] && chunks.length === 0) {
      chunks.push(Buffer.from(restArgs[0]));
    }
    const body = Buffer.concat(chunks).toString('utf8');
    let temp = body || '';
    log.logOut(req.tid, tag, `${req.method} ${req.originalUrl} ${temp}`);
  };


  next()
})

const options = {
  uploadDir: os.tmpdir(),
  autoClean: true
};

var privateKey;
var certificate;
var credentials = { key: '', cert: '' };
if (conf.key != null && conf.key != '' && fs.existsSync(conf.key) && fs.statSync(conf.key).isFile()) {
  credentials.key = fs.readFileSync(conf.key, 'utf8');
} else {
  log.logError('', 'HTTPS', 'key not found for HTTPS');
}
if (conf.certificate != null && conf.certificate != '' && fs.existsSync(conf.certificate) && fs.statSync(conf.certificate).isFile()) {
  credentials.cert = fs.readFileSync(conf.certificate, 'utf8');
} else {
  log.logError('', 'HTTPS', 'certificate not found for HTTPS');
}

if (credentials.key != '' && credentials.cert != '') {
  httpsServer = https.createServer(credentials, app).listen(parseInt(conf.https_port), conf.https_host, function () {
    httpsServer.setTimeout(60 * 60 * 1000) // 60 minutes timeout

    log.log(conf.appName + ' | ' +
      conf.version + ' | ' +
      conf.LMD + ' | ' +
      // 'http: ' + conf.http_host + ':' + conf.http_port + ' | ' +
      // 'https: ' + conf.https_host + ':' + conf.https_port );
      'https: ' + conf.https_host + ':' + conf.https_port);
  });
}

var httpServer = http.createServer(app).listen(conf.http_port, conf.http_host, function () {
  httpServer.setTimeout(60 * 60 * 1000) // 60 minutes timeout

  log.log(conf.appName + ' | ' +
    conf.version + ' | ' +
    conf.LMD + ' | ' +
    'http: ' + conf.http_host + ':' + conf.http_port);


});

// Product
app.post('/getProduct', ProductRouteController.getProduct)
app.post('/getEditProduct', ProductRouteController.getEditProduct)
app.post('/postEditProduct', ProductRouteController.postEditProduct)


// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  let paths = req.path.split('/')
  let tag = paths.length > 0 ? paths[paths.length - 1] : ''

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    res.send({
      errorCode: "002",
      errorMessage: "API format incorrect",
    });
    return
  }

  // log.logTrans(req.tid, err.message);
  let errorMessage
  if (err.stack) {
    errorMessage = err.stack
  } else {
    try {
      errorMessage = JSON.stringify(err)
    } catch (e) {
      errorMessage = err
    }
  }
  log.logError(req.tid, tag, errorMessage);

  // render the error page
  res.status(err.status || 500).send(err.message);
});
app.use(function (req, res, next) {
  res.status(404).send('not found');
});


process.on('uncaughtException', function (err) {
  console.error(err);
});



if (conf.debug) {
  const { exec } = require("child_process");
}