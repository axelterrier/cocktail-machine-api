//#region require

require("dotenv").config();

const cors = require("cors");
const { exit } = require("process");
const { default: jwtDecode } = require("jwt-decode");
const { format } = require('date-fns');
const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const auth = require("./middleware/auth");
const jwt_decode = require("jwt-decode");
const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const url = "/api/V1"
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "API Client",
      contact: {
        name: "UwU Eats"
      },
      servers: ["https://localhost:8888/api/V1"]
    }
  },
  // on donne l'endroit ou sont les routes
  apis: ["app.ts"]
};

app.use(cors({ origin: 'http://localhost:8100', methods: "GET,HEAD,PUT,PATCH,POST,DELETE", allowedHeaders: ['content-type'], credentials: true }));
const swaggerDocs = swaggerJsDoc(swaggerOptions)
//#endregion

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(express.json());

var listener = app.listen(8888, function () {
  console.log('Listening on port ' + listener.address().port); //Listening on port 8888
});

//#region route

//#region api utilisateur

// URL : /api/V1

app.post(url + "/user", async (req, res) => {
  try {
    if(req.body == null){
      const data = 'nullos'
      console.log(data)
      res.status(200).json({ message: "Les données de l'utilisateur ont été enregistrées", data });
    }else{
      const { given_name, family_name, picture, email } = req.body;
      const data = { given_name, family_name, picture, email };
      console.log(data)
      res.status(200).json({ message: "Les données de l'utilisateur ont été enregistrées", data });
    }
    
    // Insérer les données de l'utilisateur dans la base de données ou faire ce que vous voulez avec elles
  } catch (err) {
    res.status(500).send({ message: "Une erreur s'est produite", error: err }).end();
  }
});

//#endregion

//#endregion

//#region fonction

//Vérifie qu'un token existe et qu'y a pas d'erreur dans le token
function checkToken(req, res) {
  const token = req.cookies['token']

  if (!token) {
    res.status(403).send("A token is required for authentication").end();
  } else {
    var payload
    try {
      payload = jwt.verify(token, process.env.TOKEN_KEY)
    } catch (e) {
      if (e instanceof jwt.JsonWebTokenError) {
        return res.status(401).end()
      }
      return res.status(400).end()
    }
  }
  exit
}

//récupère et décode le token
function getInfoToken(req, res) {
  const token = req.cookies['token'];
  let decodedToken = jwt_decode(token);
  return decodedToken;
}

//Vérifie l'ID du token et l'ID demandé dans l'URL correspond
function checkIDToken(req, res) {
  let decodedToken = JSON.stringify(getInfoToken(req, res).user.id);
}

function checkTokenA(req, res, next) {
  const expirationTime = 5 * 24 * 60 * 60; // 5 jours en secondes
  const tokenU = jwt.sign({}, process.env.TOKEN_KEY, { expiresIn: expirationTime });
  res.header('authorization', tokenU)
  const bearerHeader = req.headers['authorization'];
  if (!bearerHeader) {
    console.log("JWT n'existe pas ");
    return res.status(403).json({ message: "A token is required for authentication" });
  }
  const token = bearerHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    console.log('JWT est valide:', decoded);
    next();
  } catch (err) {
    console.log('JWT est invalide:', err);
    return res.status(401).json({ message: "Invalid token" });
  }
}
//#endregion

module.exports = app;