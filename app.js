var express = require('express');
var createError = require('http-errors');
var app = express();
var PORT = process.env.PORT || 9000;
var bodyParser = require('body-parser');
const conn = require('./src/config/dbconfig');
const passHash = require('./src/constants/hashdata');
const rateLimit = require("express-rate-limit");
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
// increase the limit
myEmitter.setMaxListeners(0);
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5
});



const todayDate = (today) => {
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();
  var today_date = yyyy + '-' + mm + '-' + dd;
  var sec = String(today.getSeconds()).padStart(2, '0');
  var min = String(today.getMinutes()).padStart(2, '0');
  var hour = String(today.getHours()).padStart(2, '0');
  var today_time = hour + ':' + min + ':' + sec;
  var trnx_date = today_date + " " + today_time;
  return trnx_date;
}

const setExpiryDate = (today, planDuration) => {

  //calculate no of days from today to get expiry date
  var daysFromToday = today.setDate(today.getDate() + planDuration);
  var new_date = new Date(daysFromToday)

  var dd = String(new_date.getDate()).padStart(2, '0');
  var mm = String(new_date.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = new_date.getFullYear();
  var expiry_date = yyyy + '-' + mm + '-' + dd;
  var sec = String(new_date.getSeconds()).padStart(2, '0');
  var min = String(new_date.getMinutes()).padStart(2, '0');
  var hour = String(new_date.getHours()).padStart(2, '0');
  var expiry_time = hour + ':' + min + ':' + sec;
  var expires = expiry_date + " " + expiry_time;

  return expires;
}

const updateExpiryDate = (newDate) => {

  var getDate = new Date(newDate)
  var dd = String(getDate.getDate()).padStart(2, '0');
  var mm = String(getDate.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = getDate.getFullYear();
  var expiry_date = yyyy + '-' + mm + '-' + dd;
  var sec = String(getDate.getSeconds()).padStart(2, '0');
  var min = String(getDate.getMinutes()).padStart(2, '0');
  var hour = String(getDate.getHours()).padStart(2, '0');
  var expiry_time = hour + ':' + min + ':' + sec;
  var expires = expiry_date + " " + expiry_time;

  return expires;
}

//twiio credentials
const accountSid = "ACe2d8627c07ea8a6b11be6813194ba743";
const authToken = "7b782cc430b0e64c7bf0f5aa043c624b";
const client = require('twilio')(accountSid, authToken);

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/register', function (req, res, next) {

  var post_data = req.body;
  var firstname = post_data.firstname;
  var lastname = post_data.lastname;
  var email = post_data.email;
  var password = post_data.password;
  var username = post_data.username;
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();
  var reg_date = yyyy + '-' + mm + '-' + dd;
  var dob = post_data.dob;
  var phone = post_data.phone;

  const status = {
    message: "",
  }


  conn.query('SELECT * FROM users WHERE email=? OR username=?', [email, username], function (error, result) {

    conn.on('error', function (err) {
      console.log(['[MYSQL ERROR]'], err);
    });

    if (result && result.length) {
      status.message = "Email/Username is already registered.";
      res.json(status);

    } else {
      var values = [firstname, lastname, email, password, username, reg_date, dob, phone];
      var sql = `INSERT INTO users (firstname, lastname, email,user_password,username,reg_date,dob,phone_number) 
      VALUES (?,?,?,?,?,?,?,?)`;

      conn.query(sql, values, function (error, response) {

        if (error) {
          console.log("Result: " + error);
          status.message = "error" + error;
          res.json(status);

        } else {
          status.message = "success";
          res.json(status);

        }

      });
      
      conn.end();
    }
  });

});


app.post('/sendotp', function (req, res, next) {

  var post_data = req.body;
  var phone = post_data.phoneWithCode;
  var otp = post_data.vcode;

  console.log(phone)

  const status = {
    message: "",
  }

  client.messages
    .create({
      body: 'Your Verification Code is ' + otp,
      from: 'HUKER',
      to: phone
    })
    .then(msg => {
      status.message = msg.status;
      res.json(status);
    });

});

app.post('/login_user', function (req, res, next) {

  var post_data = req.body;
  var username = post_data.username;
  var password = post_data.password;

  const status = {
    message: "",
  }

  conn.query('SELECT * FROM users WHERE email=? OR username=?', [username, username], function (error, result) {

    if (result && result.length) {

      if(password == result[0].user_password){
        status.message = "success";
        res.json(status);
      }else{
        status.message = "pass_error";
        res.json(status);
      }
      

    } else {
      console.log("Result: " + error);
      status.message = "error";
      res.json(status);
    }

    conn.on('error', function (err) {
      console.log(['[MYSQL ERROR]'], err);
    });


  });


});

app.get('/get_ladies', function (req, res, next) {

  const status = {
    message: "",
    data: ""
  }

  conn.query('SELECT * FROM ladies LIMIT 5', function (error, result) {

    if (result && result.length) {
      status.message = "success";
      status.data = result
      res.json(status);

    } else {
      console.log("Result: " + error);
      status.message = "error";
      res.json(status);
    }

    conn.on('error', function (err) {
      console.log(['[MYSQL ERROR]'], err);
    });


  });


});

app.post('/get_ladies_data', function (req, res, next) {

  const status = {
    message: "",
    data: ""
  }

  var post_data = req.body;
  var getID = post_data.hukeeID

  console.log(getID)

  conn.query('SELECT * FROM ladies WHERE ladies_id=?', [getID], function (error, result) {

    if (result && result.length) {
      status.message = "success";
      status.data = result
      res.json(status);

    } else {
      console.log("Result: " + error);
      status.message = "error";
      res.json(status);
    }

    conn.on('error', function (err) {
      console.log(['[MYSQL ERROR]'], err);
    });


  });


});


