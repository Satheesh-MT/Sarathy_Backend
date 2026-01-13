var db = require('../dbconnection');
const Querycaller = require('../helpers/Querycaller');
const storedProcedure = require('../helpers/stored-procedure');
var fs = require('fs');
var Department =
{

  Save_Department: async function (Department_) {
    return new Promise(async (rs, rej) => {
      const pool = db.promise();
      let connection;

      try {
        connection = await pool.getConnection();

        const Department_Status_ = Department_.Department_Status_Data;

        const result = await new storedProcedure('Save_Department', [
          Department_.Department_Id,
          Department_.Department_Name,
          Department_.FollowUp,
          Department_.Status,
          Department_.Department_Order,
          Department_.Color,
          Department_.Department_Status_Id,
          Department_.Transfer_Method_Id,
          Department_.Color_Type_Id,
          Department_.Color_Type_Name,
          Department_Status_
        ], connection).result();

        rs(result);

      } catch (err) {
        console.error("❌ Error in Save_Department:", err);
        rej(err);
      } finally {
        if (connection) connection.release();
      }
    });
  }
  ,
  Delete_Department: function (Department_Id_, callback) {
    return db.query("CALL Delete_Department(@Department_Id_ :=?)", [Department_Id_], callback);
  }
  ,
  Get_Department: function (Department_Id_, callback) {
    return db.query("CALL Get_Department(@Department_Id_ :=?)", [Department_Id_], callback);
  }
  ,
  Get_Department_InUser: function (callback) {
    return db.query("CALL Get_Department_InUser()", [], callback);
  }
  ,
  Search_Department: function (Department_Name_, callback) {
    if (Department_Name_ === 'undefined' || Department_Name_ === '' || Department_Name_ === undefined)
      Department_Name_ = '';
    return db.query("CALL Search_Department(@Department_Name_ :=?)", [Department_Name_], callback);
  }
  ,
  Search_Branch_Department_Typeahead: function (Department_Id_, Department_Name_, callback) {
    if (Department_Name_ === 'undefined' || Department_Name_ === '' || Department_Name_ === undefined)
      Department_Name_ = '';
    return db.query("CALL Search_Branch_Department_Typeahead(@Department_Id_ :=?,@Department_Name_ :=?)",
      [Department_Id_, Department_Name_], callback);
  }
  ,

  Search_Chanel_Department_Typeahead: function (Department_Id_, Login_User_Id_, Department_Name_, callback) {
    if (Department_Name_ === 'undefined' || Department_Name_ === '' || Department_Name_ === undefined)
      Department_Name_ = '';
    return db.query("CALL Search_Chanel_Department_Typeahead(@Department_Id_ :=?,@Login_User_Id_ :=?,@Department_Name_ :=?)",
      [Department_Id_, Login_User_Id_, Department_Name_], callback);
  }
  ,
  Search_Branch_Department_Typeaheadnew: function (Department_Id_, Login_User_Id_, Department_Name_, callback) {
    if (Department_Name_ === 'undefined' || Department_Name_ === '' || Department_Name_ === undefined)
      Department_Name_ = '';
    return db.query("CALL Search_Branch_Department_Typeaheadnew(@Department_Id_ :=?,@Login_User_Id_ :=?,@Department_Name_ :=?)",
      [Department_Id_, Login_User_Id_, Department_Name_], callback);
  }
  ,



  Search_Branch_Department_Typeahead_Byusers: function (Department_Id_, Department_Name_, Login_User_Id_, User_Type_, callback) {
    if (Department_Name_ === 'undefined' || Department_Name_ === '' || Department_Name_ === undefined)
      Department_Name_ = '';
    return db.query("CALL Search_Branch_Department_Typeahead_Byusers(@Department_Id_ :=?,@Department_Name_ :=?,@Login_User_Id_ :=?,@User_Type_ :=?)",
      [Department_Id_, Department_Name_, Login_User_Id_, User_Type_], callback);
  }
  ,



  Search_Department_Typeahead: function (Student_Id_, callback) {
    // if(Department_Name_==='undefined'||Department_Name_===''||Department_Name_===undefined )
    // Department_Name_='';
    return db.query("CALL Search_Department_Typeahead(@Student_Id_ :=?)", [Student_Id_], callback);
  }
  ,


  Search_Department_Typeahead_Tasknew: function (Student_Id_, callback) {
    // if(Department_Name_==='undefined'||Department_Name_===''||Department_Name_===undefined )
    // Department_Name_='';
    return db.query("CALL Search_Department_Typeahead_Tasknew(@Student_Id_ :=?)", [Student_Id_], callback);
  }
  ,


  Search_DefaultDepartment_User_Typeahead: function (Department_Id_, callback) {
    // if(Department_Name_==='undefined'||Department_Name_===''||Department_Name_===undefined )
    // Department_Name_='';
    return db.query("CALL Search_DefaultDepartment_User_Typeahead(@Department_Id_ :=?)", [Department_Id_], callback);
  }
  ,



  Search_Branch_User_Typeahead: function (Branch_Id_, User_Details_Name_, callback) {
    if (User_Details_Name_ === 'undefined' || User_Details_Name_ === '' || User_Details_Name_ === undefined)
      User_Details_Name_ = '';
    return db.query("CALL Search_Branch_User_Typeahead(@Branch_Id_ :=?,@User_Details_Name_ :=?)", [Branch_Id_, User_Details_Name_], callback);
  },

  Search_Department_User_Typeahead: function (Branch_Id_, Department_Id_, Users_Name_, callback) {
    if (Users_Name_ === 'undefined' || Users_Name_ === '' || Users_Name_ === undefined)
      Users_Name_ = '';
    return db.query("CALL Search_Department_User_Typeahead(@Branch_Id_ :=?,@Department_Id_ :=?,@Users_Name_ :=?)",
      [Branch_Id_, Department_Id_, Users_Name_], callback);
  },
  Search_Department_User_Typeahead_student: function (Branch_Id_, Department_Id_, Users_Name_, Login_User_Id_, callback) {
    if (Users_Name_ === 'undefined' || Users_Name_ === '' || Users_Name_ === undefined)
      Users_Name_ = '';
    return db.query("CALL Search_Department_User_Typeahead_student(@Branch_Id_ :=?,@Department_Id_ :=?,@Users_Name_ :=?,@Login_User_Id_ :=?)",
      [Branch_Id_, Department_Id_, Users_Name_, Login_User_Id_], callback);
  },

  Search_DSEUser_Typeahead: function (Users_Name_, callback) {
    if (Users_Name_ === 'undefined' || Users_Name_ === '' || Users_Name_ === undefined)
      Users_Name_ = '';
    return db.query("CALL Search_DSEUser_Typeahead(@Users_Name_ :=?)",
      [Users_Name_], callback);
  },


  Search_Default_Department_Typeahead: function (Department_Name_, callback) {
    if (Department_Name_ === 'undefined' || Department_Name_ === '' || Department_Name_ === undefined)
      Department_Name_ = '';
    return db.query("CALL Search_Default_Department_Typeahead(@Department_Name_ :=?)",
      [Department_Name_], callback);
  },

  Search_Department_User_Typeahead_Task: function (Department_Id_, callback) {
    // if(Users_Name_==='undefined'||Users_Name_===''||Users_Name_===undefined )
    // Users_Name_='';
    return db.query("CALL Search_Department_User_Typeahead_Task(@Department_Id_ :=?)",
      [Department_Id_], callback);
  }
  ,

  Search_Department_User_Typeahead_Tasknew: function (Department_Id_, Student_Id_, callback) {
    // if(Users_Name_==='undefined'||Users_Name_===''||Users_Name_===undefined )
    // Users_Name_='';
    return db.query("CALL Search_Department_User_Typeahead_Tasknew(@Department_Id_ :=?,@Student_Id_ :=?)",
      [Department_Id_, Student_Id_], callback);
  }
  ,



  Search_Department_User_Typeahead_New: function (Branch_Id_, Department_Id_, Users_Name_, Usertype_, callback) {
    if (Users_Name_ === 'undefined' || Users_Name_ === '' || Users_Name_ === undefined)
      Users_Name_ = '';
    return db.query("CALL Search_Department_User_Typeahead_New(@Branch_Id_ :=?,@Department_Id_ :=?,@Users_Name_ :=?,@Usertype_ :=?)",
      [Branch_Id_, Department_Id_, Users_Name_, Usertype_], callback);
  }
  ,

  Search_Department_Status_Typeahead: function (Department_Id_, Department_Status_Name_, callback) {
    if (Department_Status_Name_ === 'undefined' || Department_Status_Name_ === '' || Department_Status_Name_ === undefined)
      Department_Status_Name_ = '';
    return db.query("CALL Search_Department_Status_Typeahead(@Department_Id_ :=?,@Department_Status_Name_ :=?)",
      [Department_Id_, Department_Status_Name_], callback);
  }
  ,





  Search_Department_Transfer_Status_Typeahead: function (Department_Id_, Department_Status_Name_, callback) {
    if (Department_Status_Name_ === 'undefined' || Department_Status_Name_ === '' || Department_Status_Name_ === undefined)
      Department_Status_Name_ = '';
    return db.query("CALL Search_Department_Transfer_Status_Typeahead(@Department_Id_ :=?,@Department_Status_Name_ :=?)",
      [Department_Id_, Department_Status_Name_], callback);
  }
  ,

  Search_Substatus_Typeahead: function (Status_Id_, Sub_Status_Name_, callback) {
    if (Sub_Status_Name_ === 'undefined' || Sub_Status_Name_ === '' || Sub_Status_Name_ === undefined)
      Sub_Status_Name_ = '';
    return db.query("CALL Search_Substatus_Typeahead(@Status_Id_ :=?,@Sub_Status_Name_ :=?)",
      [Status_Id_, Sub_Status_Name_], callback);
  }
  ,

  Load_Status_Dropdown: function (callback) {
    return db.query("CALL Load_Status_Dropdown()", [], callback);
  },

  Get_Status_Selection_Edit: function (Department_Id_, callback) {
    return db.query("CALL Get_Status_Selection_Edit(@Department_Id_ :=?)", [Department_Id_], callback);
  },
  Search_Department_Status: function (Department_Status_Name_, callback) {
    if (Department_Status_Name_ === 'undefined' || Department_Status_Name_ === '' || Department_Status_Name_ === undefined)
      Department_Status_Name_ = '';
    return db.query("CALL Search_Department_Status(@Department_Status_Name_ :=?)", [Department_Status_Name_], callback);
  },
  //  Get_Menu_Status:function(Menu_Id_,Login_User_,callback)
  //  { 
  //    return db.query("CALL Get_Menu_Status(@Menu_Id_ :=?,@Login_User_:=?)", [Menu_Id_,Login_User_],callback);
  //  } ,


  Load_StatusType: function (callback) {
    return db.query("CALL Load_StatusType()", [], callback);
  },

  Load_DefaultDepartment: function (callback) {
    return db.query("CALL Load_DefaultDepartment()", [], callback);
  },


  Search_DefultUser_Typeahead: function (Branch_Id_, Department_Id_, callback) {
    // if(Department_Name_==='undefined'||Department_Name_===''||Department_Name_===undefined )
    // Department_Name_='';
    return db.query("CALL Search_DefultUser_Typeahead(@Branch_Id_ :=?,@Department_Id_ :=?)", [Branch_Id_, Department_Id_], callback);
  }
  ,


  Search_BranchDefaultDepartment_Typeahead: function (Branch_Id_, callback) {
    // if(Department_Name_==='undefined'||Department_Name_===''||Department_Name_===undefined )
    // Department_Name_='';
    return db.query("CALL Search_BranchDefaultDepartment_Typeahead(@Branch_Id_ :=?)", [Branch_Id_], callback);
  }
  ,

  Search_DefaultDepartmentStatus_Typeahead: function (Branch_Id_, Department_Id_, callback) {
    // if(Department_Name_==='undefined'||Department_Name_===''||Department_Name_===undefined )
    // Department_Name_='';
    return db.query("CALL Search_DefaultDepartmentStatus_Typeahead(@Branch_Id_ :=?,@Department_Id_ :=?)", [Branch_Id_, Department_Id_], callback);
  },

  /*** Added on 01-11-2024 */

  Search_Branch_Department_TypeaheadNew: function (Department_Name_, callback) {
    if (Department_Name_ === 'undefined' || Department_Name_ === '' || Department_Name_ === undefined)
      Department_Name_ = '';
    return db.query("CALL Search_Branch_Department_TypeaheadNew(@Department_Name_ :=?)", [Department_Name_], callback);
  },


  Search_Department_User_Typeahead_Latest: function (Department_Id_, Users_Name_, callback) {
    console.log('Department_Id_ : ', Department_Id_)
    if (Users_Name_ === 'undefined' || Users_Name_ === '' || Users_Name_ === undefined)
      Users_Name_ = '';
    return db.query("CALL Search_Department_User_Typeahead_Latest(@Department_Id_ :=?,@Users_Name_ :=?)",
      [Department_Id_, Users_Name_], callback);
  },




};
module.exports = Department;

