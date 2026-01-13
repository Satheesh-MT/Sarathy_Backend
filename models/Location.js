var db = require('../dbconnection');
var fs = require('fs');
const storedProcedure = require('../helpers/stored-procedure');
const { Console } = require('console');
var Location =
{
  Save_Location: function (Location_, callback) {
    return db.query("CALL Save_Location(" +
      "@Location_Id_ :=?," +
      "@Location_Name_ :=?," +
      "@Department_Id_ :=?," +
      "@Department_Name_ :=?," +
      "@Branch_Id_ :=?," +
      "@Branch_Name_ :=?" +
      ")"
      , [Location_.Location_Id,        // 1
      Location_.Location_Name,      // 2
      Location_.Department_Id,      // 3
      Location_.Department_Name,    // 4
      Location_.Branch_Id,          // 5
      Location_.Branch_Name
      ], callback);
  }
  ,
  Delete_Location: function (Location_Id_, callback) {
    return db.query("CALL Delete_Location(@Location_Id_ :=?)", [Location_Id_], callback);
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


  Search_Location: function (Location_Name_, Branch_Id_, Department_Id_, callback) {
    if (Location_Name_ === 'undefined' || Location_Name_ === '' || Location_Name_ === undefined)
      Location_Name_ = '';
    return db.query("CALL Search_Location(@Location_Name_ :=?,@Branch_Id_ :=?,@Department_Id_ :=?)", [Location_Name_, Branch_Id_, Department_Id_], callback);
  }
};
module.exports = Location;

