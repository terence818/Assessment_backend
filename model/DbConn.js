var mysql = require('mysql');
var conf = require('../utils/conf.js');
var log = require('../utils/logger.js');

this.connection = mysql.createPool({
    host: conf.db_host,
    port: conf.db_port,
    database: conf.db_name,
    user: conf.db_username,
    password: conf.db_password,
    connectionLimit: conf.db_poolLimit,
});

let queryPromise = (sqlstatement, connectionTemp) => {
    let connection = connectionTemp || this.connection 

    return new Promise((resolve, reject) => {
        connection.query(sqlstatement, function (error, rows, field) {
            if (error) {
                reject(error);
                return
            }
            resolve(rows)
        });
    });
}



module.exports = {
    connection: this.connection,
    queryPromise,
}