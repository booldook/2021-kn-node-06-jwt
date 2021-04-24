require('dotenv').config();
const express = require('express')
const app = express()
const path = require('path')
const createError = require('http-errors')


/************* Init ***************/
app.listen(process.env.PORT, () => { 
	console.log(process.env.HOST+':'+process.env.PORT) 
})
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, './views'))
app.locals.pretty = true



/************* Middleware ***************/
app.use(express.json())	// post -> req.body
app.use(express.urlencoded({ extended: false }))

/************* Router ***************/
app.use('/', express.static(path.join(__dirname, '/public')))



/************* Router ***************/
app.use((req, res, next) => {
	next(createError(404))
})

app.use((err, req, res, next) => {
	res.send(process.env.SERVICE == 'development' ? err : '에러')
})