require('dotenv').config();
const express = require('express')
const app = express()
const path = require('path')
const createError = require('http-errors')
const jwt = require('jsonwebtoken')
const { pool } = require('./modules/mysql-conn')
const { v4 } = require('uuid')
const dns = require('dns')
const cors = require('cors')


/************* Init ***************/
app.listen(process.env.PORT, () => { 
	console.log(process.env.HOST+':'+process.env.PORT) 
})
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, './views'))
app.locals.pretty = true


/************* Middleware ***************/
app.use(cors())
app.use(express.json())	// post -> req.body
app.use(express.urlencoded({ extended: false }))



/************* Router ***************/
app.get('/', (req, res, next) => {
	res.render('index')
})

app.get('/send', (req, res, next) => {
	res.render('send')
})

app.post('/create', async (req, res, next) => {
	try {
		let sql, connect, values, appkey
		let { domain, userid } = req.body
		sql = 'SELECT * FROM api WHERE domain=? AND userid=?'
		values = [domain, userid]
		connect = await pool.getConnection()
		let [rs] = await connect.query(sql, values)
		connect.release()
		if(rs[0]) {
			res.json(rs[0])
		}
		else {
			sql = 'INSERT INTO api SET domain=?, userid=?, appkey=?'
			values = [domain, userid, v4()]
			connect = await pool.getConnection()
			let [rs2] = await connect.query(sql, values)
			connect.release()
			sql = 'SELECT * FROM api WHERE domain=? AND userid=?'
			connect = await pool.getConnection()
			let [rs3] = await connect.query(sql, values)
			connect.release()
			res.json(rs3[0])
		}
	}
	catch(err) {
		next(err)
	}
})


app.post('/sign', async (req, res, next) => {
	try {
		let sql, values, connect, token
		let { userid, appkey } = req.body
		sql = 'SELECT * FROM api WHERE userid=? AND domain=? AND appkey=?'
		values = [userid, req.headers.origin, appkey]
		connect = await pool.getConnection()
		let [rs] = await connect.query(sql, values)
		connect.release()
		if(rs[0]) {
			token = jwt.sign({ id: userid }, process.env.JWT_KEY, { expiresIn: '10m' })
			res.json({
				code: 200,
				message: '토큰이 발행되었습니다.',
				token
			})
		}
		else {
			return res.status(401).json({
				code: 401,
				msg: '요청하신 정보를 찾을 수 없습니다.'
			})
		}
	}
	catch(err) {
		next(err)
	}
})

app.get('/data', (req, res, next) => {
	let token = req.headers.authorization
	let verify = jwt.verify(token, process.env.JWT_KEY)
	if(verify) {
		res.status(200).json({ code: 200, result: '응답' })
	}
	else {
		res.status(401).json({ code: 401, msg: 'Token 불일치' })
	}
})

/************* Router ***************/
app.use((req, res, next) => {
	next(createError(404))
})

app.use((err, req, res, next) => {
	res.send(process.env.SERVICE == 'development' ? err : '에러')
})