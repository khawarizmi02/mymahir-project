const express = require('express')

const app = express()

const PORT = process.env.PORT | 3000

app.get("/", (_, res) => {
	res.send("Hello")
})

app.listen(PORT, () => console.log(`Server run in http://localhost:${PORT}`))