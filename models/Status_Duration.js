var db = require('../dbconnection');
var fs = require('fs');
const storedProcedure = require('../helpers/stored-procedure');
const { Console } = require('console');
var Status_Duration =
{
  Save_Department_Status_Duration: function (Status_Duration_, callback) {
    return db.query("CALL Save_Department_Status_Duration(" +
      "@Department_Status_Duration_Id :=?," +
      "@Department_Id :=?," +
      "@Department_Name :=?," +
      "@Department_Status_Id :=?," +
      "@Department_Status_Name :=?," +
      "@Duration_Count :=?" +
      ")"
      , [Status_Duration_.Department_Status_Duration_Id,        // 1
      Status_Duration_.Department_Id,      // 2
      Status_Duration_.Department_Name,      // 3
      Status_Duration_.Department_Status_Id,    // 4
      Status_Duration_.Department_Status_Name,          // 5
      Status_Duration_.Duration_Count
      ], callback);
  }
  ,

  Delete_Department_Status_Duration: function (Department_Status_Duration_Id_, callback) {
    return db.query("CALL Delete_Department_Status_Duration(@Department_Status_Duration_Id_ :=?)", [Department_Status_Duration_Id_], callback);
  },

  Load_Branch: function (callback) {
    return db.query("CALL Load_Branch()", [], callback);
  },

  Load_Department: function (callback) {
    return db.query("CALL Load_Department()", [], callback);
  },

    Load_Department_Status: function (callback) {
    return db.query("CALL Load_Department_Status()", [], callback);
  },


  Search_Department_Status_Duration: function (Department_Status_Id_, Department_Id_,Duration_Count_, callback) {
    if (Duration_Count_ === 'undefined' || Duration_Count_ === 0 || Duration_Count_ === undefined)
      Duration_Count_ =0;
    return db.query("CALL Search_Department_Status_Duration(@Department_Status_Id_ :=?,@Department_Id_ :=?,@Duration_Count_ :=?)", 
      [ Department_Status_Id_, Department_Id_,Duration_Count_], callback);
  }
};
module.exports = Status_Duration;

