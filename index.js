const express = require('express');
const port = process.env.PORT || 5000;
const index = express();

const SignUpData = require('./model/signupmodel');
const employmodel = require('./model/employmodel');

const multer = require('multer');
const session = require('express-session');
    // aPZAsutyIsa8
    const fs = require('fs');
// const signupdata = require('./model/signupmodel');


const cookieparser = require('cookie-parser');

const jwt = require('jsonwebtoken');
const { requireAuth, checkUser } = require('./middleware/middleware');
index.use(session({
    secret: "my secret key",
    saveUninitialized: true,
    resave: false
}));





index.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
})

;
index.use(express.json())
index.use(express.urlencoded({ extended: true }));
index.use(express.static("./public"));
index.set("view engine", "ejs");
index.set("views", __dirname + "/src/views");
index.use(cookieparser());


index.get('*', checkUser)
// index or login page
    index.get("/", function (req, res) {
            res.render("index");
        });

// employ page
    index.get("/employ",requireAuth ,function (req, res) {
        employmodel.find()
            .then(function (items) {
                res.render("employ", {
                    items
                });
            });
    });
// employ single page
    index.get("/single/:id", function (req, res) {
        const i = req.params.id;

        employmodel.findOne({ _id: i })
            .then(function (item) {
                res.render("single", {
                    item
                });
        })
    }); 

    // index.get("/single", function (req, res) {
    //     res.render("single");
    // });
// adding employ
    index.get("/addemploy", function (req, res) {
            res.render("addemploy");
        });

// signup page
index.get("/signup", function (req, res) {
    res.render("signup");
});
// logout
    index.get('/logout', (req, res) => {
        res.cookie('jwt', '', { maxAge: 1 });
        res.redirect('/');
    });


// multer
    var fileStorageEngine = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, './public/images/')
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '--' + file.originalname);
        },
    });
    var imageupload = multer({ storage: fileStorageEngine });
    
//employ adding
    index.post('/addemploy/add', imageupload.single('image'), function (req, res) {
            var items = {
                    
                name: req.body.name,
                gender: req.body.gender,
                designation: req.body.designation,
                city: req.body.city,
                image: req.file.filename
            }
            var saveemploydata = employmodel(items);
        
    // saveemploydata.save();
        saveemploydata.save((err) => {
            if (err) {
                res.json({ message: err.message, type: 'danger' })
            } else {
                req.session.message = {
                    type: 'success',
                    message: 'employee added successfully'
                }
                res.redirect('/employ')
            }
        });
        
            // res.redirect('/employ');
})

// getting update page
    index.get("/update/:id", function (req, res) {
        let id = req.params.id;
        employmodel.findById(id, (err, items) => {
            if (err) {
                res.redirect('/employ')
            } else {
                res.render("update", {
                    items
                });
                // if (user == null) {
                //     res.redirect('/employ') 
                // }
            };
        })
    });



// updating employ
    index.post('/update/:id', imageupload.single('image'), (req, res) => {
        let id = req.params.id;
        let new_image = "";
        if (req.file){
            new_image = req.file.filename;
            try {
                fs.unlinkSync('./public/images/'+ req.body.old_image)
            } catch (err) {
                console.log(err)
            }
        } else {
            new_image = req.body.old_image;
        }
    employmodel.findByIdAndUpdate(id, {
            name: req.body.name,
            gender: req.body.gender,
            designation: req.body.designation,
            city: req.body.city,
            image: new_image,
        }, (err, result) => {
            if (err) {
                res.json({ message: err.message, type: 'danger' })
            } else {
                req.session.message = {
                    type: 'success',
                    message: 'employee updated successfully'
                }
                res.redirect('/employ')
            }
        })
    });

//employ deleting
    index.get('/delete/:id', (req, res) => {
        let id = req.params.id;
        employmodel.findByIdAndRemove(id, (err, result) => {
            if (result.image != '') {
                try {
                    fs.unlinkSync('./public/images/' + result.image)
                } catch (err) {
                    console.log(err)
                }
            };
            if (err) {
                res.json({ message: err.message })
            } else {
                req.session.message = {
                    type: 'info',
                    message: 'employee deleted successfully'
                };
                res.redirect('/employ')
            }
        })
    });
   

//error handlng
    const signuperrors = (err) => {
        console.log(err.message, err.code);
        let errors = { email: '', password: '' };

        //incorrect email
        if (err.message === "incorrect email") {
            errors.email='that email is not registered'
        }
        //incorrect password
        if (err.message === "incorrect password") {
            errors.password='that password is incorrect'
        }
        
        // duplicate email error code mesage
        if (err.code === 11000) {
            errors.email = 'that email is already registered';
            return errors;
        };
        // validation errors
        if (err.message.includes('signupdata validation failed')) {
            // console.log(Object.values(err.errors));

            Object.values(err.errors).forEach(({properties}) => {
                // console.log(error.properties);
                errors[properties.path] = properties.message;
            })
        }
        return errors;
    }  


// jwt token create
    const maxAge= 60*60*15 //jwt expects seconds not milliseconds like cookies
    const createToken = (id) => {
        return jwt.sign({ id }, 'my secret jwt secret key',{
            expiresIn: maxAge
        })
    }

    
//signup data insert to mongo db
    index.post('/signup', async function (req, res) {
        let email = req.body.email;
        let password = req.body.password;
        let username = req.body.username;
        // const { username, email, password } = req.body;
        try {
            const signup = await SignUpData.create({ username, email, password });
            const token = createToken(signup._id);
        
            res.cookie('jwt', token, { httpOnly: true, maxAge : maxAge * 1000 });
            res.status(201).json({ signup: signup._id });

        } catch (err) {
            const errors= signuperrors(err);
            // console.log(err);
            res.status(400).json({ errors })
        }
        
    });



//login post
    index.post('/', async function (req, res) {
            
        const { email, password } = req.body;

    try {
        const user = await SignUpData.login(email, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200).json({ signup : user._id });
    } 
    catch (err) {
        const errors = signuperrors(err);
        res.status(400).json({ errors });
    }


    //     // mongo check for user
    //     if (email == 'admin@gmail.com' && password == '12345') {
    //         req.session.role = 'admin';
    //         console.log("admin login success")
    //         res.send({ status: true });

    // } else {
    //         SignUpData.findOne({ email: email, password: password }, function (err, user) {
    //             if (err) {
    //                 res.send({ status: false, data: 'Response error. No Internet' });

    //             }
    //             else if (user) {
    //                 console.log("user data", user)
    //                 req.session.role = 'user';
    //                 res.send({ status: true });
    //             } else {
    //                 res.send({ status: false, data: 'NOT FOUND' });
    //             }
    //         });
    //     };
    });    

// cookies
    // index.get('/set-cookies', (req, res) => {
    //     // res.setHeader('Set-Cookie', 'newUser=true');
    //     res.cookie('newUser', false);
    //     res.cookie('isEmployee', true, { maxAge: 1000 * 60 * 60 * 15 });
    //     // res.cookie('isEmployee', true, { maxAge: 1000 * 60 * 60 * 15, httpOnly:true });
    //     // res.cookie('isEmployee', true, { maxAge: 1000 * 60 * 60 * 15, secure:true });
    //     res.send('you got the cookie!');
    // })

    // index.get('/read-cookies', (req, res) => {
    //     const cookies = req.cookies;
    //     console.log(cookies);
    //     console.log(cookies.isEmployee);
    //     res.json(cookies);
    // })


index.listen(port, () => console.log("app listening at " + port));