app.post('/get_user_data', function (req, res, next) {

  const status = {
    message: "",
    phooks: "",
    plan: "",
    pexpiry: "",
    pstatus: "",

  }

  var post_data = req.body;
  var getID = post_data.user

  conn.query('SELECT * FROM users WHERE email=? OR username=?', [getID,getID], function (error, result) {

    if (result && result.length) {
      status.message = "success";
      status.phooks = result[0].hooks_rem
      status.plan = result[0].subscription_plan
      status.pstatus = result[0].subscription_status

      console.log(result)

      //get no of days left from today to expiry date
      var expires = new Date(result[0].subscription_expiry);
      var today = new Date();
      var diffInTime = expires.getTime() - today.getTime();
      var diffInDays = Math.round(diffInTime / (1000 * 3600 * 24));

      status.pexpiry = diffInDays

      res.json(status);

    } else {
      console.log("Result: " + error);
      status.message = "error";
      res.json(status);
    }

    conn.on('error', function (err) {
      console.log(['[MYSQL ERROR]'], err);
    });


  });


});


app.post('/search_ladies', function (req, res, next) {

  const status = {
    message: "",
    data: ""
  }

  var post_data = req.body;
  var searchTerm = post_data.searchTerm

  console.log("searchTerm = " + searchTerm)

  let sql = `SELECT * FROM ladies WHERE ladies_name LIKE ` + conn.escape(`${searchTerm}_%`)


  conn.query(sql, function (error, result) {

    if (result && result.length) {
      status.message = "success";
      status.data = result
      res.json(status);

    } else {
      console.log("Result: " + error);
      status.message = "error";
      res.json(status);
    }

    conn.on('error', function (err) {
      console.log(['[MYSQL ERROR]'], err);
    });


  });


});


app.get('/all_ladies', function (req, res, next) {


  const status = {
    message: "",
    data: ""
  }

  conn.query('SELECT * FROM ladies', function (error, result) {

    if (result && result.length) {
      status.message = "success";
      status.data = result
      res.json(status);

    } else {
      console.log("Result: " + error);
      status.message = "error";
      res.json(status);
    }

    conn.on('error', function (err) {
      console.log(['[MYSQL ERROR]'], err);
    });


  });

});


app.get('/get_plans', function (req, res, next) {

  const status = {
    message: "",
    data: ""
  }

  conn.query('SELECT * FROM subscriptions', function (error, result) {

    if (result && result.length) {
      status.message = "success";
      status.data = result
      res.json(status);

    } else {
      console.log("Result: " + error);
      status.message = "error";
      res.json(status);
    }

    conn.on('error', function (err) {
      console.log(['[MYSQL ERROR]'], err);
    });


  });

});

app.post('/subscription_payment', function (req, res, next) {


  var post_data = req.body;
  var amt = post_data.getAmount;
  var planid = post_data.getId;
  var user = post_data.getUser;
  var name = post_data.getName;
  var ref = post_data.getTrnxRef;
  var purpose = "Subscription";
  var today = new Date();
  var trnx_date = todayDate(today);


  const status = {
    message: "",
  }

  var values = [user, amt, purpose, planid, name, ref, trnx_date];
  var sql = `INSERT INTO transactions (owner, amount, purpose,plan_id,plan_name,ref,date) 
  VALUES (?,?,?,?,?,?,?)`;


  conn.query(sql, values, function (error, response) {

    if (error) {
      status.message = "error";
      res.json(status);

    } else {

      //fetch number of hooks for each subscription category
      var retrieveSql = 'SELECT * FROM subscriptions WHERE id=?'
      conn.query(retrieveSql, [planid], function (err, result) {

        if (err) throw err.message;
        var planHooks = result[0].no_of_hooks
        var planDuration = result[0].no_of_days

        if (planHooks) {

          var status = "Active";

          //get current user subscription
          var querySql = `SELECT hooks_rem,subscription_expiry FROM users WHERE email=? OR username=?`;
          var queryValues = [user,user];

          conn.query(querySql, queryValues, function (err2, result, fields) {

            if (err2) throw err2.message;
            var hooksLeft = result[0].hooks_rem
            var subExpiry = result[0].subscription_expiry
            //calculate hooks to receive
            var hooksToGet = planHooks + hooksLeft;

            //calculate new expiry date
            var expiry_date = setExpiryDate(today, planDuration);

            //to get new expiry date, calculate the number of days between the old date in DB and 
            // the new proposed expiration date
            //then add the days to the new proposed date

            var formerExpiry = new Date(expiry_date);
            var newExpiry = new Date(subExpiry);
            var diffInTime = formerExpiry.getTime() - newExpiry.getTime();
            var diffInDays = Math.round(diffInTime / (1000 * 3600 * 24) + 1);
            var newExpiryDate = updateExpiryDate(newExpiry.setDate(newExpiry.getDate() + diffInDays));

            console.log("the diff in days is " + diffInDays)

            //update user subscription status
            var update_sql = `UPDATE users SET subscription_plan=?,subscription_status=?,hooks_rem=?,subscription_expiry=? WHERE email=? OR username=?`;
            var updateValues = [name, status, hooksToGet, newExpiryDate, user,user];

            conn.query(update_sql, updateValues, function (err1, result, fields) {

              if (err1) throw err1.message;
              conn.on('error', function (err) {
                console.log(['[MYSQL ERROR]'], err);
              });

            });

          })


        }

        conn.on('error', function (err) {
          console.log(['[MYSQL ERROR]'], err);
        });


      });


      //send response to react native
      status.message = "success";
      res.json(status);
    }

    conn.on('error', function (err) {
      console.log(['[MYSQL ERROR]'], err);
    });


  });

});



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});


app.listen(PORT, (err) => {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});


module.exports = app;
