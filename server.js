import express from 'express';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';

dotenv.config()


const PORT = process.env.PORT

const app = express()


app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(fileUpload())


app.get('/', (req, res) => {
    res.send('ok')
})

app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));