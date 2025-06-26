import { mlog, test } from './vendor/logs.js';
import { format } from 'date-fns';
var appDir = path.dirname(import.meta.url);
appDir = appDir.split('///');
appDir = appDir[1];
console.log(appDir);

process.on('uncaughtException', (err) => {
    mlog("Глобальный косяк приложения!!", err.stack);
});

import express from 'express';
import exphbs from 'express-handlebars';
import fileUpload from 'express-fileupload';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs-extra';
import 'dotenv/config';
import * as db from './vendor/db.mjs';
import bcrypt from 'bcryptjs';

import { type } from 'os';

const app = express();
const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs',
});

const TEMP_FOLDER = path.join(appDir, 'public/temp');

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', 'views');

if (test) {
    app.use(express.static(path.join(appDir, 'public')));
    app.set('views', 'views');
} else {
    app.use(express.static(path.join('/', appDir, 'public')));
    app.set('views', path.join('/', appDir, 'views'));
}

console.log(path.join(appDir, 'public'));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
// app.use(fileUpload());
app.set('trust proxy', 1);

app.use(session({
    resave: true,
    saveUninitialized: false,
    secret: 'keyboard cat',
    cookie: {
        secure: false, // TODO: change to true for HTTPS!
        httpOnly: true
    }
}));

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: TEMP_FOLDER,
    defCharset: 'utf8',
    defParamCharset: 'utf8'
}));

app.use(express.json()); // long application/json

app.use(async function (req, res, next) {
    let page = req._parsedOriginalUrl.pathname;
    // console.log('Cookie:', req.headers.cookie);

    // if (page!='/data') {
    //         mlog(page,req.session.uid,req.session.name,req.session.info,req.headers['nip'],hlp.getcurip(req.socket.remoteAddress),req.query)
    //     }
    
    // //next();
    // //return 1
    // if (page=='/data') {
    //     next();
    //     //return 1
    // }

    if (req.session.uid==undefined) { 
        if (page!='/' ) {
            res.redirect("/")
        } else next();
    } else {
        if (page=='/') {
            res.redirect("/applications")
        } else next();
    } 
})

app.get('/', (req, res) => {
  res.render('authorization', {
    title: 'Authorization'
  });
});

app.post('/', async(req, res) => {
  console.log(req.body);

  // const {email, password} = req.body;
  let email = req.body.email;
  let password = req.body.password;

  if (!email) {
    return res.status(400).send("Email required");
  }
  if (!password){
    return res.status(400).send("Password required");
  }
  try{
    const user = await db.auth_user({email});
    console.log(user)

    if (!user){
      return res.status(401).send("Invalid credentials");
    }
    const isPassword = await bcrypt.compare(password, user.password);

    if (isPassword) {
      req.session.uid = user.ID;
      req.session.name = user.name;
      const roles = await db.get_roles(req.session.uid);
      req.session.roles = roles;
      mlog(req.session.roles);
      res.send('ok')
    }
    else{
      return res.status(401).send("Invalid credentails");
    }
  } catch(error){
    console.error("Ошибка аунтефикации:", error);
    res.status(500).send('Internal Server Error');
  }
})

app.post('/create', async (req, res) => {
  try {
    console.log("req.body:", req.body);

    const user_id = req.session.uid;
    const { item_name, count, price, link, desired_date, comment } = req.body;

    console.log("Вызываю createRequest с:", {user_id, item_name, count, price, link, desired_date, comment});

    const result = await db.createRequest({user_id, item_name, count, price, link, desired_date, comment});

    if (result.success) {
      return res.redirect("/applications")
    } else {
      return res.status(500).json({ success: false, message: result.message });
    }

  } catch (error) {
    console.error("Полная ошибка:", error);
    return res.status(500).send("Произошла внутренняя ошибка сервера");
  }
});
// app.get('/user', (req, res) => {
//   res.render('applications', {
//     title: 'My requests'
//   });
// });

app.get('/applications', (req, res) => {
  res.render('applications', {
    title: 'My requests'
  });
});

app.get('/manager', (req, res) => {
  res.render('all_applic', {
    title: 'Requests'
  });
});

app.get('/arch', (req, res) => {
  res.render('archive', {
    title: 'Archive'
  });
});

app.get('/base', (req, res) => {
  res.render('base', {
    title: 'Base of users'
  });
});

app.get('/create', (req, res) => {
  res.render('creating', {
    title: 'Create request'
  });
});

app.get('/edit', (req, res) => {
  res.render('editing', {
    title: 'Editing'
  });
});

app.get('/repeat', (req, res) => {
  res.render('repeat', {
    title: 'Repeat request'
  });
});

async function start() {
    try {
        app.listen(process.env.PORT, () => {
            mlog('Сервер прогресс репорта - запущен')
            mlog('Порт:', process.env.PORT);
        });
    } catch (e) {
        mlog('Ошибка запуска сервера:', e);
    }
}

await start();