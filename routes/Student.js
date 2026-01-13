var express = require("express");
var router = express.Router();
var Student = require("../models/Student");
const upload = require("../helpers/multer-helper");
const axios = require("axios");
const nodemailer = require("nodemailer");

router.post("/Make_A_Call/", async (req, res) => {
  try {

    const { Phone_No, Agent_Id, Login_User, call_timeout = 300, custom_identifier } = req.body;

    if (!Phone_No) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    // Step 1: Authenticate with Tata Tele
    let authToken;
    try {
      const authResponse = await axios.post(
        "https://api-smartflo.tatateleservices.com/v1/auth/login",
        {
          email: process.env.TATA_TELE_EMAIL || "OR169410",
          password: process.env.TATA_TELE_PASSWORD || "Fl0wer$@25",
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      authToken = authResponse.data.access_token;
      if (!authToken) throw new Error("No access token received from Tata Tele");
      console.log("✅ Auth token acquired");
    } catch (authErr) {
      console.error("❌ Authentication failed:", authErr.message);
      return res.status(401).json({ success: false, message: "Authentication failed" });
    }

    // Step 2: Get the agent's Tele_ID from the DB
    let agentTeleID;
    try {
      // const agentResult = await new Promise((resolve, reject) => {
      //   Student.Get_Agent_TeleID(Agent_Id, (err, result) => {
      //     if (err) reject(err);
      //     else resolve(result);
      //   });
      // });

      const userResult = await new Promise((resolve, reject) => {
        Student.Get_User_TeleID(Login_User, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      console.log("userResult", userResult);

      // agentTeleID = userResult?.[0]?.Mobile || null;
      agentTeleID = userResult?.[0]?.Mobile || null;

      console.log("✅ Agent Tele_ID fetched:", agentTeleID);

    } catch (err) {
      console.error("❌ Failed to fetch agent tele ID:", err.message);
      return res.status(500).json({ success: false, message: "Agent lookup failed" });
    }

    if (!agentTeleID) {
      return res.status(400).json({ success: false, message: "No valid Tele_ID found for agent" });
    }

    // Step 3: Clean and format the destination number
    const destinationNumber = Phone_No.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(destinationNumber)) {
      return res.status(400).json({ success: false, message: "Invalid destination phone number" });
    }

    // Step 4: Prepare payload
    const requestData = {
      agent_number: agentTeleID,
      destination_number: destinationNumber,
      async: 1,
      call_timeout: parseInt(call_timeout),
      get_call_id: 1,
      ...(custom_identifier && { custom_identifier }),
    };

    console.log('requestData:', JSON.stringify(requestData, null, 2));
    // Step 5: Make call request
    const callResponse = await axios.post(
      "https://api-smartflo.tatateleservices.com/v1/click_to_call",
      requestData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📞 Call initiated:", callResponse.data);

    return res.json({ success: true, data: callResponse.data });
  } catch (error) {
    console.error("❌ Call error:", error?.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to initiate call",
      error: error.response?.data?.message || error.message,
    });
  }
});

router.get("/Load_Enquiryfor/", function (req, res, next) {
  try {
    Student.Load_Enquiryfor(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Load_ChatUser_Details/:Value_?/:Login_User_?",
  function (req, res, next) {
    try {
      console.log("req.params.Value_: ", req.params.Value_);
      console.log("req.params.Login_User_: ", req.params.Login_User_);
      Student.Load_ChatUser_Details(
        req.params.Value_,

        req.params.Login_User_,

        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Get_FollowUp_History_Withdate/:Student_Id_?",
  async (req, res, next) => {
    try {
      const result = await Student.Get_FollowUp_History_Withdate(
        req.params.Student_Id_
      );
      console.log(result);
      res.json(result);
    } catch (e) {
      res.send(e);
    } finally {
    }
  }
);

router.post("/Save_Qualification/", function (req, res, next) {
  try {
    Student.Save_Qualification(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Delete_Qualificationdetails/:Qualification_Id_?",
  function (req, res, next) {
    try {
      Student.Delete_Qualificationdetails(
        req.params.Qualification_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Delete_Pre_Visa/:Student_Checklist_Master_Id_?",
  function (req, res, next) {
    try {
      Student.Delete_Pre_Visa(
        req.params.Student_Checklist_Master_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Delete_Pre_Admission/:Student_Preadmission_Checklist_Master_Id_?",
  function (req, res, next) {
    try {
      Student.Delete_Pre_Admission(
        req.params.Student_Preadmission_Checklist_Master_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Delete_Review/:Review_Id_?", function (req, res, next) {
  try {
    Student.Delete_Review(req.params.Review_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Get_QualificationDetails/:Student_Id_?",
  function (req, res, next) {
    try {
      Student.Get_QualificationDetails(
        req.params.Student_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Load_Conditions_Subdata_Edit/:Application_details_Id_?",
  function (req, res, next) {
    console.log(req);
    try {
      Student.Load_Conditions_Subdata_Edit(
        req.params.Application_details_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Get_Previsa_Details/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_Previsa_Details(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Get_Preadmission_Details/:Student_Id_?",
  function (req, res, next) {
    try {
      Student.Get_Preadmission_Details(
        req.params.Student_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Get_ReviewDetails/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_ReviewDetails(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post("/Save_work_experience/", function (req, res, next) {
  try {
    Student.Save_work_experience(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post("/Save_Cas_Followup/", function (req, res, next) {
  try {
    Student.Save_Cas_Followup(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post("/Save_Profile/", function (req, res, next) {
  try {
    Student.Save_Profile(req.body, async function (err, rows) {
      if (err) {
        console.log("err", err);
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
    console.log(e);
    console.error("Exception caught in Save_Profile:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/Save_Ielts_Details/", function (req, res, next) {
  try {
    Student.Save_Ielts_Details(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Delete_Workexperiencedetails/:Work_Experience_Id_?",
  function (req, res, next) {
    try {
      Student.Delete_Workexperiencedetails(
        req.params.Work_Experience_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Delete_Visa_Task/:Student_Task_Id?", function (req, res, next) {
  try {
    Student.Delete_Visa_Task(req.params.Student_Task_Id, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Delete_Ielts_Details/:Ielts_Details_Id_?",
  function (req, res, next) {
    try {
      Student.Delete_Ielts_Details(
        req.params.Ielts_Details_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Get_WorkexperienceDetails/:Student_Id_?",
  function (req, res, next) {
    try {
      Student.Get_WorkexperienceDetails(
        req.params.Student_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);



router.get(
  "/Get_Followup_Date_Generic/:Student_Id_?/:Department_Id_?/:Status_Id_?",
  function (req, res, next) {
    try {
      Student.Get_Followup_Date_Generic(
        req.params.Student_Id_,
        req.params.Department_Id_,
         req.params.Status_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Get_Visa_Task/:Student_Id_?/:Task_Group_Id_?",
  function (req, res, next) {
    try {
      Student.Get_Visa_Task(
        req.params.Student_Id_,
        req.params.Task_Group_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Get_Previsa_Task/:Student_Id_?/:Task_Group_Id_?",
  function (req, res, next) {
    try {
      Student.Get_Previsa_Task(
        req.params.Student_Id_,
        req.params.Task_Group_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Get_Preadmission_Task/:Student_Id_?/:Task_Group_Id_?",
  function (req, res, next) {
    try {
      Student.Get_Preadmission_Task(
        req.params.Student_Id_,
        req.params.Task_Group_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Get_Task_History/:Student_Task_Id_?", function (req, res, next) {
  try {
    Student.Get_Task_History(req.params.Student_Task_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

//  router.get('/Search_Notification/:Login_User_?/:Page_Index1_?/:Page_Index2_?',function(req,res,next)
// {
// try
// {
//
//     Student.Search_Notification(req.params.Login_User_,req.params.Page_Index1_,req.params.Page_Index2_, function (err, rows)
// {
//  if (err)
//  {
//
//  res.json(err);
//  }
//  else
//  {
//    res.json(rows);
//  }
//  });
//  }
// catch (e)
// {
//
// }
// finally
// {
// }
//  });

router.get(
  "/Search_Notification/:Login_User_?/:notification_type_?/:Sort_By_?/:Page_Index1_?/:Page_Index2_?",
  function (req, res, next) {
    try {
      Student.Search_Notification(
        req.params.Login_User_,
        req.params.notification_type_,
        req.params.Sort_By_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/SendLInk/:Student_Id_?/:Login_User_Id_?",
  function (req, res, next) {
    try {
      Student.SendLInk(
        req.params.Student_Id_,
        req.params.Login_User_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

//  router.get('/Load_Application_Fees_Dropdown/:Student_Id_?', function (req, res, next) {
//     try {
// 		Student.Load_Application_Fees_Dropdown(req.params.Student_Id_,function (err, rows) {
//         if (err) {
//           res.json(err);
//
//         } else {
//           res.json(rows);
// 		  console.log(rows)
//         }
//       });
//     } catch (e) {
//
//     } finally {
//     }
//   });

router.get(
  "/Load_Application_Fees_Dropdown/:Student_Id_?",
  function (req, res, next) {
    try {
      Student.Load_Application_Fees_Dropdown(
        req.params.Student_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Search_SendMail_User_Typeahead_Fllowup/:Student_Id_?",
  function (req, res, next) {
    try {
      Student.Search_SendMail_User_Typeahead_Fllowup(
        req.params.Student_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Get_Proceeding_Details/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_Proceeding_Details(
      req.params.Student_Id_,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

router.get("/Get_Ielts_Details/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_Ielts_Details(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Get_Student_PageLoadData_Dropdowns/", function (req, res, next) {
  try {
    Student.Get_Student_PageLoadData_Dropdowns(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Load_Shore/", function (req, res, next) {
  try {
    Student.Load_Shore(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post("/Save_Student", upload.array("myFile"), (req, res, next) => {
  try {
    const file = req.files;
    var Passport_Copy_Image = "";
    var IELTS_Image = "";
    var Passport_Photo_Image = "";
    var Tenth_Certificate_Image = "";
    var Work_Experience_Image = "";
    var Resume_Image = "";
    var Photo_ = [];
    var CheckList_ = [];
    if (!file) {
    } else {
      for (var i = 0; i < req.body.Document_File_Array; i++) {
        if (i == req.body.Passport_Copy_Image)
          Passport_Copy_Image = file[i].filename;
        else if (i == req.body.IELTS_Image) IELTS_Image = file[i].filename;
        else if (i == req.body.Resume_Image) Resume_Image = file[i].filename;
        else if (i == req.body.Passport_Photo_Image)
          Passport_Photo_Image = file[i].filename;
        else if (i == req.body.Tenth_Certificate_Image)
          Tenth_Certificate_Image = file[i].filename;
        else if (i == req.body.Work_Experience_Image)
          Work_Experience_Image = file[i].filename;
      }
      var Document_Name_Temp = "";
      var File_Name_Temp = "";
      var index_Temp = 0;
      for (var i = req.body.Document_File_Array; i < file.length; i++) {
        index_Temp = i - parseInt(req.body.Document_File_Array);

        Document_Name_Temp = req.body["Document_Array" + index_Temp];
        File_Name_Temp = req.body["Document_File_Name" + index_Temp];
        Photo_.push({
          File_Name: file[i].filename,
          Document_Name: Document_Name_Temp,
          Document_File_Name: File_Name_Temp,
        });
      }

      var Student_Checklist_Id_Temp = "";
      Check_List_Id_Temp = "";
      Applicable_Temp = Boolean;
      Check_Name_Temp = "";
      Checklist_Status_Temp = Boolean;
      var index_Temp = 0;
      var Checklist_Array_length = req.body["Checklist_Array_length"];
      for (var i = 0; i < Checklist_Array_length; i++) {
        Check_List_Id_Temp = req.body["Check_List_Id" + index_Temp];
        Applicable_Temp = req.body["Checklist_Array_Apllicable" + index_Temp];
        if (Applicable_Temp == "true") Applicable_Temp = 1;
        else Applicable_Temp = 0;

        Checklist_Status_Temp = req.body["Checklist_Array_Status" + index_Temp];
        if (Checklist_Status_Temp == "true") Checklist_Status_Temp = 1;
        else Checklist_Status_Temp = 0;

        CheckList_.push({
          Check_List_Id: Check_List_Id_Temp,
          Applicable: Applicable_Temp,
          Checklist_Status: Checklist_Status_Temp,
        });
      }
    }

    var Photo_json = JSON.stringify(Photo_);
    var CheckList_Json = JSON.stringify(CheckList_);
    console.log(CheckList_Json);
    var Student1;
    if (
      req.body.Student_Name != "" &&
      req.body.Student_Name != undefined &&
      req.body.Student_Name != null
    ) {
      Student1 = {
        Student_Id: req.body.Student_Id_Student,
        Agent_Id: req.body.Agent_Id,
        Entry_Date: req.body.Entry_Date,
        Student_Name: req.body.Student_Name,
        Last_Name: req.body.Last_Name,
        Gender: req.body.Gender,
        Address1: req.body.Address1,
        Address2: req.body.Address2,
        Pincode: req.body.Pincode,
        Email: req.body.Email,
        Phone_Number: req.body.Phone_Number,
        Alternative_Phone_Number: req.body.Alternative_Phone_Number,
        Alternative_Email: req.body.Alternative_Email,
        Whatsapp: req.body.Whatsapp,
        Facebook: req.body.Facebook,
        Dob: req.body.Dob,
        Country_Name: req.body.Country_Name,
        Promotional_Code: req.body.Promotional_Code,
        Student_Status_Id: req.body.Student_Status_Id,
        Enquiry_Source_Id: req.body.Enquiry_Source_Id,
        Passport_Copy_File_Name: req.body.Passport_Copy_File_Name,
        IELTS_File_Name: req.body.IELTS_File_Name,
        Tenth_Certificate_File_Name: req.body.Tenth_Certificate_File_Name,
        Work_Experience_File_Name: req.body.Work_Experience_File_Name,
        Resume_File_Name: req.body.Resume_File_Name,
        Passport_Photo_File_Name: req.body.Passport_Photo_File_Name,
        Password: req.body.Password,
        Passport_Copy: Passport_Copy_Image,
        IELTS: IELTS_Image,
        Passport_Photo: Passport_Photo_Image,
        Tenth_Certificate: Tenth_Certificate_Image,
        Work_Experience: Work_Experience_Image,
        Resume: Resume_Image,
        College_University: req.body.College_University,
        Programme_Course: req.body.Programme_Course,
        Intake: req.body.Intake,
        Year: req.body.Year,
        Reference: req.body.Reference,
        Visa_Submission_Date: req.body.Visa_Submission_Date,
        Activity: req.body.Activity,
        Course_Link: req.body.Course_Link,
        Agent: req.body.Agent,
        Student_Remark: req.body.Student_Remark,
        Status_Details: req.body.Status_Details,

        sslc_year: req.body.sslc_year,
        sslc_institution: req.body.sslc_institution,
        sslc_markoverall: req.body.sslc_markoverall,
        sslc_englishmark: req.body.sslc_englishmark,
        plustwo_year: req.body.plustwo_year,
        plustwo_institution: req.body.plustwo_institution,
        plustwo_markoverall: req.body.plustwo_markoverall,
        plustwo_englishmark: req.body.plustwo_englishmark,
        graduation_year: req.body.graduation_year,
        graduation_institution: req.body.graduation_institution,
        graduation_markoverall: req.body.graduation_markoverall,
        graduation_englishmark: req.body.graduation_englishmark,
        postgraduation_year: req.body.postgraduation_year,
        postgraduation_institution: req.body.postgraduation_institution,
        postgraduation_markoverall: req.body.postgraduation_markoverall,
        postgraduation_englishmark: req.body.postgraduation_englishmark,
        other_year: req.body.other_year,
        other_instituation: req.body.other_instituation,
        other_markoverall: req.body.other_markoverall,
        other_englishmark: req.body.other_englishmark,
        exp_institution_1: req.body.exp_institution_1,
        exp_institution_2: req.body.exp_institution_2,
        exp_institution_3: req.body.exp_institution_3,
        exp_institution_4: req.body.exp_institution_4,
        exp_designation_1: req.body.exp_designation_1,
        exp_designation_2: req.body.exp_designation_2,
        exp_designation_3: req.body.exp_designation_3,
        exp_designation_4: req.body.exp_designation_4,
        IELTS_Overall: req.body.IELTS_Overall,
        IELTS_Listening: req.body.IELTS_Listening,
        IELTS_Reading: req.body.IELTS_Reading,
        IELTS_Writting: req.body.IELTS_Writting,
        IELTS_Speaking: req.body.IELTS_Speaking,
        Passport_No: req.body.Passport_No,
        Passport_fromdate: req.body.Passport_fromdate,
        Passport_Todate: req.body.Passport_Todate,

        Enquiryfor_Id: req.body.Enquiryfor_Id,
        Enquirfor_Name: req.body.Enquirfor_Name,
        Shore_Id: req.body.Shore_Id,
        Shore_Name: req.body.Shore_Name,
        Spouse_Name: req.body.Spouse_Name,
        Date_of_Marriage: req.body.Date_of_Marriage,
        Spouse_Occupation: req.body.Spouse_Occupation,
        Spouse_Qualification: req.body.Spouse_Qualification,
        Dropbox_Link: req.body.Dropbox_Link,
        No_of_Kids_and_Age: req.body.No_of_Kids_and_Age,
        Previous_Visa_Rejection: req.body.Previous_Visa_Rejection,

        exp_tenure_from_1: req.body.exp_tenure_from_1,
        exp_tenure_from_2: req.body.exp_tenure_from_2,
        exp_tenure_from_3: req.body.exp_tenure_from_3,
        exp_tenure_from_4: req.body.exp_tenure_from_4,
        exp_tenure_to_1: req.body.exp_tenure_to_1,
        exp_tenure_to_2: req.body.exp_tenure_to_2,
        exp_tenure_to_3: req.body.exp_tenure_to_3,
        exp_tenure_to_4: req.body.exp_tenure_to_4,

        LOR_1_Id: req.body.LOR_1_Id,
        LOR_2_Id: req.body.LOR_2_Id,
        MOI_Id: req.body.MOI_Id,
        SOP_Id: req.body.SOP_Id,
        Ielts_Id: req.body.Ielts_Id,
        Passport_Id: req.body.Passport_Id,
        Resume_Id: req.body.Resume_Id,

        Middle_Name: req.body.Middle_Name,
        Institution_Address_sslc: req.body.Institution_Address_sslc,
        Organization_Address_exp1: req.body.Organization_Address_exp1,
        Country_of_Birth: req.body.Country_of_Birth,
        City_of_Birth: req.body.City_of_Birth,
        Institution_Address_plustwo: req.body.Institution_Address_plustwo,
        Institution_Address_graduation: req.body.Institution_Address_graduation,
        Institution_Address_Postgraduation:
          req.body.Institution_Address_Postgraduation,
        Organization_Address_exp2: req.body.Organization_Address_exp2,
        Organization_Address_exp3: req.body.Organization_Address_exp3,
        Academic_Startdate_sslc: req.body.Academic_Startdate_sslc,
        Academic_Startdate_plustwo: req.body.Academic_Startdate_plustwo,
        Academic_Startdate_Graduation: req.body.Academic_Startdate_Graduation,
        Academic_Startdate_PG: req.body.Academic_Startdate_PG,
        State: req.body.State,
        City: req.body.City,
        Mailing_Country: req.body.Mailing_Country,
        Mailing_State: req.body.Mailing_State,
        Mailing_City: req.body.Mailing_City,
        Mailing_Pincode: req.body.Mailing_Pincode,
        Passport_Name: req.body.Passport_Name,
        Passport_Issue_Country: req.body.Passport_Issue_Country,
        Nationality: req.body.Nationality,
        Citizenship: req.body.Citizenship,
        Emergency_Contact_Name: req.body.Emergency_Contact_Name,
        Emergency_Contact_Phone: req.body.Emergency_Contact_Phone,
        Emergency_Contact_Email: req.body.Emergency_Contact_Email,
        Emergency_Contact_Relation: req.body.Emergency_Contact_Relation,
        Academic_enddate_sslc: req.body.Academic_enddate_sslc,
        Academic_enddate_plustwo: req.body.Academic_enddate_plustwo,
        Academic_enddate_Graduation: req.body.Academic_enddate_Graduation,
        Academic_enddate_PG: req.body.Academic_enddate_PG,
        Board_Name_sslc: req.body.Board_Name_sslc,
        Board_Name_plustwo: req.body.Board_Name_plustwo,
        Board_Name_Graduation: req.body.Board_Name_Graduation,
        Board_Name_PG: req.body.Board_Name_PG,
        Address_of_Institution_sslc: req.body.Address_of_Institution_sslc,
        Address_of_Institution_plustwo: req.body.Address_of_Institution_plustwo,
        Address_of_Institution_Graduation:
          req.body.Address_of_Institution_Graduation,
        Address_of_Institution_pg: req.body.Address_of_Institution_pg,
        Address_of_Organization_1: req.body.Address_of_Organization_1,
        Address_of_Organization_2: req.body.Address_of_Organization_2,
        Address_of_Organization_3: req.body.Address_of_Organization_3,
        Organization_Activities_1: req.body.Organization_Activities_1,
        Organization_Activities_2: req.body.Organization_Activities_2,
        Organization_Activities_3: req.body.Organization_Activities_3,
        Marital_Status_Id: req.body.Marital_Status_Id,
        Marital_Status_Name: req.body.Marital_Status_Name,

        Program_Course_Id: req.body.Program_Course_Id,
        Profile_University_Id: req.body.Profile_University_Id,
        Profile_Country_Id: req.body.Profile_Country_Id,
        //  "Created_On":req.body.Created_On,
        Intake_Id: req.body.Intake_Id,
        Enquiry_Source_Name: req.body.Enquiry_Source_Name,
        Login_Branch: req.body.Login_Branch,
      };
    }
    var jsondata1 = JSON.stringify(Student1);
    //console.log(Student1);

    var Followup;
    if (
      req.body.Branch != "" &&
      req.body.Branch != undefined &&
      req.body.Branch != null
    ) {
      var Followup = {
        Next_FollowUp_Date: req.body.Next_FollowUp_Date,
        Department: req.body.Department,
        Status: req.body.Status,
        User_Id: req.body.User_Id,
        Student_Id: req.body.Student_Id,
        Branch: req.body.Branch,
        Remark: req.body.Remark,
        Remark_id: req.body.Remark_Id,
        By_User_Id: req.body.By_User_Id,
        Department_FollowUp: req.body.Department_FollowUp,
        Department_Name: req.body.Department_Name,
        Branch_Name: req.body.Branch_Name,
        Department_Status_Name: req.body.Department_Status_Name,
        User_Details_Name: req.body.User_Details_Name,
        By_User_Name: req.body.By_User_Name,
      };
    }
    // console.log("Followup",Followup);
    var jsondata2 = JSON.stringify(Followup);

    var Student_Data = {
      Student: jsondata1,
      Followup: jsondata2,
      student_document: Photo_json,
      student_checklist: CheckList_Json,
    };
    Student.Save_Student(Student_Data, async function (err, rows) {
      if (err) {
        // console.log(sslc_year)
        return 1;
      } else {
        // console.log('Student_Data: ', Student_Data);
        // console.log("rowas",rows[0]);

        //  console.log('department statuse',rows)
        //  const sendMailFlag = parseInt(rows.Deparment_Status_Send_Mail_Check);
        //  console.log("sendMailFlag",sendMailFlag);

        return res.json(rows);
      }
    });
  } catch (err) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  } finally {
  }
});

// router.post(
// 	"/Save_ApplicationDetails_Datas",
// 	upload.array("myFile"),
// 	(req, res, next) => {
// 		try {
// 			const file = req.files;

// 			var Photo_ = [];

// 			if (!file) {
// 			} else {
// 				var ApplicationDocument_Name_Temp = "";
// 				var ApplicationFile_Name_Temp = "";
// 				var index_Temp = 0;
// 				for (
// 					var i = req.body.ApplicationDocument_File_Array;
// 					i < file.length;
// 					i++
// 				) {
// 					index_Temp = i - parseInt(req.body.ApplicationDocument_File_Array);

// 					ApplicationDocument_Name_Temp =
// 						req.body["ApplicationDocument_Array" + index_Temp];
// 					ApplicationFile_Name_Temp =
// 						req.body["ApplicationDocument_File_Name" + index_Temp];
// 					Photo_.push({
// 						ApplicationFile_Name: file[i].filename,
// 						ApplicationDocument_Name: ApplicationDocument_Name_Temp,
// 						ApplicationDocument_File_Name: ApplicationFile_Name_Temp,
// 					});
// 				}

// 				var Photo_json = JSON.stringify(Photo_);

// 				var Application1;
// 				if (
// 					req.body.Country_Name != "" &&
// 					req.body.Country_Name != undefined &&
// 					req.body.Country_Name != null
// 				) {
// 					Application1 = {
// 						Application_details_Id: req.body.Application_details_Id,
// 						Student_Id: req.body.Student_Id,
// 						Country_Id: req.body.Country_Id,
// 						Country_Name: req.body.Country_Name,
// 						University_Id: req.body.University_Id,
// 						University_Name: req.body.University_Name,
// 						Course_Id: req.body.Course_Id,
// 						Course_Name: req.body.Course_Name,
// 						intake_Id: req.body.intake_Id,
// 						intake_Name: req.body.intake_Name,
// 						Intake_Year_Id: req.body.Intake_Year_Id,
// 						Intake_Year_Name: req.body.Intake_Year_Name,
// 						Date_Of_Applying: req.body.Date_Of_Applying,
// 						Remark: req.body.Remark,
// 						Application_status_Id: req.body.Application_status_Id,
// 						Application_Status_Name: req.body.Application_Status_Name,
// 						Agent_Id: req.body.Agent_Id,
// 						Agent_Name: req.body.Agent_Name,
// 						Reference_No: req.body.Reference_No,
// 						Activation_Status: req.body.Activation_Status,
// 						User_Id: req.body.User_Id,
// 						Application_No: req.body.Application_No,
// 						Student_Reference_Id: req.body.Student_Reference_Id,
// 					};
// 				}
// 				var jsondata1 = JSON.stringify(Application1);
// 				//console.log(Student1);
// 				var Application_Data = {
// 					Application: jsondata1,
// 					application_document: Photo_json,
// 				};
// 				Student.Save_ApplicationDetails_Datas(
// 					Application_Data,
// 					function (err, rows) {
// 						if (err) {
// 							;

// 							return 1;
// 						} else {
// 							console.log(rows);
// 							return res.json(rows);
// 						}
// 					}
// 				);
// 			}
// 		} catch (err) {
// 			const error = new Error("Please upload a file");
// 			error.httpStatusCode = 400;
// 			return next(error);
// 		} finally {
// 		}
// 	}
// );

router.post(
  "/Save_ApplicationDetails_Datas",
  upload.array("myFile"),
  (req, res, next) => {
    try {
      const file = req.files;

      var Photo_ = [];

      if (!file) {
      } else {
        var ApplicationDocument_Name_Temp = "";
        var ApplicationFile_Name_Temp = "";
        var index_Temp = 0;
        for (
          var i = req.body.ApplicationDocument_File_Array;
          i < file.length;
          i++
        ) {
          index_Temp = i - parseInt(req.body.ApplicationDocument_File_Array);

          ApplicationDocument_Name_Temp =
            req.body["ApplicationDocument_Array" + index_Temp];
          ApplicationFile_Name_Temp =
            req.body["ApplicationDocument_File_Name" + index_Temp];
          Photo_.push({
            ApplicationFile_Name: file[i].filename,
            ApplicationDocument_Name: ApplicationDocument_Name_Temp,
            ApplicationDocument_File_Name: ApplicationFile_Name_Temp,
          });
        }

        var Photo_json = JSON.stringify(Photo_);

        var Application1;
        if (
          req.body.Country_Name != "" &&
          req.body.Country_Name != undefined &&
          req.body.Country_Name != null
        ) {
          Application1 = {
            Application_details_Id: req.body.Application_details_Id,
            Student_Id: req.body.Student_Id,
            Country_Id: req.body.Country_Id,
            Country_Name: req.body.Country_Name,
            University_Id: req.body.University_Id,
            University_Name: req.body.University_Name,
            Course_Id: req.body.Course_Id,
            Course_Name: req.body.Course_Name,
            Course_Link: req.body.Course_Link,
            Application_Fees: req.body.Application_Fees,
            intake_Id: req.body.intake_Id,
            intake_Name: req.body.intake_Name,
            Intake_Year_Id: req.body.Intake_Year_Id,
            Intake_Year_Name: req.body.Intake_Year_Name,
            Date_Of_Applying: req.body.Date_Of_Applying,
            Remark: req.body.Remark,
            Application_status_Id: req.body.Application_status_Id,
            Application_Status_Name: req.body.Application_Status_Name,
            Agent_Id: req.body.Agent_Id,
            Agent_Name: req.body.Agent_Name,
            Reference_No: req.body.Reference_No,
            Activation_Status: req.body.Activation_Status,
            User_Id: req.body.User_Id,
            Application_No: req.body.Application_No,
            Student_Reference_Id: req.body.Student_Reference_Id,
            Course_Fee: req.body.Course_Fee,
            Living_Expense: req.body.Living_Expense,
            Preference: req.body.Preference,
            Student_Approved_Status: req.body.Student_Approved_Status,
            Bph_Approved_Status: req.body.Bph_Approved_Status,

            Portal_User_Name: req.body.Portal_User_Name,
            Password: req.body.Password,
            Offer_Student_Id: req.body.Offer_Student_Id,
            Fees_Payment_Last_Date: req.body.Fees_Payment_Last_Date,
            Feespaymentcheck: req.body.Feespaymentcheck,
            Offer_Received: req.body.Offer_Received,
            Duration_Id: req.body.Duration_Id,
            url: req.body.url,
          };
        }
        //console.log(Application1);
        var jsondata1 = JSON.stringify(Application1);
        //console.log(Student1);
        var Application_Data = {
          Application: jsondata1,
          application_document: Photo_json,
        };
        Student.Save_ApplicationDetails_Datas(
          Application_Data,
          function (err, rows) {
            if (err) {
              console.log(err);

              return 1;
            } else {
              //console.log(rows[0][0])
              let arrU = rows[0][0].University_;
              let substring = "University";
              if (arrU.includes(substring)) add_U = "";
              else add_U = "University";

              if (rows[0][0].New_Application_Value_ == 0) {
                data = {
                  messaging_product: "whatsapp",
                  to: "919074018372",
                  type: "template",
                  template: {
                    name: "application_submission",
                    language: {
                      code: "en_US",
                    },
                    components: [
                      {
                        type: "body",
                        parameters: [
                          {
                            type: "text",
                            text: arrU + "" + add_U,
                          },
                          {
                            type: "text",
                            text: rows[0][0].Counsellor_,
                          },
                        ],
                      },
                    ],
                  },
                };
                //console.log(data);
                response = axios
                  .post(
                    "https://graph.facebook.com/v17.0/103994132798021/messages",
                    data,
                    {
                      headers: {
                        "Content-Type": "application/json",
                        Authorization:
                          "Bearer EAADhz3YJdRMBO3YVeNkgnP6pdqy6YXSraWh9MmU5U2hZBVPgAFGZCaST9ItZA3TJo5DdSoZAY8b7R289JIgWzPb8bZBHlUMZBZBueT7QgbSvZC8py5XvJNyP9GqCvttZBhuLv3KNTa5Cgd5jAwg5j4wxBKQFUhB0iw4RxdudQcr3eEX1tsbghogA2tgPzSyURY8fZCyb2k65mMwB2eZCmKC",
                      },
                    }
                  )
                  .then((response) => {
                    console.log(response);
                  })
                  .catch((error) => {
                    // Handle the error here
                    console.error(error);
                  });
              }

              return res.json(rows);
            }
          }
        );
      }
    } catch (err) {
      const error = new Error("Please upload a file");
      error.httpStatusCode = 400;
      return next(error);
    } finally {
    }
  }
);
router.post("/Save_FeesReceipt", upload.array("myFile"), (req, res, next) => {
  try {
    const file = req.files;

    var Photo_ = [];

    if (!file) {
    } else {
      var FeesreceiptDocument_Name_Temp = "";
      var FeesreceiptFile_Name_Temp = "";
      var index_Temp = 0;
      for (
        var i = req.body.FeesreceiptDocument_File_Array;
        i < file.length;
        i++
      ) {
        index_Temp = i - parseInt(req.body.FeesreceiptDocument_File_Array);

        FeesreceiptDocument_Name_Temp =
          req.body["FeesreceiptDocument_Array" + index_Temp];
        FeesreceiptFile_Name_Temp =
          req.body["FeesreceiptDocument_File_Name" + index_Temp];
        Photo_.push({
          FeesreceiptFile_Name: file[i].filename,
          FeesreceiptDocument_Name: FeesreceiptDocument_Name_Temp,
          FeesreceiptDocument_File_Name: FeesreceiptFile_Name_Temp,
        });
      }

      var Photo_json = JSON.stringify(Photo_);

      var Feesreceipt1;
      // if (req.body.Fees_Receipt_Id != 0)
      // {
      Feesreceipt1 = {
        Fees_Receipt_Id: req.body.Fees_Receipt_Id,
        Student_Id: req.body.Student_Id,
        Entry_date: req.body.Entry_date,
        User_Id: req.body.User_Id,
        Description: req.body.Description,
        Fees_Id: req.body.Fees_Id,
        Amount: req.body.Amount,
        Actual_Entry_date: req.body.Actual_Entry_date,
        Fee_Receipt_Branch: req.body.Fee_Receipt_Branch,
        Voucher_No: req.body.Voucher_No,
        Currency: req.body.Currency,
        Currency_Id: req.body.Currency_Id,
        To_Account_Id: req.body.To_Account_Id,
        To_Account_Name: req.body.To_Account_Name,
        Application_details_Id: req.body.Application_details_Id,
        Course_Name: req.body.Course_Name,
      };
      // }
      var jsondata1 = JSON.stringify(Feesreceipt1);
      //console.log(Student1);
      var Fees_Data = { Fees: jsondata1, feesreceipt_document: Photo_json };
      Student.Save_FeesReceipt(Fees_Data, function (err, rows) {
        if (err) {
          console.log(err);

          return 1;
        } else {
          console.log(rows);
          return res.json(rows);
        }
      });
    }
  } catch (err) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  } finally {
  }
});

router.post(
  "/Save_CommissionReceipt",
  upload.array("myFile"),
  (req, res, next) => {
    try {
      const file = req.files;

      var Photo_ = [];

      if (!file) {
      } else {
        var FeesreceiptDocument_Name_Temp = "";
        var FeesreceiptFile_Name_Temp = "";
        var index_Temp = 0;
        for (
          var i = req.body.FeesreceiptDocument_File_Array;
          i < file.length;
          i++
        ) {
          index_Temp = i - parseInt(req.body.FeesreceiptDocument_File_Array);

          FeesreceiptDocument_Name_Temp =
            req.body["FeesreceiptDocument_Array" + index_Temp];
          FeesreceiptFile_Name_Temp =
            req.body["FeesreceiptDocument_File_Name" + index_Temp];
          Photo_.push({
            FeesreceiptFile_Name: file[i].filename,
            FeesreceiptDocument_Name: FeesreceiptDocument_Name_Temp,
            FeesreceiptDocument_File_Name: FeesreceiptFile_Name_Temp,
          });
        }

        var Photo_json = JSON.stringify(Photo_);

        var Feesreceipt1;
        // if (req.body.Fees_Receipt_Id != 0)
        // {
        Feesreceipt1 = {
          Fees_Receipt_Id: req.body.Fees_Receipt_Id,
          Student_Id: req.body.Student_Id,
          Entry_date: req.body.Entry_date,
          User_Id: req.body.User_Id,
          Description: req.body.Description,
          Commission_Id: req.body.Commission_Id,
          Amount: req.body.Amount,
          Actual_Entry_date: req.body.Actual_Entry_date,
          Fee_Receipt_Branch: req.body.Fee_Receipt_Branch,
          Voucher_No: req.body.Voucher_No,
          Currency: req.body.Currency,
          Currency_Id: req.body.Currency_Id,
          To_Account_Id: req.body.To_Account_Id,
          To_Account_Name: req.body.To_Account_Name,
          Application_details_Id: req.body.Application_details_Id,
          Course_Name: req.body.Course_Name,
        };
        // }
        var jsondata1 = JSON.stringify(Feesreceipt1);
        //console.log(Student1);
        var Fees_Data = { Fees: jsondata1, feesreceipt_document: Photo_json };
        Student.Save_CommissionReceipt(Fees_Data, function (err, rows) {
          if (err) {
            console.log(err);

            return 1;
          } else {
            console.log(rows);
            return res.json(rows);
          }
        });
      }
    } catch (err) {
      const error = new Error("Please upload a file");
      error.httpStatusCode = 400;
      return next(error);
    } finally {
    }
  }
);

router.post("/Save_Refund_Request/", function (req, res, next) {
  try {
    Student.Save_Refund_Request(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Get_Refundrequestdetails/:Student_Id_?/:Fees_Receipt_Id_?",
  function (req, res, next) {
    try {
      Student.Get_Refundrequestdetails(
        req.params.Student_Id_,
        req.params.Fees_Receipt_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Delete_Refund_Request/:Refund_Request_Id_?",
  function (req, res, next) {
    try {
      Student.Delete_Refund_Request(
        req.params.Refund_Request_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.post("/Save_pre_visa/", function (req, res, next) {
  try {
    Student.Save_pre_visa(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post("/Save_Pre_Admission/", function (req, res, next) {
  try {
    Student.Save_Pre_Admission(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post("/Save_Review/", function (req, res, next) {
  try {
    Student.Save_Review(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Search_Receipt/", function (req, res, next) {
  try {
    Student.Search_Receipt(req.query.Student_Id, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Search_Commission/", function (req, res, next) {
  try {
    Student.Search_Commission(req.query.Student_Id, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post("/Save_Receipt/", function (req, res, next) {
  try {
    Student.Save_Receipt(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

// router.post('/Save_Student/',async function(req,res,next)
// {
// try
// {
// const resp=await Student.Save_Student(req.body);
// return res.send(resp);
// }
// catch(e)
// {
// return res.send(e);
// }
// });
router.get("/Get_FollowUp_Details/:Student_Id_?", async (req, res, next) => {
  try {
    const result = await Student.Get_FollowUp_Details(req.params.Student_Id_);
    res.json(result);
  } catch (e) {
    res.send(e);
  } finally {
  }
});
router.post("/Update_Student/", function (req, res, next) {
  try {
    Student.Update_Student(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
router.get("/Get_FollowUp_History/:Student_Id_?", async (req, res, next) => {
  try {
    const result = await Student.Get_FollowUp_History(req.params.Student_Id_);
    res.json(result);
  } catch (e) {
    res.send(e);
  } finally {
  }
});
router.get(
  "/Delete_Receipt/:Fees_Receipt_Id?/:Application_details_Id?",
  function (req, res, next) {
    try {
      Student.Delete_Receipt(
        req.params.Fees_Receipt_Id,
        req.params.Application_details_Id,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Delete_Commission/:Fees_Receipt_Id?/:Application_details_Id?",
  function (req, res, next) {
    try {
      Student.Delete_Commission(
        req.params.Fees_Receipt_Id,
        req.params.Application_details_Id,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Search_Student_Agent/", function (req, res, next) {
  try {
    Student.Search_Student_Agent(
      req.query.From_Date_,
      req.query.To_Date_,
      req.query.Is_Date_Check_,
      req.query.Student_Name_,
      req.query.Phone_Number_,
      req.query.Agent_Id_,
      req.query.Student_Status_Id_,
      Enquiry_Source_Id_,
      req.query.Pointer_Start_,
      req.query.Pointer_Stop_,
      req.query.Page_Length_,

      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

router.get("/Get_Student/:Student_Id_?/:To_User_?", function (req, res, next) {
  try {
    Student.Get_Student(
      req.params.Student_Id_,
      req.params.To_User_,
      function (err, rows) {
        if (err) {
          //;
          res.json(err);
        } else {
          //console.log(rows);
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});
router.get("/Get_Fees_Receipt/:Fees_Receipt_Id_?", function (req, res, next) {
  try {
    Student.Get_Fees_Receipt(req.params.Fees_Receipt_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

// router.get('/Register_Candidate/:Student_Id?/:User_Id?',function(req,res,next)
//  {
//  try
//  {
//   Student.Register_Candidate(req.params.Student_Id,req.params.User_Id, function (err, rows)
//  {
//   if (err)
//   {
//   res.json(err);
//   }
//   else
//   {
//     res.json(rows);
//   }
//   });
//   }
//  catch (e)
//  {
//  }
//  finally
//  {
//  }
//   });
router.post("/Register_Candidate/", async function (req, res, next) {
  try {
    const resp = await Student.Register_Candidate(req.body);
    return res.send(resp);
  } catch (e) {
    return res.send(e);
  }
});

router.get("/Get_Student_Agent/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_Student_Agent(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post("/Delete_Student_Report/", function (req, res) {
  try {
    Student.Delete_Student_Report(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Remove_Registration/:Student_Id_?", function (req, res, next) {
  try {
    Student.Remove_Registration(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
router.get(
  "/Delete_Student_File/:Student_Id_?/:File_Name_?",
  function (req, res, next) {
    try {
      Student.Delete_Student_File(
        req.params.Student_Id_,
        req.params.File_Name_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Agent_Typeahead/", function (req, res, next) {
  try {
    //
    Student.Agent_Typeahead(
      req.query.Client_Accounts_Name_,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

router.get("/Get_Message_Details/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_Message_Details(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

// router.post(
// 	"/Save_Student_Document",
// 	upload.array("myFile"),
// 	(req, res, next) => {
// 		try {
// 			const file = req.files;
// 			var Photo_ = [];
// 			if (!file) {
// 			} else {
// 				for (var i = 0; i < file.length; i++) {
// 					Photo_.push({ File_name: file[i].filename });
// 				}
// 				//Photo_ = file[0].filename;
// 			}

// 			var Image_Detail = "";
// 			if (Photo_.length > 0) {
// 				Image_Detail = Photo_[0].File_name;
// 			}
// 			var Photo_json = JSON.stringify(Photo_);

// 			var Post_ = {
// 				Student_Id: req.body.Student_Id,
// 				Document_Id: req.body.Document_Id,
// 				Image_Detail: Image_Detail,
// 			};
// 			Student.Save_Student_Document(Post_, function (err, rows) {
// 				if (err) {
// 					return 1;
// 				} else {
// 					// cb(null, FileUploaded.toString(10));
// 					return res.json(rows);
// 				}
// 			});
// 		} catch (err) {
// 			const error = new Error("Please upload a file");
// 			error.httpStatusCode = 400;
// 			return next(error);
// 		} finally {
// 		}
// 	}
// );

router.get(
  "/Get_Student_Course_Apply/:Student_Id_?",
  function (req, res, next) {
    try {
      Student.Get_Student_Course_Apply(
        req.params.Student_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);
router.get("/Get_Last_FollowUp/:User_Id_?", async (req, res, next) => {
  try {
    const result = await Student.Get_Last_FollowUp(req.params.User_Id_);
    res.json(result);
  } catch (e) {
    res.send(e);
  } finally {
  }
});
router.get("/Get_Lead_Load_Data1/", async (req, res, next) => {
  try {
    const result = await Student.Get_Lead_Load_Data();
    res.json(result);
  } catch (e) {
    res.send(e);
  } finally {
  }
});

// router.get("/Get_Lead_Load_Data_ByUser/:Login_User_?",async (req, res, next) =>{
//   try
//   {

//   const result = await Student.Get_Lead_Load_Data_ByUser(req.params.Login_User_);
//   res.json(result);
//   }
//   catch (e)
//   {
//   res.send(e);
//   }
//   finally
//   {
//   }
//   });

// router.get('/Get_Lead_Load_Data_ByUser/:Login_User_?',function(req,res,next)
// {
// try
// {
//   Student.Get_Lead_Load_Data_ByUser(req.params.Login_User_, function (err, rows)
// {
// if (err)
// {

// res.json(err);
// }
// else
// {

// res.json(rows);
// }
// });
// }
// catch (e)
// {

// }
// finally
// {
// }
// });

// router.get('/Get_Lead_Load_Data_ByUser/',function(req,res,next)
// {
// try
// {
//   Student.Get_Lead_Load_Data_ByUser(function (err, rows)
// {
// if (err)
// {
// res.json(err);
// }
// else
// {
// res.json(rows);
// }
// });
// }
// catch (e)
// {
// }
// finally
// {
// }
// });

router.get(
  "/Get_Lead_Load_Data_ByUser/:Login_User?",
  function (req, res, next) {
    try {
      Student.Get_Lead_Load_Data_ByUser(
        req.params.Login_User,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

//  router.get('/Search_User_Typeahead_ByUser/:Login_Id_?/:User_Details_Name_?',function(req,res,next)
//  {
//  try
//  {
//      User_Details.Search_User_Typeahead_ByUser(req.params.Login_Id_,req.params.User_Details_Name_, function (err, rows)
//  {
//  if (err)
//  {
//  res.json(err);
//  }
//  else
//  {
//  res.json(rows);
//  }
//  });
//  }
//  catch (e)
//  {

//  }
//  finally
//  {
//  }
//  });

router.get(
  "/Search_Enquiry_Conversion/:Fromdate_?/:Todate_?/:By_User_?/:Is_Date_Check_?/:Branch_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Enquiry_Conversion(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Branch_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Search_Receipt_Confirmation/:Fromdate_?/:Todate_?/:By_User_?/:Is_Date_Check_?/:Branch_?/:Fees_Receipt_Status_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Receipt_Confirmation(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Branch_,
        req.params.Fees_Receipt_Status_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Search_Payment/:Fromdate_?/:Todate_?/:By_User_?/:Is_Date_Check_?/:Branch_?/:Fees_Receipt_Status_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Payment(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Branch_,
        req.params.Fees_Receipt_Status_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Not_Enrolled/:Fromdate_?/:Todate_?/:By_User_?/:Is_Date_Check_?/:Branch_?/:Fees_Receipt_Status_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Not_Enrolled(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Branch_,
        req.params.Fees_Receipt_Status_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Search_Refund_Confirmation/:Fromdate_?/:Todate_?/:By_User_?/:Is_Date_Check_?/:Branch_?/:Fees_Receipt_Status_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Refund_Confirmation(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Branch_,
        req.params.Fees_Receipt_Status_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Search_Refund_Approval/:Fromdate_?/:Todate_?/:By_User_?/:Is_Date_Check_?/:Branch_?/:Fees_Receipt_Status_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Refund_Approval(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Branch_,
        req.params.Fees_Receipt_Status_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Search_Task_Data/:Fromdate_?/:Todate_?/:By_User_?/:Is_Date_Check_?/:Status_?/:Task_?/:Pointer_Start_?/:Pointer_Stop_?/:Page_Length_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Task_Data(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Status_,
        req.params.Task_,
        req.params.Pointer_Start_,
        req.params.Pointer_Stop_,
        req.params.Page_Length_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Get_Lead_Load_Data", async (req, res, next) => {
  try {
    const result = await Student.Get_Lead_Load_Data();
    res.json(result);
  } catch (e) {
    res.send(e);
  } finally {
  }
});
router.get("/Get_Student_Details/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_Student_Details(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

// router.get("/Search_Student", async function (req, res, next) {
// 	var result = "";
// 	try {
// 		result = await Student.Search_Student(
// 			req.query.From_Date_,
// 			req.query.To_Date_,
// 			req.query.Search_By_,
// 			req.query.SearchbyName_,
// 			req.query.Department_,
// 			req.query.Branch_,
// 			req.query.Enquiry_For_,
// 			req.query.By_User_,
// 			req.query.Status_Id_,
// 			req.query.Is_Date_Check_,
// 			req.query.Page_Index1_,
// 			req.query.Page_Index2_,
// 			req.query.Login_User_Id_,
// 			req.query.RowCount,
// 			req.query.RowCount2,
// 			req.query.Register_Value
// 		);

// 		res.json(result);
// 		console.log(result);
// 	} catch (e) {
// 		;
// 	} finally {
// 	}
// });

router.get("/Search_Student", async function (req, res, next) {
  var result = "";
  console.log(req.query);
  try {
    result = await Student.Search_Student(
      req.query.From_Date_,
      req.query.To_Date_,
      req.query.Search_By_,
      req.query.SearchbyName_,
      req.query.Department_,
      req.query.Branch_,
      req.query.Enquiry_For_,
      req.query.Class_,
      req.query.Sort_By_,
      req.query.Intake_,
      req.query.Intake_Year_,
      req.query.Agent_,
      req.query.By_User_,
      req.query.By_User_Id_,
      req.query.Status_Id_,
      req.query.Is_Date_Check_,
      req.query.Page_Index1_,
      req.query.Page_Index2_,
      req.query.Login_User_Id_,
      req.query.RowCount,
      req.query.RowCount2,
      req.query.Register_Value,
      req.query.Country_Id,
      req.query.Student_Id_,
      req.query.Enquiry_Source_Id_,
      req.query.program_course_Id_
    );
    console.log(result);
    res.json(result);
  } catch (e) {
    console.log(e);
  } finally {
  }
});

// router.get("/Search_Application_Report", async function (req, res, next) {
// 	var result = "";
// 	try {
// 		result = await Student.Search_Application_Report(
// 			req.query.Fromdate_,
// 			req.query.Todate_,
// 			req.query.Branch_,
// 			req.query.By_User_,
// 			req.query.Is_Date_Check_,
// 			req.query.Login_User_Id_,
// 			req.query.Status_Value_,
// 			req.query.Agent_Id_,
// 			req.query.Application_status_Id_,
// 			req.query.Intake_Id_,
// 			req.query.Country_Id_,
// 			req.query.University_Id_,
// 			req.query.Is_Active_Check_,
// 		);

// 		res.json(result);
// 		console.log(result);
// 	} catch (e) {
// 		;
// 	} finally {
// 	}
// });

// router.get(
// 	"/Search_Student_Report/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Enquiry_Source_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?/:remarks_?/:To_User_?/:Status_Id_?/:Register_Value_?",
// 	async function (req, res, next) {
// 		var result = "";
// 		try {
// 			result = await Student.Search_Student_Report(
// 				req.params.Fromdate_,
// 				req.params.Todate_,
// 				req.params.Search_By_,
// 				req.params.SearchbyName_,
// 				req.params.Department_,
// 				req.params.Enquiry_Source_,
// 				req.params.Branch_,
// 				req.params.By_User_,
// 				req.params.Is_Date_Check_,
// 				req.params.Page_Index1_,
// 				req.params.Page_Index2_,
// 				req.params.Login_User_Id_,
// 				req.params.RowCount,
// 				req.params.RowCount2,
// 				req.params.remarks_,
// 				req.params.To_User_,
// 				req.params.Status_Id_,
// 				req.params.Register_Value_
// 			);

// 			res.json(result);
// 		} catch (e) {
// 			;
// 		} finally {
// 		}
// 	}
// );

router.get(
  "/Search_Student_Summary_Report/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Student_Summary_Report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Work_Summary/:Fromdate_?/:Todate_?/:By_User_?/:Login_User_Id_?/:look_In_Date_Value?/:Branch_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Work_Summary(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.By_User_,
        req.params.Login_User_Id_,
        req.params.look_In_Date_Value,
        req.params.Branch_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Enquiry_Source_Report/:Search_FromDate_?/:To_Date_?/:Is_Date_Check_?/:Branch_?/:By_User_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Enquiry_Source_Report(
        req.params.Search_FromDate_,
        req.params.To_Date_,
        req.params.Is_Date_Check_,
        req.params.Branch_,
        req.params.By_User_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Search_Status_Details_Report/:Branch_?/:By_User_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Status_Details_Report(

        req.params.Branch_,
        req.params.By_User_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);


router.get(
  "/Search_Userwise_Summary/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Userwise_Summary(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Search_Userwise_Summary_Commission/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Userwise_Summary_Commission(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Employee_Summary/:Fromdate_?/:Todate_?/:By_User_?/:Is_Date_Check_?/:Branch_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Employee_Summary(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Branch_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Work_History/:Fromdate_?/:Todate_?/:By_User_?/:Is_Date_Check_?/:Branch_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Work_History(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Branch_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.post("/Work_History_Send_Mail/", async function (req, res, next) {
  try {
    const resp = await Student.Work_History_Send_Mail(req.body);
    return res.send(resp);
  } catch (e) {
    return res.send(e);
  }
});
router.post("/Fees_Receipt_Mail/", async function (req, res, next) {
  try {
    const resp = await Student.Fees_Receipt_Mail(req.body);
    return res.send(resp);
  } catch (e) {
    return res.send(e);
  }
});

router.get(
  "/Student_Registration_Summary/:Fromdate_?/:Todate_?/:Branch_?/:Is_Date_Check_?/:Login_User_Id_?/:User_Id_Temp_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Student_Registration_Summary(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Branch_,
        req.params.Is_Date_Check_,
        req.params.Login_User_Id_,
        req.params.User_Id_Temp_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);


router.get(
  "/Student_Telecaller_Registration_Summary/:Fromdate_?/:Todate_?/:Branch_?/:Is_Date_Check_?/:Login_User_Id_?/:User_Id_Temp_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Student_Telecaller_Registration_Summary(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Branch_,
        req.params.Is_Date_Check_,
        req.params.Login_User_Id_,
        req.params.User_Id_Temp_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);


router.get(
  "/Search_Branchwise_Summary/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Branchwise_Summary(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
// router.get(
// 	"/Search_Registration_Report/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?",
// 	async function (req, res, next) {
// 		var result = "";
// 		try {
// 			result = await Student.Search_Registration_Report(
// 				req.params.Fromdate_,
// 				req.params.Todate_,
// 				req.params.Search_By_,
// 				req.params.SearchbyName_,
// 				req.params.Department_,
// 				req.params.Branch_,
// 				req.params.By_User_,
// 				req.params.Is_Date_Check_,
// 				req.params.Page_Index1_,
// 				req.params.Page_Index2_,
// 				req.params.Login_User_Id_,
// 				req.params.RowCount,
// 				req.params.RowCount2
// 			);

// 			res.json(result);
// 		} catch (e) {
// 		} finally {
// 		}
// 	}
// );

router.get(
  "/Search_Registration_Report/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?/:View_Branch_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Registration_Report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2,
        req.params.View_Branch_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);


router.get(
  "/Search_Telecaller_Registration_Report/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?/:View_Branch_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Telecaller_Registration_Report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2,
        req.params.View_Branch_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);


router.get(
  "/Search_Counselor_Registration_Report/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Counselor_Registration_Report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Fees_Receipt_Report/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:To_Account_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?/:Fees_Id_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Fees_Receipt_Report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.To_Account_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2,
        req.params.Fees_Id_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Search_Commission_Receipt_Report/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:To_Account_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?/:Fees_Id_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Commission_Receipt_Report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.To_Account_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2,
        req.params.Fees_Id_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Counselor_Fees_Receipt_Report/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?/:Fees_Id_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Counselor_Fees_Receipt_Report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2,
        req.params.Fees_Id_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Student_With_PhoneNumber/:Phone_Number_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Student_With_PhoneNumber(
        req.params.Phone_Number_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Check_Duplicate_Student/:Phone_Number_?/:Branch_Id_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Check_Duplicate_Student(
        req.params.Phone_Number_,
        req.params.Branch_Id_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Documentation_Report/:Phone_Number_?/:User_id_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Documentation_Report(
        req.params.Phone_Number_,
        req.params.User_id_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.post("/Send_Welcome_Mail/", async function (req, res, next) {
  try {
    const resp = await Student.Send_Welcome_Mail(req.body);
    return res.send(resp);
  } catch (e) {
    return res.send(e);
  }
});

router.get(
  "/Pending_FollowUp/:Department_?/:Branch_?/:By_User_?/:Login_User_Id_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Pending_FollowUp(
        req.params.Department_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Login_User_Id_
      );
      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Class_Details_Report/:Department_?/:Branch_?/:By_User_?/:Login_User_Id_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Class_Details_Report(
        req.params.Department_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Login_User_Id_
      );
      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/FollowUp_Summary/:By_User_?/:Login_User_Id_?/:User_Id_Temp_?/:Department_Id_Temp_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.FollowUp_Summary(
        req.params.By_User_,
        req.params.Login_User_Id_,
        req.params.User_Id_Temp_,
        req.params.Department_Id_Temp_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

// router.get("/Chat_Count/", function (req, res, next) {
//   try {
//     console.log("req.query", req.query);

//     Student.Chat_Count(
//       req.query.login_user_,
//       req.query.Notification_Id_,
//       function (err, rows) {
//         if (err) {
//           res.json(err);
//         } else {
//           res.json(rows);
//         }
//       }
//     );
//   } catch (e) {
//   } finally {
//   }
// });

router.get("/Chat_Count/:Login_User_Id_/:Notification_Id_", function (req, res, next) {
  try {
    console.log("req.query", req.params);

    Student.Chat_Count(
      req.params.Login_User_Id_,
      req.params.Notification_Id_,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Class_Summary/:By_User_?/:Login_User_Id_?/:Branch_Id_?/:Department_Id_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Class_Summary(
        req.params.By_User_,
        req.params.Login_User_Id_,
        req.params.Branch_Id_,
        req.params.Department_Id_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Work_report/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?/:Source?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Work_report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2,
        req.params.Source
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Student_Count/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Student_Count(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2
      );
      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Efficiency_Count_Report/:Fromdate_?/:Todate_?/:Branch_?/:By_User_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Efficiency_Count_Report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Branch_,
        req.params.By_User_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

// router.get(
//   "/Get_Dashboard_Count/:By_User_?/:FromDate_?/:ToDate_?/:Date_Value_?/:User_Id_?/:Dept_Id_?/:Branch_Id_?/:Department_Status_Id_?/:Country_Ids?/:Intake_Ids?/:Intake_Year_Ids?",
//   async function (req, res, next) {
//     var result = "";
//     try {
//       result = await Student.Get_Dashboard_Count(
//         req.params.By_User_,
//         req.params.FromDate_,
//         req.params.ToDate_,
//         req.params.Date_Value_,
//         req.params.User_Id_,
//         req.params.Dept_Id_,
//         req.params.Branch_Id_,
//         req.params.Department_Status_Id_,
//         req.params.Country_Ids,
//         req.params.Intake_Ids,
//         req.params.Intake_Year_Ids
//       );

//       res.json(result);
//     } catch (e) {
//       console.log(e);
//     } finally {
//     }
//   }
// );


router.get("/Get_Dashboard_Count/:By_User_?/:FromDate_?/:ToDate_?/:Date_Value_?/:User_Id_?/:User_Type_?/", async function (req, res, next) {
  var result = "";
  try {

    result = await Student.Get_Dashboard_Count(req.params.By_User_, req.params.FromDate_, req.params.ToDate_, req.params.Date_Value_, req.params.User_Id_,
      req.params.User_Type_);

    res.json(result);
    console.log(result);
  } catch (e) {
    console.log(e);

  } finally {
  }
});

router.get(
  "/Get_Dashboard_Count_Manager/:By_User_?/:FromDate_?/:ToDate_?/:Date_Value_?/:User_Id_?/:Dept_Id_?/:Branch_Id_?/:Department_Status_Id_?/:Country_Ids?/:Intake_Ids?/:Intake_Year_Ids?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Get_Dashboard_Count_Manager(
        req.params.By_User_,
        req.params.FromDate_,
        req.params.ToDate_,
        req.params.Date_Value_,
        req.params.User_Id_,
        req.params.Dept_Id_,
        req.params.Branch_Id_,
        req.params.Department_Status_Id_,
        req.params.Country_Ids,
        req.params.Intake_Ids,
        req.params.Intake_Year_Ids
      );

      res.json(result);
    } catch (e) {
      console.log(e);
    } finally {
    }
  }
);

router.get(
  "/Get_Dashboard_Account_Count/:By_User_?/:FromDate_?/:ToDate_?/:Date_Value_?/:User_Id_?/:Dept_Id_?/:Branch_Id_?/:Department_Status_Id_?/:Country_Ids?/:Intake_Ids?/:Intake_Year_Ids?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Get_Dashboard_Account_Count(
        req.params.By_User_,
        req.params.FromDate_,
        req.params.ToDate_,
        req.params.Date_Value_,
        req.params.User_Id_,
        req.params.Dept_Id_,
        req.params.Branch_Id_,
        req.params.Department_Status_Id_,
        req.params.Country_Ids,
        req.params.Intake_Ids,
        req.params.Intake_Year_Ids
      );

      res.json(result);
    } catch (e) {
      console.log(e);
    } finally {
    }
  }
);

router.get(
  "/Get_Application_Dashboard_Count/:By_User_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Get_Application_Dashboard_Count(
        req.params.By_User_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
// router.get('/Delete_Receipt/:Fees_Receipt_Id?',function(req,res,next)
// {
// try
// {
//  Student.Delete_Receipt(req.params.Fees_Receipt_Id, function (err, rows)
// {
//  if (err)
//  {
//  res.json(err);
//  }
//  else
//  {
//    res.json(rows);
//  }
//  });
//  }
// catch (e)
// {
// }
// finally
// {
// }
//  });

router.get("/Delete_Data/", function (req, res, next) {
  try {
    Student.Delete_Data(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Search_Student_Count_Track_Report/:Fromdate_?/:By_User_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Student_Count_Track_Report(
        req.params.Fromdate_,
        req.params.By_User_
      );
      console.log("First graph datas returs are dfsdfsd,", result);

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Application_Count_Track_Report/:Fromdate_?/:By_User_?",
  async function (req, res, next) {
    var result = "";
    console.log("the params from the client side is ", req.params);
    try {
      result = await Student.Search_Application_Count_Track_Report(
        req.params.Fromdate_,
        req.params.By_User_
      );
      console.log("The result send to front end is", result);

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Enquiry_Source_Summary_Track/:Fromdate_?/:Todate_?/:By_User_?/:Is_Date_Check_?/:Branch_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Enquiry_Source_Summary_Track(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Branch_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Student_Status_Report/:Fromdate_?/:Todate_?/:By_User_?/:Is_Date_Check_?/:Department_Status_?/:User_Id_?/:Dept_Id_?/:Branch_Id_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Student_Status_Report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Department_Status_,
        req.params.User_Id_,
        req.params.Dept_Id_,
        req.params.Branch_Id_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Search_Application_Status_Report/:Fromdate_?/:Todate_?/:By_User_?/:Is_Date_Check_?/:Department_Status_?/:User_Id_?/:Dept_Id_?/:Branch_Id_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Application_Status_Report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Department_Status_,
        req.params.User_Id_,
        req.params.Dept_Id_,
        req.params.Branch_Id_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Get_Student_Course_Selection/:Student_Course_Apply_Id_?",
  function (req, res, next) {
    try {
      Student.Get_Student_Course_Selection(
        req.params.Student_Course_Apply_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);
router.post("/Save_Student_Import/", function (req, res) {
  try {
    Student.Save_Student_Import(req.body, function (err, rows) {
      if (err) {
        console.log(err);
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
    console.log(e);
  } finally {
  }
});

router.post("/Save_Data_Migration/", function (req, res) {
  try {
    Student.Save_Data_Migration(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Search_Users_Import/", function (req, res, next) {
  try {
    Student.Search_Users_Import(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post("/Save_Student_Report_FollowUp/", function (req, res) {
  try {
    Student.Save_Student_Report_FollowUp(req.body, function (err, rows) {
      if (err) {
        console.log(err);
        res.json(err);
      } else {
          console.log(rows);
        res.json(rows);
      }
    });
  } catch (e) {
    console.log(e);
  } finally {
  }
});

router.get("/Delete_Student_Report/", function (req, res, next) {
  try {
    Student.Delete_Student_Report(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
router.get("/Delete_Student/:Student_Id_?", function (req, res, next) {
  try {
    Student.Delete_Student(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

// router.get("/Transfer_Cofirmation/:Student_Id_?/:Transfer_Source_?/:Login_User_Id_?/:Department_Id_?/:Remark_?/:Transfer_Status_Id_?/:Transfer_Status_Name_?/:Sub_Status_Id_?/:Sub_Status_Name_?/:Application_Id_Ref_?/:Followup_Branch_Id_?/:Followup_Branch_Name_?/:Followup_Department_Id_?/:Followup_Department_Name_?/:Followup_Status_Id_?/:Followup_Status_Name_?/:Followup_To_User_Id_?/:Followup_To_User_Name_?", function (req, res, next) {
// 	try {
// 		Student.Transfer_Cofirmation(req.params.Student_Id_,req.params.Transfer_Source_,req.params.Login_User_Id_,req.params.Department_Id_,req.params.Remark_,req.params.Transfer_Status_Id_,req.params.Transfer_Status_Name_,req.params.Sub_Status_Id_,req.params.Sub_Status_Name_,req.params.Application_Id_Ref_,req.params.Followup_Branch_Id_,req.params.Followup_Branch_Name_,req.params.Followup_Department_Id_,req.params.Followup_Department_Name_,req.params.Followup_Status_Id_,req.params.Followup_Status_Name_,req.params.Followup_To_User_Id_,req.params.Followup_To_User_Name_, function (err, rows) {

// 			if (err) {
// 				res.json(err);
// 			} else {
// 				console.log(err)
// 				res.json(rows);
// 			}
// 		});
// 	} catch (e) {
// 		console.log(e)
// 	} finally {
// 	}
// });

router.get("/Transfer_Cofirmation", function (req, res, next) {
  try {
    Student.Transfer_Cofirmation(
      req.query.Student_Id_,
      req.query.Transfer_Source_,
      req.query.Login_User_Id_,
      req.query.Department_Id_,
      req.query.Remark_,
      req.query.Transfer_Status_Id_,
      req.query.Transfer_Status_Name_,
      req.query.Sub_Status_Id_,
      req.query.Sub_Status_Name_,
      req.query.Application_Id_Ref_,
      function (err, rows) {
        if (err) {
          console.log(err);
          res.json(err);
        } else {
          res.json(rows);
        }
      }
    );
  } catch (e) {
    console.log(e);
  } finally {
  }
});

router.post("/Save_FollowUp/", function (req, res) {
  try {
    Student.Save_FollowUp(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post("/Transfer_With_Application/", async function (req, res, next) {
  try {
    const resp = await Student.Transfer_With_Application(req.body);
    return res.send(resp);
  } catch (e) {
    return res.send(e);
  }
});

router.get(
  "/Search_Student_Import/:From_Date_?/:To_Date_?/:Is_Date_Check_?/",
  function (req, res, next) {
    try {
      Student.Search_Student_Import(
        req.query.From_Date_,
        req.query.To_Date_,
        req.query.Is_Date_Check_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.post("/Forgot_Password_Student/", async function (req, res, next) {
  try {
    const resp = await Student.Forgot_Password_Student(req.body);

    return res.send(resp);
  } catch (e) {
    return res.send(e);
  }
});

router.get(
  "/Get_Menu_Status/:Menu_Id_?/:Login_User_?",
  function (req, res, next) {
    try {
      Student.Get_Menu_Status(
        req.params.Menu_Id_,
        req.params.Login_User_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Get_Menu_Status_Multiple/:Menu_Id_?/:Login_User_?",
  function (req, res, next) {
    try {
      Student.Get_Menu_Status_Multiple(
        req.params.Menu_Id_,
        req.params.Login_User_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Student_Registration_By_Enquirysource/:Fromdate_?/:Todate_?/:Branch_?/:Is_Date_Check_?/:Login_User_Id_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Student_Registration_By_Enquirysource(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Branch_,
        req.params.Is_Date_Check_,
        req.params.Login_User_Id_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Enquirysource_Summary_New/:Fromdate_?/:Todate_?/:Branch_?/:Is_Date_Check_?/:Login_User_Id_?/:To_User_Id_Temp_?/:To_Status_Id_Temp_?/:Department_Id_Temp_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Enquirysource_Summary_New(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Branch_,
        req.params.Is_Date_Check_,
        req.params.Login_User_Id_,
        req.params.To_User_Id_Temp_,
        req.params.To_Status_Id_Temp_,
        req.params.Department_Id_Temp_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Student_Registration_By_Enquirysource_Report/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Branch_?/:Enquiry_Source_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Student_Registration_By_Enquirysource_Report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Branch_,
        req.params.Enquiry_Source_,
        req.params.Is_Date_Check_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Enquirysource_Summary_Report_New/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Branch_?/:Enquiry_Source_?/:User_Id_?/:Country_Id_?/:Status_Id_Temp_?/:Is_Date_Check_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Enquirysource_Summary_Report_New(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Branch_,
        req.params.Enquiry_Source_,
        req.params.User_Id_,
        req.params.Country_Id_,
        req.params.Status_Id_Temp_,
        req.params.Is_Date_Check_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Get_Resume_Photo/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_Resume_Photo(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Get_MOI_Photo/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_MOI_Photo(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Get_SOP_Photo/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_SOP_Photo(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Get_IELTS_Photo/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_IELTS_Photo(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Resume_Mode_Dropdown/", function (req, res, next) {
  try {
    Student.Resume_Mode_Dropdown(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Passport_Mode_Dropdown/", function (req, res, next) {
  try {
    Student.Passport_Mode_Dropdown(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/LOR1_Mode_Dropdown/", function (req, res, next) {
  try {
    Student.LOR1_Mode_Dropdown(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Task_Status_Dropdown/", function (req, res, next) {
  try {
    Student.Task_Status_Dropdown(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Task_Item_Dropdown/:Task_Group_Id_?", function (req, res, next) {
  try {
    Student.Task_Item_Dropdown(req.params.Task_Group_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Task_Item_Dropdown_All/", function (req, res, next) {
  try {
    Student.Task_Item_Dropdown_All(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/LOR2_Mode_Dropdown/", function (req, res, next) {
  try {
    Student.LOR2_Mode_Dropdown(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/MOI_Mode_Dropdown/", function (req, res, next) {
  try {
    Student.MOI_Mode_Dropdown(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/SOP_Mode_Dropdown/", function (req, res, next) {
  try {
    Student.SOP_Mode_Dropdown(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/IELTS_Mode_Dropdown/", function (req, res, next) {
  try {
    Student.IELTS_Mode_Dropdown(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Load_application_status/", function (req, res, next) {
  try {
    Student.Load_application_status(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Load_Marital_Status/", function (req, res, next) {
  try {
    Student.Load_Marital_Status(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Load_Visa_Type/", function (req, res, next) {
  try {
    Student.Load_Visa_Type(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post("/Save_ApplicationDetails/", function (req, res, next) {
  try {
    Student.Save_ApplicationDetails(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        console.log(rows);
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
router.get("/Get_ApplicationDetails/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_ApplicationDetails(
      req.params.Student_Id_,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Get_Bph_ApplicationDetails/:Student_Id_?",
  function (req, res, next) {
    try {
      Student.Get_Bph_ApplicationDetails(
        req.params.Student_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Get_Feesrecepitdetails/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_Feesrecepitdetails(
      req.params.Student_Id_,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});
router.get(
  "/Get_Application_DocumentList/:Application_details_Id_?",
  function (req, res, next) {
    try {
      Student.Get_Application_DocumentList(
        req.params.Application_details_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Get_Feesrecepit_DocumentList/:Fees_Receipt_Id_?",
  function (req, res, next) {
    try {
      Student.Get_Feesrecepit_DocumentList(
        req.params.Fees_Receipt_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Get_ApplicationDetails_History/:Student_Id_?",
  function (req, res, next) {
    try {
      Student.Get_ApplicationDetails_History(
        req.params.Student_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Get_ApplicationDetailswise_History/:Application_details_Id_?/:Feesdetails_Id_?",
  function (req, res, next) {
    try {
      Student.Get_ApplicationDetailswise_History(
        req.params.Application_details_Id_,
        req.params.Feesdetails_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Delete_Application_Details/:Student_Id_?",
  function (req, res, next) {
    try {
      Student.Delete_Application_Details(
        req.params.Student_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_ApplicationDetails/:Application_details_Id_?",
  function (req, res, next) {
    try {
      Student.Search_ApplicationDetails(
        req.params.Application_details_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Get_Checklist/?", function (req, res, next) {
  try {
    Student.Get_Checklist(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
router.get("/Get_Student_Edit/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_Student_Edit(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
// router.get('/Activate_Application/:Application_details_Id_',function(req,res,next)
// {
// try
// {

// Student.Activate_Application(req.params.Application_details_Id_, function (err, rows)
// {
// if (err)
// {
// res.json(err);
// ;
// }
// else
// {
// res.json(rows);
// ;

// }
// });
// }
// catch (e)
// {

// }
// finally
// {
// }
// });

// router.get("/Activate_Application/", function (req, res, next) {
// 	try {
// 		Student.Activate_Application(
// 			req.query.Application_details_Id_,
// 			req.query.Student_Id_,
// 			function (err, rows) {
// 				if (err) {
// 					;

// 					res.json(err);
// 				} else {
// 					console.log(rows);
// 					res.json(rows);
// 				}
// 			}
// 		);
// 	} catch (e) {
// 		;
// 	} finally {
// 	}
// });

router.post("/Activate_Application/", function (req, res, next) {
  try {
    Student.Activate_Application(req.body, function (err, rows) {
      if (err) {
        //
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
router.get("/Student_Approve/", function (req, res, next) {
  try {
    Student.Student_Approve(
      req.query.Application_details_Id_,
      req.query.Login_User_,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          console.log(rows);
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

router.get("/Receipt_Approve/", function (req, res, next) {
  try {
    Student.Receipt_Approve(
      req.query.Fees_Receipt_Id_,
      req.query.Login_User_,
      req.query.applicationdetails_Id_,
      req.query.Receiptamount_,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          console.log(rows);
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

// router.get("/Refund_Approve/", function (req, res, next) {
// 	try {
// 		Student.Refund_Approve(
// 			req.query.Fees_Receipt_Id_,
// 			req.query.Login_User_,
// 			function (err, rows) {
// 				if (err) {
// 					;

// 					res.json(err);
// 				} else {
// 					console.log(rows);
// 					res.json(rows);
// 				}
// 			}
// 		);
// 	} catch (e) {
// 		;
// 	} finally {
// 	}
// });

router.get("/Lead_Refund_Approve_Reject/", function (req, res, next) {
  try {
    Student.Lead_Refund_Approve_Reject(
      req.query.Fees_Receipt_Id_,
      req.query.Status_,
      req.query.Comment_,
      req.query.Login_User_,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          console.log(rows);
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

router.get("/Save_Bph_Status/", function (req, res, next) {
  try {
    Student.Save_Bph_Status(
      req.query.Application_details_Id_,
      req.query.Login_User_,
      req.query.Bph_Status_,
      req.query.Bph_Remark_,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          console.log(rows);
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});
router.get(
  "/Remove_Activity/:Application_details_Id_?",
  function (req, res, next) {
    try {
      Student.Remove_Activity(
        req.params.Application_details_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Remove_Student_Approval/:Application_details_Id_?",
  function (req, res, next) {
    try {
      Student.Remove_Student_Approval(
        req.params.Application_details_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Remove_Receipt_Approval/:Fees_Receipt_Id_?",
  function (req, res, next) {
    try {
      Student.Remove_Receipt_Approval(
        req.params.Fees_Receipt_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Remove_Refund_Approval/:Fees_Receipt_Id_?/:Login_User_?",
  function (req, res, next) {
    try {
      Student.Remove_Refund_Approval(
        req.params.Fees_Receipt_Id_,
        req.params.Login_User_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Lead_Refund_Reject/:Fees_Receipt_Id_?", function (req, res, next) {
  try {
    Student.Lead_Refund_Reject(
      req.params.Fees_Receipt_Id_,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

router.post("/Save_Visa", upload.array("myFile"), (req, res, next) => {
  try {
    const file = req.files;

    var Photo_ = [];

    if (!file) {
    } else {
      var Visa_Document_Name_Temp = "";
      var Visa_File_Name_Temp = "";
      var index_Temp = 0;
      for (var i = req.body.Visa_Document_File_Array; i < file.length; i++) {
        index_Temp = i - parseInt(req.body.Visa_Document_File_Array);

        Visa_Document_Name_Temp = req.body["Visa_Document_Array" + index_Temp];
        Visa_File_Name_Temp = req.body["Visa_Document_File_Name" + index_Temp];
        Photo_.push({
          Visa_File_Name: file[i].filename,
          Visa_Document_Name: Visa_Document_Name_Temp,
          Visa_Document_File_Name: Visa_File_Name_Temp,
        });
      }

      var Photo_json = JSON.stringify(Photo_);

      //var Visa_D
      // if (req.body.Fees_Receipt_Id != 0)
      // {
      Visa_D = {
        Visa_Id: req.body.Visa_Id,
        Student_Id: req.body.Student_Id,
        Approved_Date: req.body.Approved_Date,
        Approved_Date_L: req.body.Approved_Date_L,
        Approved_Date_F: req.body.Approved_Date_F,
        Visa_Granted: req.body.Visa_Granted,
        Visa_Letter: req.body.Visa_Letter,
        Visa_File: req.body.Visa_File,
        Application_No: req.body.Application_No,
        Total_Fees: req.body.Total_Fees,
        Scholarship_Fees: req.body.Scholarship_Fees,
        Balance_Fees: req.body.Balance_Fees,
        Paid_Fees: req.body.Paid_Fees,
        Visa_Type_Id: req.body.Visa_Type_Id,
        Visa_Type_Name: req.body.Visa_Type_Name,
        Description: req.body.Description,

        Username: req.body.Username,
        Password: req.body.Password,
        Security_Question: req.body.Security_Question,

        Visa_Rejected: req.body.Visa_Rejected,
        Visa_Rejected_Date: req.body.Visa_Rejected_Date,
        ATIP_Submitted: req.body.ATIP_Submitted,
        ATIP_Submitted_Date: req.body.ATIP_Submitted_Date,
        ATIP_Received: req.body.ATIP_Received,
        ATIP_Received_Date: req.body.ATIP_Received_Date,
        Visa_Re_Submitted: req.body.Visa_Re_Submitted,
        Visa_Re_Submitted_Date: req.body.Visa_Re_Submitted_Date,
      };
      // }
      var jsondata1 = JSON.stringify(Visa_D);
      var Visa_Data = { Visa: jsondata1, Visa_document: Photo_json };
      Student.Save_Visa(Visa_Data, function (err, rows) {
        if (err) {
          return 1;
        } else {
          console.log(rows);
          return res.json(rows);
        }
      });
    }
  } catch (err) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  } finally {
  }
});
router.get("/Get_Visa_Details/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_Visa_Details(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Reset_Notification_Count/:User_Id_?", function (req, res, next) {
  try {
    Student.Reset_Notification_Count(req.params.User_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Refund_Approve/", function (req, res, next) {
  try {
    Student.Refund_Approve(
      req.query.Fees_Receipt_Id_,
      req.query.Student_Id_temp_,
      req.query.Login_User_,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          console.log(rows);
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

router.get("/Get_All_Notification/", function (req, res, next) {
  try {
    Student.Get_All_Notification(
      req.query.Date_,
      req.query.User_Id_,
      req.query.login_Id_,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          console.log(rows);
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

router.get("/Get_Visa_Documents/:Visa_Id_ ?", function (req, res, next) {
  try {
    Student.Get_Visa_Documents(req.params.Visa_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
router.get("/Delete_Visa/:Visa_Id_?", function (req, res, next) {
  try {
    Student.Delete_Visa(req.params.Visa_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
router.get(
  "/Delete_Visa_Document/:Visa_Document_Id_?",
  function (req, res, next) {
    try {
      Student.Delete_Visa_Document(
        req.params.Visa_Document_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);
router.post("/Save_Invoice", upload.array("myFile"), (req, res, next) => {
  try {
    const file = req.files;

    var Photo_ = [];

    if (!file) {
    } else {
      var Invoice_Document_Name_Temp = "";
      var Invoice_File_Name_Temp = "";
      var index_Temp = 0;
      for (var i = req.body.Invoice_Document_File_Array; i < file.length; i++) {
        index_Temp = i - parseInt(req.body.Invoice_Document_File_Array);

        Invoice_Document_Name_Temp =
          req.body["Invoice_Document_Array" + index_Temp];
        Invoice_File_Name_Temp =
          req.body["Invoice_Document_File_Name" + index_Temp];
        Photo_.push({
          Invoice_File_Name: file[i].filename,
          Invoice_Document_Name: Invoice_Document_Name_Temp,
          Invoice_Document_File_Name: Invoice_File_Name_Temp,
        });
      }

      var Photo_json = JSON.stringify(Photo_);

      // var Invoice_D =[]
      // if (req.body.Fees_Receipt_Id != 0)
      // {
      Invoice_D = {
        Invoice_Id: req.body.Invoice_Id,
        Student_Id: req.body.Student_Id,
        Entry_Date: req.body.Entry_Date,
        Description: req.body.Description,
        Amount: req.body.Amount,
      };
      // }
      var jsondata1 = JSON.stringify(Invoice_D);
      var Invoice_Data = { Invoice: jsondata1, Invoice_document: Photo_json };
      Student.Save_Invoice(Invoice_Data, function (err, rows) {
        if (err) {
          return 1;
        } else {
          console.log(rows);
          return res.json(rows);
        }
      });
    }
  } catch (err) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  } finally {
  }
});
router.get("/Get_Invoice_Details/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_Invoice_Details(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
router.get("/Get_Invoice_Documents/:Invoice_Id_ ?", function (req, res, next) {
  try {
    Student.Get_Invoice_Documents(req.params.Invoice_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
router.get("/Delete_Invoice/:Invoice_Id_?", function (req, res, next) {
  try {
    Student.Delete_Invoice(req.params.Invoice_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
router.get(
  "/Delete_Invoice_Document/:Invoice_Document_Id_?",
  function (req, res, next) {
    try {
      Student.Delete_Invoice_Document(
        req.params.Invoice_Document_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Get_Receipt_Sum/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_Receipt_Sum(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
router.get(
  "/Delete_Application_History/:Application_details_history_Id_?",
  function (req, res, next) {
    try {
      Student.Delete_Application_History(
        req.params.Application_details_history_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.post("/Save_Front_Student/", async function (req, res, next) {
  try {
    const resp = await Student.Save_Front_Student(req.body);
    return res.send(resp);
  } catch (e) {
    return res.send(e);
  }
});

router.get("/Search_Application_Report", async function (req, res, next) {
  var result = "";
  try {
    result = await Student.Search_Application_Report(
      req.query.Fromdate_,
      req.query.Todate_,
      req.query.Branch_,
      req.query.To_User_,
      req.query.Is_Date_Check_,
      req.query.Login_User_Id_,
      req.query.Status_Value_,
      req.query.Agent_Id_,
      req.query.Application_status_Id_,
      req.query.Intake_Id_,
      req.query.Intake_Year_Id_,
      req.query.Country_Id_,
      req.query.University_Id_,
      req.query.Is_Active_Check_,
      req.query.By_User_Id_
    );

    res.json(result);
    console.log(result);
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Search_Application_Report_History",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Application_Report_History(
        req.query.Fromdate_,
        req.query.Todate_,
        req.query.Branch_,
        req.query.To_User_,
        req.query.Is_Date_Check_,
        req.query.Login_User_Id_,
        req.query.Status_Value_,
        req.query.Agent_Id_,
        req.query.Application_status_Id_,
        req.query.Intake_Id_,
        req.query.Intake_Year_Id_,
        req.query.Country_Id_,
        req.query.University_Id_,
        req.query.Is_Active_Check_
      );

      res.json(result);
      console.log(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Search_Application_Data", async function (req, res, next) {
  var result = "";
  try {
    result = await Student.Search_Application_Data(
      req.query.Fromdate_,
      req.query.Todate_,
      req.query.Branch_,
      req.query.By_User_,
      req.query.Is_Date_Check_,
      req.query.Login_User_Id_,
      req.query.Status_Value_,
      req.query.Agent_Id_,
      req.query.Application_status_Id_,
      req.query.Intake_Id_,
      req.query.Intake_Year_Id_,
      req.query.Country_Id_,
      req.query.University_Id_,
      req.query.Is_Active_Check_,
      req.query.To_User_Id_
    );

    res.json(result);
    console.log(result);
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Search_Passport_Expiry_Report/:Fromdate_?/:Todate_?/:By_User_?/:Login_User_Id_?/:look_In_Date_Value?/:Branch_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Passport_Expiry_Report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.By_User_,
        req.params.Login_User_Id_,
        req.params.look_In_Date_Value
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Search_Student_Report/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Enquiry_Source_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Is_Old_Datas_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?/:remarks_?/:To_User_?/:Status_Id_?/:Register_Value_?/:Date_value_?/:Country_id_?/:Course_Id_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Student_Report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Enquiry_Source_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Is_Old_Datas_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2,
        req.params.remarks_,
        req.params.To_User_,
        req.params.Status_Id_,
        req.params.Register_Value_,
        req.params.Date_value_,
        req.params.Country_id_,
        req.params.Course_Id_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Search_Overall_Report/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Enquiry_Source_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Is_Old_Datas_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?/:remarks_?/:To_User_?/:Status_Id_?/:Register_Value_?/:Date_value_?/:Country_id_?/:Course_Id_?/:Enquiry_For_ ?",
  async function (req, res, next) {
    var result = "";
    console.log(req.params);
    try {
      result = await Student.Search_Overall_Report(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Enquiry_Source_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Is_Old_Datas_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2,
        req.params.remarks_,
        req.params.To_User_,
        req.params.Status_Id_,
        req.params.Register_Value_,
        req.params.Date_value_,
        req.params.Country_id_,
        req.params.Course_Id_,
        req.params.Enquiry_For_
      );
console.log(result);
      res.json(result);
    } catch (e) {
      console.log(e);
    } finally {
    }
  }
);
router.get(
  "/Search_Student_Report_Followup/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Enquiry_Source_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Is_Old_Datas_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?/:remarks_?/:To_User_?/:Status_Id_?/:Register_Value_?/:Date_value_?/:Country_Id_",
  async function (req, res, next) {
    var result = "";
    console.log(req.params);
    try {
      result = await Student.Search_Student_Report_Followup(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Enquiry_Source_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Is_Old_Datas_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2,
        req.params.remarks_,
        req.params.To_User_,
        req.params.Status_Id_,
        req.params.Register_Value_,
        req.params.Date_value_,
        req.params.Country_Id_
      );
console.log(result);
      res.json(result);
    } catch (e) {
      console.log(e);
    } finally {
    }
  }
);

router.get(
  "/Notification_Read_Status/:Notification_Count_?/:User_Id_ ?",
  function (req, res, next) {
    try {
      Student.Notification_Read_Status(
        req.params.Notification_Count_,
        req.params.User_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.post("/Save_Checklist/", function (req, res, next) {
  try {
    Student.Save_Checklist(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        console.log(rows);
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Get_Checklist_Country/:Country_Id_?", function (req, res, next) {
  try {
    Student.Get_Checklist_Country(req.params.Country_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Delete_Checklist/:Checklist_Id_?", function (req, res, next) {
  try {
    Student.Delete_Checklist(req.params.Checklist_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
    //
  } finally {
  }
});

router.get(
  "/get_student_checklist/:Student_Id_?/:Checklist_Type_ ?",
  function (req, res, next) {
    try {
      Student.get_student_checklist(
        req.params.Student_Id_,
        req.params.Checklist_Type_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Get_Previsa_Details_Edit/:Student_Checklist_Master_Id_?",
  function (req, res, next) {
    try {
      Student.Get_Previsa_Details_Edit(
        req.params.Student_Checklist_Master_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Get_Preadmission_Details_Edit/:Student_Preadmission_Checklist_Master_Id_?",
  function (req, res, next) {
    try {
      Student.Get_Preadmission_Details_Edit(
        req.params.Student_Preadmission_Checklist_Master_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get("/update_Read_Status/", function (req, res, next) {
  try {
    Student.update_Read_Status(
      req.query.login_user_,
      req.query.Notification_Id_,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

router.post("/Save_CAS_NewTask_Followup/", function (req, res, next) {
  try {
    Student.Save_CAS_NewTask_Followup(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post("/Save_CAS_NewTask_Followup_Navbar/", function (req, res, next) {
  try {
    Student.Save_CAS_NewTask_Followup_Navbar(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Get_Tasknew_Task/:Student_Id_?/:Task_Group_Id_?/:Login_User_?",
  function (req, res, next) {
    try {
      Student.Get_Tasknew_Task(
        req.params.Student_Id_,
        req.params.Task_Group_Id_,
        req.params.Login_User_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Delete_Tasknew/:Student_Task_Id?", function (req, res, next) {
  try {
    Student.Delete_Tasknew(req.params.Student_Task_Id, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
router.get("/Search_Application_List/", function (req, res, next) {
  try {
    Student.Search_Application_List(
      req.query.LoginUser_Id_,
      req.query.Enrolled_Application_Only_View_Permission_,
      req.query.Pointer_Start_,
      req.query.Pointer_Stop_,
      req.query.Page_Length_,
      req.query.Is_View_,
      req.query.Department_Id_,
      req.query.search_name_,
      req.query.Agent_Id_,
      req.query.User_Id_,
      req.query.Student_Id_,
      req.query.Today_Click_Flag_,
      req.query.Search_FromDate_,
      req.query.Search_ToDate_,
      req.query.Look_In_Date_,
      req.query.Application_Country_Id_,
      function (err, rows) {
        if (err) {
          console.log(err);
          res.json(err);
        } else {
          res.json(rows);
        }
      }
    );
  } catch (e) {
    console.log(e);
  } finally {
  }
});

router.get(
  "/Load_ChatUser_Details_comment/:Value_?/:Login_User_?/:Application_Id_?",
  function (req, res, next) {
    try {
      // console.log('req.params.Value_: ', req.params.Value_);
      console.log("req.params.Login_User_: ", req.params.Login_User_);
      console.log("req.params.Application_Id_: ", req.params.Application_Id_);
      Student.Load_ChatUser_Details_comment(
        req.params.Value_,

        req.params.Login_User_,
        req.params.Application_Id_,
        function (err, rows) {
          if (err) {
            console.log("error", err);

            res.json(err);
          } else {
            console.log("rows", rows);

            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);
router.get(
  "/Get_Dashboard_Count_user/:By_User_?/:FromDate_?/:ToDate_?/:Date_Value_?/:User_Id_?/:Dept_Id_?/:Branch_Id_?/:Department_Status_Id_?",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Get_Dashboard_Count_user(
        req.params.By_User_,
        req.params.FromDate_,
        req.params.ToDate_,
        req.params.Date_Value_,
        req.params.User_Id_,
        req.params.Dept_Id_,
        req.params.Branch_Id_,
        req.params.Department_Status_Id_
      );

      res.json(result);
    } catch (e) {
      console.log(e);
    } finally {
    }
  }
);
router.get(
  "/Load_Application_status_for_user/:Login_User_Id_?",
  function (req, res, next) {
    try {
      Student.Load_Application_status_for_user(
        req.params.Login_User_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);
router.get("/Save_Application_Status/", function (req, res, next) {
  try {
    Student.Save_Application_Status(
      req.query.Application_details_Id_,
      req.query.Login_User_,
      req.query.Application_Status_,
      req.query.Bph_Remark_,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          console.log(rows);
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

router.get("/Load_Color/", function (req, res, next) {
  try {
    Student.Load_Color(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});
router.get("/Load_Automatic_Departments/", function (req, res, next) {
  try {
    Student.Load_Automatic_Departments(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Get_ToStaff_Student_DataCount/:Branch_?/:Followup_Date_?/:Department_Id_?",
  function (req, res, next) {
    try {
      Student.Get_ToStaff_Student_DataCount(
        req.params.Branch_,
        req.params.Followup_Date_,
        req.params.Department_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            console.log(rows);
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Load_Application_status_forchangestatus/:Login_Id_?",
  function (req, res, next) {
    try {
      Student.Load_Application_status_forchangestatus(
        req.params.Login_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);
// commented
// router.post("/Save_Lodgemet/", async function (req, res, next) {
//   try {
//     const resp = await Student.Save_Lodgemet(req.body);
//     return res.send(resp);
//   } catch (e) {
//     console.log(e);
//     return res.send(e);
//   }
// });

router.post("/Save_Lodgemet/", async function (req, res, next) {
  try {
    const resp = await Student.Save_Lodgemet(req.body);

    // Check if email notification is required
    if (resp && resp[0] && resp[0].Notification_Tik_ === 1) {
      try {
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }
    }
    return res.send(resp);
  } catch (error) {
    console.error("Error in route /Save_Lodgemet/:", error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
});


router.post("/Save_Lodgemet_Mail/", async function (req, res, next) {
  try {
    const resp = await Student.Save_Lodgemet_Mail(req.body);

    // Check if email notification is required
    if (resp && resp[0] && resp[0].Notification_Tik_ === 1) {
      try {
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }
    }
    return res.send(resp);
  } catch (error) {
    console.error("Error in route /Save_Lodgemet_Mail/:", error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
});

router.post("/sendmail_followup", async function (req, res, next) {
  try {
    console.log("sendmail_followup", req.body);
    const resp = await Student.sendmail_followup(req.body);

    // Check if email notification is required
    if (resp && resp[0] && resp[0].Notification_Tik_ === 1) {
      try {
        console.log("Email notification sent successfully.");
        // You can call a separate method for email here if needed
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }
    }
    return res.send(resp);
  } catch (error) {
    console.error("Error in route /sendmail_followup/:", error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
});

// router.get("/Save_Lodgemet/", function (req, res, next) {
// 	try {
// 		Student.Save_Lodgemet(
// 			req.query.Application_details_Id_,
// 			req.query.Login_User_,
// 			req.query.Application_Status_Id_,
// 			req.query.Application_Status_Name_,
// 			req.query.Application_No_,
// 			req.query.Agent_Id_,
// 			req.query.Agent_Name_,
// 			function (err, rows) {
// 				if (err) {
// 					;

// 					res.json(err);
// 				} else {
// 					console.log(rows);
// 					res.json(rows);
// 				}
// 			}
// 		);
// 	} catch (e) {
// 		;
// 	} finally {
// 	}
// });

router.get("/Load_Restriction_Status/", function (req, res, next) {
  try {
    Student.Load_Restriction_Status(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Load_OfferLetter_Type/", function (req, res, next) {
  try {
    Student.Load_OfferLetter_Type(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Load_Agents/", function (req, res, next) {
  try {
    Student.Load_Agents(function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post("/Save_Offerchasingdetails/", function (req, res, next) {
  try {
    Student.Save_Offerchasingdetails(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post(
  "/Save_Student_Document",
  upload.array("myFile"), //line to add
  (req, res, next) => {
    try {
      console.log(req.body);

      const file = req.files;

      var Image;
      var Photo_ = [];

      if (!file) {
      } else {
        for (var i = 0; i < req.body.Document_File_Array; i++) {
          if (i == req.body.ImageFile_Doc) Image = file[i].filename;
        }
      }
      var Docs;

      Docs = {
        Student_Document_Id: req.body.Student_Document_Id,
        Student_Id: req.body.Student_Id,
        Image: Image,
        File_Name: req.body.File_Name,
        Description: req.body.Description,
        Document_Id: req.body.Document_Id,
        Document_Name: req.body.Document_Name,
      };

      //  console.log(Schooling1)
      var jsondata1 = JSON.stringify(Docs);
      var Docs_Data = {
        Docs_D: jsondata1,
      };
      Student.Save_Student_Document(Docs_Data, function (err, rows) {
        if (err) {
          console.log(err);
          return 1;
        } else {
          return res.json(rows);
        }
      });
    } catch (err) {
      const error = new Error("Please upload a file");
      error.httpStatusCode = 400;
      return next(error);
    } finally {
    }
  }
);

router.get(
  "/Search_Conditions/:Application_details_Id_?",
  function (req, res, next) {
    try {
      Student.Search_Conditions(
        req.params.Application_details_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.post("/Save_Viewconditions/", function (req, res, next) {
  try {
    Student.Save_Viewconditions(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Load_Application_status_forchangestatus_restriction/:Group_Restriction_?",
  function (req, res, next) {
    try {
      Student.Load_Application_status_forchangestatus_restriction(
        req.params.Group_Restriction_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.post("/Save_DocumentName/", function (req, res, next) {
  try {
    Student.Save_DocumentName(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Search_DocumentName/", function (req, res, next) {
  try {
    Student.Search_DocumentName(req.query.Document_Name, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Delete_DocumentName/:Document_Id_?", function (req, res, next) {
  try {
    Student.Delete_DocumentName(req.params.Document_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.post("/Save_Qualification_Type/", function (req, res, next) {
  try {
    Student.Save_Qualification_Type(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Search_Qualification_Type/", function (req, res, next) {
  try {
    Student.Search_Qualification_Type(
      req.query.Qualification_Type_Name,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Delete_Qualification_Type/:Qualification_Type_Id_?",
  function (req, res, next) {
    try {
      Student.Delete_Qualification_Type(
        req.params.Qualification_Type_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.post("/Save_Document_Type/", function (req, res, next) {
  try {
    Student.Save_Document_Type(req.body, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Search_Document_Type/", function (req, res, next) {
  try {
    Student.Search_Document_Type(
      req.query.Document_Type_Name,
      function (err, rows) {
        if (err) {
          res.json(err);
        } else {
          res.json(rows);
        }
      }
    );
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Delete_Document_Type/:Document_Type_Id_?",
  function (req, res, next) {
    try {
      Student.Delete_Document_Type(
        req.params.Document_Type_Id_,
        function (err, rows) {
          if (err) {
            res.json(err);
          } else {
            res.json(rows);
          }
        }
      );
    } catch (e) {
    } finally {
    }
  }
);

router.post("/Student_duplicate_Import_Check/", function (req, res) {
  try {
    Student.Student_duplicate_Import_Check(req.body, function (err, rows) {
      if (err) {
        console.log(err);
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get(
  "/Get_ToStaff_Student_DataCount_Excel/:Branch_?/:Followup_Date_?/:Department_?",
  function (req, res, next) {
    try {
      Student.Get_ToStaff_Student_DataCount_Excel(
        req.params.Branch_,
        req.params.Followup_Date_,
        req.params.Department_,
        function (err, rows) {
          if (err) {
            console.log(err);
            res.json(err);
          } else {
            console.log(rows);
            res.json(rows);
          }
        }
      );
    } catch (e) {
      console.log(e);
    } finally {
    }
  }
);
router.get(
  "/Search_Student_Department_Report/",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Student_Department_Report(
        req.query.Fromdate_,
        req.query.Todate_,
        req.query.Department_,
        req.query.Branch_,
        req.query.ToStaff_Selection,
        req.query.ByStaff_Selection,
        req.query.Is_Date_Check_,
        req.query.Page_Index1_,
        req.query.Page_Index2_,
        req.query.Login_User_Id_,
        req.query.RowCount,
        req.query.RowCount2
      );
      //console.log(result)
      res.json(result);
    } catch (e) {
      console.log(e);
    } finally {
    }
  }
);
// Brand by Channel
router.get('/Get_Brand_By_Department/:Department_Id', function (req, res) {
  console.log(req.params.Department_Id);
  Student.Get_Brand_By_Department(req.params.Department_Id, function (err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }
    res.json(rows);
  });
});

// Model by Brand
router.get('/Get_Model_By_Brand/:Brand_Id', function (req, res) {
  Student.Get_Model_By_Brand(req.params.Brand_Id, function (err, rows) {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(rows);
  });
});

// DSE by Model
router.get('/Get_DSE_By_Model/:Country_Id', function (req, res) {
  Student.Get_DSE_By_Model(req.params.Country_Id, function (err, rows) {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(rows);
  });
});


// DSE by Department
router.get('/Get_Dse_Load_Data/:Branch_Id_?/:Department_Id_?', function (req, res) {
  Student.Get_Dse_Load_Data(req.params.Branch_Id_, req.params.Department_Id_, function (err, rows) {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(rows);
  });
});


/** Added on 04-12-2024 */

router.get(
  "/Search_Student_Report_CountryWise/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Enquiry_Source_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Is_Old_Datas_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?/:remarks_?/:To_User_?/:Status_Id_?/:Register_Value_?/:Date_value_?/:Country_id_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Student_Report_CountryWise(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Enquiry_Source_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Is_Old_Datas_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2,
        req.params.remarks_,
        req.params.To_User_,
        req.params.Status_Id_,
        req.params.Register_Value_,
        req.params.Date_value_,
        req.params.Country_id_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get(
  "/Search_Student_Report_CourseWise/:Fromdate_?/:Todate_?/:Search_By_?/:SearchbyName_?/:Department_?/:Enquiry_Source_?/:Branch_?/:By_User_?/:Is_Date_Check_?/:Is_Old_Datas_?/:Page_Index1_?/:Page_Index2_?/:Login_User_Id_?/:RowCount?/:RowCount2?/:remarks_?/:To_User_?/:Status_Id_?/:Register_Value_?/:Date_value_?/:Country_id_",
  async function (req, res, next) {
    var result = "";
    try {
      result = await Student.Search_Student_Report_CourseWise(
        req.params.Fromdate_,
        req.params.Todate_,
        req.params.Search_By_,
        req.params.SearchbyName_,
        req.params.Department_,
        req.params.Enquiry_Source_,
        req.params.Branch_,
        req.params.By_User_,
        req.params.Is_Date_Check_,
        req.params.Is_Old_Datas_,
        req.params.Page_Index1_,
        req.params.Page_Index2_,
        req.params.Login_User_Id_,
        req.params.RowCount,
        req.params.RowCount2,
        req.params.remarks_,
        req.params.To_User_,
        req.params.Status_Id_,
        req.params.Register_Value_,
        req.params.Date_value_,
        req.params.Country_id_
      );

      res.json(result);
    } catch (e) {
    } finally {
    }
  }
);

router.get("/Load_Country_By_User/:Login_User?", function (req, res, next) {
  try {
    Student.Load_Country_By_User(req.params.Login_User, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Load_Course_By_User/:Login_User?", function (req, res, next) {
  try {
    Student.Load_Course_By_User(req.params.Login_User, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Get_FollowUp/:Student_Id_?", function (req, res, next) {
  try {
    Student.Get_FollowUp(req.params.Student_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

router.get("/Get_Comments/:Application_Id_?", function (req, res, next) {
  try {
    Student.Get_Comments(req.params.Application_Id_, function (err, rows) {
      if (err) {
        res.json(err);
      } else {
        res.json(rows);
      }
    });
  } catch (e) {
  } finally {
  }
});

router.get("/Get_Campaign_Report", function (req, res, next) {
  console.log("Entered into the campaign report route");
  try {
    Student.Get_Campaign_Report(function (err, rows) {
      if (err) {
        console.error("Error fetching campaign report:", err);
        res.json(err);
      } else {
        console.log("Campaign Report Rows:", rows); // Log the data
        res.json(rows); // Return the result
      }
    });
  } catch (e) {
    console.error("Caught Exception:", e);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

router.get("/Send_Selected_Students/:ids", function (req, res, next) {
  const idString = req.params.ids;
  const selectedStudents = idString
    .split(",")
    .map((id) => parseInt(id.trim(), 10));

  Student.Send_Selected_Students(selectedStudents)
    .then((result) => {
      res.json(result[0]);
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

//Brevo bulk email sending for application/student reports.
router.post("/Send_Selected_Students", async (req, res) => {
  // const students = req.body;   //just commented here for testing.
  // const {templateId} = req.body;
  console.log("this are the datas came in the brevo setup", req.body);

  //  const templateId=27
  const students = req.body;
  const templateId = students[0]?.templateId;

  if (!templateId) {
    return res.status(400).json({ error: "Template ID is required" });
  }
  // For testing: Use hardcoded test data instead of req.body
  // const students = [
  //   {
  //     Student_Id: 1001,
  //     Student_Email: "Akhina@ufstechnologies.com",
  //     Student_Phone: "123-456-7890",
  //     Student_Department: "akhina department",
  //     Student_Name: "akhina",
  //     Student_Country: "kannur",

  //   },
  //   {
  //     Student_Id: 1002,
  //     Student_Email: "work@ufstechnologies.com",
  //     Student_Phone: "987-654-3210",
  //     Student_Department: "ufs department",
  //     Student_Name: "UFS",
  //     Student_Country: "Kochi",
  //   },
  //   {
  //     Student_Id: 1003,
  //     Student_Email: "malik@ufstechnologies.in",
  //     Student_Phone: "555-123-4567",
  //     Student_Department: "angular/node",
  //     Student_Name: "Malik",
  //     Student_Country: "Trivandrum",
  //   },
  // ];

  try {
    // Create an array of promises for each email send operation
    const emailPromises = students.map((student) => {
      const params = {
        Student_Id: student.Student_Id,
        Student_Name: student.Student_Name,
        Student_Email: student.Student_Email,
        Student_Phone: student.Student_Phone,
        Student_Department: student.Student_Department,
        // Student_Country: student.Student_Country || "Not specified",
      };
      console.log(params, "params");

      // Send email with using a template ID
      return axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
          to: [{ email: student.Student_Email, name: student.Student_Name }],
          sender: {
            name: "Malik UFS",
            email: "ufsdev123@gmail.com",
          },
          templateId: parseInt(templateId),
          params: params,
        },
        {
          headers: {
            "api-key":
              "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",
            "Content-Type": "application/json",
          },
        }
      );
    });

    // Wait for all email sending operations to complete in parallel
    await Promise.all(emailPromises);

    res.status(200).json({ message: "Emails sent successfully!" });
  } catch (error) {
    console.error(
      "Email sending failed:",
      error?.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to send emails" });
  }
});

module.exports = router;
