const moment = require('moment');

const log = require('../utils/logger.js');
const { connection } = require('../model/DbConn.js');
const audit = require('../utils/audit.js');


function getProduct(req, res) {

  connection.query("SELECT * FROM product_table", function (error, rows, field) {
    if (error) throw error;

    res.send({ message: rows, errormessage: '000' });
  });
}

function getEditProduct(req, res) {

  const id = req.body.id;

  connection.query("SELECT * FROM product_table WHERE `id`=" + id + "", function (error, rows, field) {
    if (error) throw error;

    res.send({ message: rows, errormessage: '000' });
  });
}

function postEditProduct(req, res) {

  const id = req.body.id;
  const brand = req.body.brand;
  const product_name = req.body.product_name;
  const barcode = req.body.barcode;


  connection.query("UPDATE product_table SET brand ='" + brand + "',product_name='" + product_name + "',barcode='" + barcode + "'WHERE `id`=" + id + "", function (error, rows, field) {
    if (error) throw error;

    res.send({ errormessage: '000' });
  });
}






module.exports = {
  getProduct,
  getEditProduct,
  postEditProduct,
}