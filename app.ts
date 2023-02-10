require("dotenv").config();
const cors = require("cors");
const jwtDecode = require("jwt-decode");
const bcrypt = require('bcrypt');
const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const auth = require("./middleware/auth");
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const mysql = require('mysql');

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
  apis: ["app.ts"]
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
const url = "/api/V1";
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'Axel',
  password: 'L@kk@99!',
  database: 'cocktail-machine'
});

app.use(cors({
  origin: 'http://localhost:8100',
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ['content-type'],
  credentials: true
}));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(express.json());

const listener = app.listen(8888, () => {
  console.log(`Listening on port ${listener.address().port}`);
});


///ROUTES


app.get(url + '/utilisateurs', async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err
    console.log('connected as id ' + connection.threadId)
    connection.query('SELECT * from utilisateurs', (err, rows) => {
      connection.release() // return the connection to pool

      if (!err) {
        res.send(rows)
      } else {
        console.log(err)
      }

      // if(err) throw err
      console.log('Données utilisateurs : \n', rows)
    })
  })
})

app.get(url + '/utilisateurs/:email', async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      return res.send({
        error: "Une erreur s'est produite lors de la connexion à la base de données."
      });
    }

    let email = req.params.email;
    let sql = "SELECT * FROM utilisateurs WHERE email = ?";
    connection.query(sql, email, (err, result) => {
      connection.release(); // return the connection to pool

      if (!err) {
        if (result.length > 0) {
          res.send({
            prenom: result[0].prenom,
            nom: result[0].nom,
            email: result[0].email,
            password: result[0].password,
            photo_url: result[0].photo_url,
            age: result[0].age,
            taille: result[0].taille,
            poids: result[0].poids
          });
        } else {
          res.send({
            error: "Aucun utilisateur trouvé avec cet email."
          });
        }
      } else {
        res.send({
          error: "Une erreur s'est produite lors de la récupération des informations de l'utilisateur."
        });
      }
    });
  });
});

app.post(url + '/register', async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err

    console.log('Connected as id ' + connection.threadId)
    let prenom = req.body.prenom;
    let nom = req.body.nom;
    let email = req.body.email;
    let password = req.body.password;

    let sqlSelect = "SELECT * FROM utilisateurs WHERE email = ?";
    connection.query(sqlSelect, [email], async (err, result) => {
      if(result.length > 0){
        connection.release();
        res.send({
          message: "L'utilisateur est déjà inscrit"
        });
      } else {
        let hashedPassword = await bcrypt.hash(password, 10);
        let utilisateur = [email, nom, prenom, hashedPassword];
        let sql = "INSERT INTO utilisateurs (email, nom, prenom, password) VALUES ?";
        connection.query(sql, [[utilisateur]], (err, result) => {
          connection.release(); // return the connection to pool
          if (!err) {
            let token = jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.send({
              message: "Utilisateur ajouté avec succès!",
              token: token
            });
          } else {
            console.log(err)
            res.send({
              error: "Une erreur s'est produite lors de l'ajout de l'utilisateur."
            });
          }
        });
      }
    });
  });
});

app.post(url + '/login', async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err;

    console.log('Connected as id ' + connection.threadId);
    let email = req.body.email;
    let password = req.body.password;

    let sqlSelect = "SELECT * FROM utilisateurs WHERE email = ?";
    connection.query(sqlSelect, [email], async (err, result) => {
      if (!err) {
        if (result.length > 0) {
          const user = result[0];
          const isPasswordCorrect = await bcrypt.compare(password, user.password);

          if (isPasswordCorrect) {
            let token = jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.send({
              message: "Connexion réussie!",
              token: token
            });
          } else {
            res.send({
              error: "Mot de passe incorrect."
            });
          }
        } else {
          res.send({
            error: "Aucun utilisateur trouvé avec cet email."
          });
        }
      } else {
        res.send({
          error: "Une erreur s'est produite lors de la récupération des informations de l'utilisateur."
        });
      }
    });
  });
});


app.put(url + '/utilisateurs/:email', async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err
    console.log('Connecté en tant que id ' + connection.threadId)
    let prenom = req.body.given_name;
    let nom = req.body.family_name;
    let email = req.params.email;
    let photo_url = req.body.picture;
    let age = req.body.age;
    let taille = req.body.taille;
    let poids = req.body.poids;
    let utilisateur = [nom, prenom, photo_url, age, taille, poids, email];
    let sql = "UPDATE utilisateurs SET nom = ?, prenom = ?, photo_url = ?, age = ?, taille = ?, poids = ? WHERE email = ?";
    connection.query(sql, utilisateur, (err, result) => {
      connection.release() // return the connection to pool
      if (!err) {
        res.send({
          message: "Utilisateur modifié avec succès!"
        });
      } else {
        console.log(err)
        res.send({
          error: "Une erreur s'est produite lors de la modification de l'utilisateur."
        });
      }
    })
  })
})

app.get(url + '/ingredients', async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err
    console.log('connected as id ' + connection.threadId)
    connection.query('SELECT * from ingredients', (err, rows) => {
      connection.release() // return the connection to pool

      if (!err) {
        res.send(rows)
      } else {
        console.log(err)
      }

      // if(err) throw err
      console.log('Données utilisateurs : \n', rows)
    })
  })
})

app.put(url + '/ingredients/:id', async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err
    console.log('Connected as id ' + connection.threadId)
    connection.query(`UPDATE ingredients SET Est_Disponible = ${req.body.Est_Disponible} WHERE ID_Ingredient = ${req.params.id}`, (err, rows) => {
      connection.release() // return the connection to pool

      if (!err) {
        res.send(rows)
      } else {
        console.log(err)
      }

      console.log('Data updated : \n', rows)
    })
  })
})

app.get(url + '/cocktails', async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err
    console.log('connected as id ' + connection.threadId)
    connection.query('SELECT * from cocktail WHERE Est_Disponible = 1', (err, rows) => {
      connection.release() // return the connection to pool

      if (!err) {
        res.send(rows)
      } else {
        console.log(err)
      }

      // if(err) throw err
      console.log('Données utilisateurs : \n', rows)
    })
  })
})

app.put(url + '/cocktail/:id', async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err
    connection.query(`UPDATE cocktail SET Est_Disponible = ${req.body.Est_Disponible} WHERE Cocktail_ID = ${req.params.id}`, (err, rows) => {
      connection.release() // return the connection to pool

      if (!err) {
        res.send(rows)
      } else {
        console.log(err)
      }

      console.log('Data updated : \n', rows)
    })
  })
})

app.get(url + '/cocktailcomposition', async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err
    connection.query(`SELECT * from cocktail_composition`, (err, rows) => {
      connection.release() // return the connection to pool

      if (!err) {
        res.send(rows)
      } else {
        console.log(err)
      }

      // if(err) throw err
      console.log('Données utilisateurs : \n', rows)
    })
  })
})

app.get(url + '/cocktailcomposition/:id', async (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err
    console.log('connected as id ' + connection.threadId)
    connection.query(`SELECT * from cocktail_composition WHERE ID_Cocktail = ${req.params.id}`, (err, rows) => {
      connection.release() // return the connection to pool

      if (!err) {
        res.send(rows)
      } else {
        console.log(err)
      }

      // if(err) throw err
      console.log('Données utilisateurs : \n', rows)
    })
  })
})

module.exports = app;