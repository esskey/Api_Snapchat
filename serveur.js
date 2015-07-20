/*jslint browser:true, node:true */
/*jslint indent:4 */
/*global $scope, angular */
"use strict";
var connexion,
    object,
    param,
    params,
    token = Math.random().toString(36).substr(2),
    express = require('express'),
    mysql = require('mysql'),
    sha1 = require('sha1'),
    email = require('email-address'),
    body = require('body-parser'),
    multer = require('multer'),
    app = express();

app.use(multer({ dest: './uploads/'}));
app.use(body.json());
app.use(body.urlencoded({ extended: true }));
app.use(multer({ dest: './uploads/'}));

connexion = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'apisnap',
    port     : '8889'
});

connexion.connect(function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log("pas d'erreurs");
    }
});

app.post("/signup", function (req, res) {
    if (email.isValid(req.body.email)) {
        if (req.body.password) {
            connexion.query('SELECT email FROM users WHERE email = ?', [req.body.email], function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    if (result.length === 0) {
                        params = {
                            id: '',
                            email: req.body.email,
                            password: sha1(req.body.password),
                            token: ''
                        };

                        connexion.query('INSERT INTO users SET ?', params, function (err, result) {
                            if (err) {
                                console.log(err);
                            } else {
                                object = {
                                    error: false,
                                    data: params,
                                    token: null
                                };

                                res.send(object);
                            }
                        });
                    } else {
                        object = {
                            error: "l'email existe deja",
                            data: null,
                            token: null
                        };
                        res.send(object);
                    }
                }
            });
        } else {
            object = {
                error: "password vide",
                data: null,
                token: null
            };
            res.send(object);
        }
    } else {
        object = {
            error: "l'email n'est pas valide ou vide",
            data: null,
            token: null
        };
        res.send(object);
    }
});

app.post("/login", function (req, res) {
    if (email.isValid(req.body.email)) {
        if (req.body.password) {
            connexion.query('SELECT id, email, password FROM users WHERE email = ? AND password = ?', [req.body.email, sha1(req.body.password)], function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    if (result.length === 0) {
                        object = {
                            error: "L'email ou le mot de passe sont incorrecte",
                            data: null,
                            token: null
                        };

                        res.send(object);
                    } else {
                        connexion.query("UPDATE users SET token = ? WHERE email = ?", [token, req.body.email]);

                        object = {
                            error: false,
                            data: result,
                            token: token
                        };

                        res.send(object);
                    }
                }
            });
        } else {
            object = {
                error: "pasword vide",
                data: null,
                token: null
            };
            res.send(object);
        }
    } else {
        object = {
            error: "l'email n'est pas valide",
            data: null,
            token: null
        };
        res.send(object);
    }
});

app.post("/listsnap", function (req, res) {
    if (req.body.email && req.body.token) {
        connexion.query('SELECT snap.url, snap.activate, u1.email, u2.token, snap.temps, snap.id FROM snap LEFT JOIN users AS u1 ON snap.id_sender = u1.id LEFT JOIN users AS u2 ON snap.id_receiver = u2.id WHERE u2.email = ? AND u2.token = ? AND activate = 1', [req.body.email, req.body.token], function (err, result) {
            if (err) {
                console.log(err);
            } else {
                object = {
                    error: false,
                    data: result,
                    token: req.body.token
                };
                res.send(object);
            }
        });
    }
});

app.post("/listuser", function (req, res) {
    if (req.body.email && req.body.token) {
        connexion.query('SELECT email, id FROM users WHERE email != ?', [req.body.email], function (err, result) {
            if (err) {
                console.log(err);
            } else {
                object = {
                    error: false,
                    data: result,
                    token: req.body.token
                };
                res.send(object);
            }
        });
    } else if (req.body.email && req.body.token === null) {
        object = {
            error: "token non renseigné",
            data: null,
            token: null
        };
        res.send(object);
    } else if (req.body.email === null && req.body.token) {
        object = {
            error: "email non renseigné",
            data: null,
            token: null
        };
        res.send(object);
    }
});

app.post("/vu", function (req, res) {
    if (req.body.email && req.body.token && req.body.id_snap) {
        connexion.query("UPDATE snap SET activate = 0 WHERE id = ?", [req.body.id_snap]);
        object = {
            error: false,
            data: null,
            token: null
        };
        res.send(object);

    } else {
        object = {
            error: "email ou token ou id_snap non renseigné",
            data: null,
            token: null
        };
        res.send(object);
    }
});

app.post("/editemail", function (req, res) {
    console.log(req.body);
    if (email.isValid(req.body.newemail)) {
        connexion.query('SELECT email FROM users WHERE email = ?', [req.body.newemail], function (err, result) {
            if (err) {
                console.log(err);
            } else {
                if (result.length === 0) {
                    connexion.query("UPDATE users SET email = ? WHERE id = ?", [req.body.newemail, req.body.id]);
                    object = {
                        error: false,
                        data: req.body,
                        token: null
                    };
                    res.send(object);
                } else {
                    object = {
                        error: "email existe dejas",
                        data: null,
                        token: null
                    };
                    res.send(object);
                }
            }
        });
    } else {
        object = {
            error: "l'email n'est pas valide ou vide",
            data: null,
            token: null
        };
        res.send(object);
    }
});

app.post("/editpass", function (req, res) {
    console.log(req.body);
    if (req.body.email && req.body.password) {
        connexion.query("UPDATE users SET password = ? WHERE id = ?", [sha1(req.body.password), req.body.id]);
        object = {
            error: false,
            data: req.body,
            token: null
        };
        res.send(object);
    } else {
        object = {
            error: "password non renseigné",
            data: null,
            token: null
        };

        res.send(object);
    }
});

app.post("/sendpeax", function (req, res) {
    console.log(req);
    connexion.query('SELECT id FROM users WHERE email = ?', [req.body.email], function (err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log(result[0].id);
            params = {
                id: '',
                id_receiver: req.body.id_receiver,
                id_sender: result[0].id,
                url: "http://localhost:8888/developpement_approfondissement_2/" + req.files.file.path,
                temps: req.body.temps
            };

            connexion.query('INSERT INTO snap SET ?', params, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    object = {
                        error: false,
                        data: null,
                        token: null
                    };

                    res.send(object);
                }
            });
        }
    });
});

app.listen(3000, function () {
    console.log('Serveur lancé');
});