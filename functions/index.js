// Require Resourses
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require('express');
const cors = require('cors');
const serviceAccount = require("./permissions.json");
const jwt = require('jsonwebtoken');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://simple-app-416f2-default-rtdb.firebaseio.com"
});

const app = express();
const db = admin.firestore();

const generateToken = user => {
  let userData = {
    username: user.username,
    userEamil: user.email,
  };
  let token = jwt.sign(userData, 'SECRET');
  return token;
};

// CALCULATION API
app.post('/api/v1/calculate', (req, res, next) => {
  try {
    let { firstNumber, secondNumber, operation } = req.body;
    var result;
    switch (operation) {
      case '+':
      result = parseInt(firstNumber) + parseInt(secondNumber);
      break;
      case '-':
      result = parseInt(firstNumber) - parseInt(secondNumber);
      break;
      case '*':
      result = parseInt(firstNumber) * parseInt(secondNumber);
      break;
      case '/':
      result = parseInt(firstNumber) / parseInt(secondNumber);
      break;
      default:
      result = 'invalid operation';
      break;
    }
    res.status(200).send(`${result}`);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

// SnapShot API
app.post('/api/v1/snapShot', (req, res) => {
  try {
    let { message } = req.body;
    res.status(200).send(message)
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

// AUTH APIs

app.post('/api/v1/signUp', (req, res) => {
    (async () => {
        let doc = db.collection('users').doc('/' + req.body.username + '/')
        let user = await doc.get();
        if (user.data()) {
          res.status(200).json({ message: `This user ${req.body.username} is exist` });
        } else {
          try {
            let userData = {
              username: req.body.username,
              password: req.body.password,
              email: req.body.email
            };
            await db.collection('users').doc('/' + req.body.username + '/').create(userData);
            let token = generateToken(userData);
            return res.status(200).json({ user: userData, token: token, message: 'signUp Successfully'});
          } catch (error) {
            console.log(error);
            return res.status(500).send(error);
          }
        }
      })();
  });

  app.post('/api/v1/signIn', (req, res) => {
    (async () => {
        let doc = db.collection('users').doc('/' + req.body.username + '/')
        let userDoc = await doc.get();
        let user = userDoc.data();
        if (user) {
          try {
            if (user.password == req.body.password) {
              let token = generateToken(user);
              return res.status(200).json({ user: user, token: token, message: 'signIn Successfully'});
            } else res.status(200).json({message: 'The password is incorrect' });
          } catch (error) {
            console.log(error);
            return res.status(500).send(error);
          }
        } else {
          res.status(200).json({ message: `This user ${req.body.username} is not exist` });
        }
      })();
  });

  app.post('/api/v1/checkAccount', (req, res) => {
    (async () => {
        let doc = db.collection('users').doc('/' + req.body.username + '/')
        let userDoc = await doc.get();
        let user = userDoc.data();
        if (user) {
          try {
            res.status(200).json({ username: user.username, message: 'Create a new password' });
          } catch (error) {
            console.log(error);
            return res.status(500).send(error);
          }
        } else {
          res.status(200).json({ message: `This user ${req.body.username} is not exist` });
        }
      })();
  });

  app.post('/api/v1/createNewPassword', (req, res) => {
    (async () => {
      try {
        if (req.body.username && req.body.password) {
          let doc = db.collection('users').doc('/' + req.body.username + '/')
          let userDoc = await doc.get();
          let user = userDoc.data();
          user.password = req.body.password;
          doc.update(user).then(data => {
            let token = generateToken(user);
            return res.status(200).json({ user: user, token: token, message: 'Created a new password Successfully' });
          })
        } else return res.status(200).json({ message: 'Type your new password' });
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });

exports.app = functions.https.onRequest(app);
