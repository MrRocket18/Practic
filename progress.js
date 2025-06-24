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

app.get('/auth', (req, res) => {
  res.render('authorization', {
    title: 'Authorization'
  });
});

app.get('/user', (req, res) => {
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