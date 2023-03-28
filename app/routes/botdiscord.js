const express = require('express')
const router = express.Router()
const { activeRol } = require('../controllers/botdiscord')

router.post('/active-rol', activeRol)

module.exports = router