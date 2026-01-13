var express = require('express');
var router = express.Router();
var Status_Duration = require('../models/Status_Duration');

router.post('/Save_Department_Status_Duration/', function (req, res, next) {
  try {
    Status_Duration.Save_Department_Status_Duration(req.body, function (err, rows) {
      if (err) {
        console.log("err", err);

        res.json(err);

      }
      else {
        res.json(rows);
      }
    });
  }
  catch (e) {
    console.log("e", e);


  }
  finally {
  }
});

router.get('/Search_Department_Status_Duration/:Department_Status_Id_?/:Department_Id_?/:Duration_Count_?', function (req, res, next) {
  try {
    Status_Duration.Search_Department_Status_Duration(req.params.Department_Status_Id_, req.params.Department_Id_,req.params.Duration_Count_, function (err, rows) {
      if (err) {
        res.json(err);
      }
      else {
        res.json(rows);
      }
    });
  }
  catch (e) {
  }
  finally {
  }
});


router.get('/Load_Branch/', function (req, res, next) {
  try {
    Status_Duration.Load_Branch(function (err, rows) {
      if (err) {
        res.json(err);
      }
      else {
        res.json(rows);
      }
    });
  }
  catch (e) {
  }
  finally {
  }
});

router.get('/Load_Department/', function (req, res, next) {
  try {
    Status_Duration.Load_Department(function (err, rows) {
      if (err) {
        res.json(err);
      }
      else {
        res.json(rows);
      }
    });
  }
  catch (e) {
  }
  finally {
  }
});

router.get('/Load_Department_Status/', function (req, res, next) {
  try {
    Status_Duration.Load_Department_Status(function (err, rows) {
      if (err) {
        res.json(err);
      }
      else {
        res.json(rows);
      }
    });
  }
  catch (e) {
  }
  finally {
  }
});


router.get('/Delete_Department_Status_Duration/:Department_Status_Duration_Id_?', function (req, res, next) {
  try {
    Status_Duration.Delete_Department_Status_Duration(req.params.Department_Status_Duration_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      }
      else {
        res.json(rows);
      }
    });
  }
  catch (e) {
  }
  finally {
  }
});

module.exports = router;

