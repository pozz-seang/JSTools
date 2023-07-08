const express = require("express");
const cors = require("cors");
const firebase = require('firebase/app')
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage");
var path = require('path');
const { default: axios } = require("axios");
const { adcreatives, effective_object_story_id, publishPost } = require("./Function/PostPE");
const { Random } = require("./Function/random");
const { getThumbnails, sendEmail } = require("./Function/Functions");
const { videosStorage, peImagesStorage } = require("./Function/Storage");
const { FbApiFull } = require("./Function/FacebookApi");
const { DB_User, DB, DB_PaymentMethod } = require("./Function/Database");
const { hash, compare } = require("bcrypt");
const { JWTVerify, JWTSign } = require("./Function/JWT");
const { addDate, checkExpired, GetDate } = require("./Function/Date");
const { GetUser } = require("./Function/GetUser");
const QRCode = require('qrcode');

const { GeneratePaymentMethod, CheckAllUserPayment, CheckUser } = require("./Function/PaymentMethod");
const { firebaseConfig } = require("./core/firebase");
const { DownloadVideos } = require("./Function/DownloadVideo");
const { getCTAOption, addCTAOption, removeCTAOption } = require("./Function/CTAOptions");



const PEImagePath = "PEImage/"

const app = express();

app.listen(process.env.PORT || 80, () => console.log("Server is running...!"));
app.use(cors({
    origin: [
        "https://jstool.netlify.app",
        "http://192.168.1.11:3000"
    ],
    credentials: true,
}));

app.use(express.json());
app.use(express.static(path.resolve('./public')));



app.get("/", (req, res) => {
    res.send("This is a Server...");
});


app.post('/requestpayment', JWTVerify, async (req, res) => {
    const findMd5ByID = await DB.from(DB_PaymentMethod).select("*").eq("userid", req.user.id)
    if (findMd5ByID.data[0]) {
        console.log(findMd5ByID.data[0]);
        const { plan, months, userid, qr, md5 } = findMd5ByID.data[0]
        var price = 0
        if (plan == "monthly_starter") price = 2 * months
        else if (plan == "monthly_premium") price = 3 * months
        else if (plan == "monthly_business") price = 5 * months
        price -= 0.01

        const resForUser = {
            price,
            qr: "",
            md5
        }
        QRCode.toFile(`./public/qrpayment/${userid}.png`, qr, {
            errorCorrectionLevel: 'H',
            quality: 0.3,
            margin: 0,
        }, function (err) {
            if (err) throw err;
            resForUser.qr = `qrpayment/${userid}.png`
            return res.json(resForUser)
        });
    } else {
        GeneratePaymentMethod(req, res)
    }

})

//ot brer
app.post('/CheckAllUserPayment', JWTVerify, (req, res) => {
    // CheckAllUserPayment()
    GetUser(req, res)
})

app.post('/CheckUser', JWTVerify, (req, res) => {
    try {
        CheckUser(req, res, req.body.md5)
        setTimeout(() => {
            GetUser(req, res)
        }, 200000);
    } catch (e) {
        GetUser(req, res)
    }
})


app.post('/login', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.json({ error: "Email and Password are required." })
    DB.from(DB_User).select(`id, email, password`).eq("email", req.body.email)
        .then((result) => {
            const { data, error } = result
            if (error) return res.json({ error: "Login Error" })
            if (!data[0]) return res.json({ error: "Your email is invalid!" })
            compare(password, data[0].password, (err, result) => {
                if (err) return res.json({ error: "Login Error" })
                if (!result) return res.json({ error: "Your password is invalid!" })
                const dataAccessToken = {
                    id: data[0].id,
                    email: data[0].email
                }
                const access_token = JWTSign(dataAccessToken)
                try {
                    res.json({ access_token })
                } catch (e) {
                    console.log(e);
                    res.json({ error: "Login Error" })
                }
            })
        })
        .catch((e) => {
            res.json({ error: "Login Error" })
        })

})

app.post('/register', async (req, res) => {
    const { username, email, password, cpassword } = req.body
    if (!username || !email || !password || !cpassword) return res.json({ msg: "required a value" })
    try {
        const DBUsername = await DB.from(DB_User).select(`username`).eq("username", username)
        if (DBUsername.error) return res.json({ error: "Register Error" })
        if (DBUsername.data[0]) return res.json({ error: "This username is already taken" })
        const DBEmail = await DB.from(DB_User).select(`email`).eq("email", email)
        if (DBEmail.error) return res.json({ error: "Register Error" })
        if (DBEmail.data[0]) return res.json({ error: "This email is already taken" })

        const data = {
            username: username,
            email: email,
            password: '',
            expired: addDate("d", 1),
            facebook: [],
            pe_image: [],
            cta_option: []
        }
        data.password = await hash(password, 10)
        const createUser = await DB.from(DB_User).insert([data])
        if (createUser.error) return res.json({ error: "Register Error" })
        DB.from(DB_User).select(`id, email, password`).eq("email", email)
            .then((result) => {
                const { data, error } = result
                if (error) return res.json({ error: "Register Error" })
                console.log(data);
                const dataAccessToken = {
                    id: data[0].id,
                    email: data[0].email
                }
                const access_token = JWTSign(dataAccessToken)
                res.json({ access_token })

            })
            .catch((e) => {
                res.json({ error: "Register Error" })
            })
    } catch (e) {
        console.log("Register Error", e);
        res.json({ error: "Register Error" })
    }
})

app.post('/checkdate', JWTVerify, async (req, res) => {
    const { email } = req.user
    try {
        if (email) {
            const { data, error } = await DB.from(DB_User).select(`id, email, expired`).eq('email', email)
            if (error) return res.json({ error: "Check Error" })
            data[0].expiredStatus = !checkExpired(data[0].expired)
            res.json(data[0])
        } else {
            console.log("Check Error");
            res.json({ error: "Check Error" })
        }
    } catch (e) {
        console.log("Check Error", e);
        res.json({ error: "Check Error" })
    }
})

//ot ton brer
app.post('/forgot_password', async (req, res) => {
    try {
        const { email } = req.body
        const DBEmail = await DB.from(DB_User).select(`email`).eq("email", email)
        if (DBEmail.error) return res.json({ error: "Rest Password Error" })
        if (DBEmail.data[0]) {
            sendEmail(req.body.email)
            res.json({})
        } else {
            return res.json({ error: "This Email doesn't have a user!" })
        }
    } catch (e) {
        return res.json({ error: "Rest Password Error" })
    }

})


app.post("/getUser", JWTVerify, async (req, res) => {
    GetUser(req, res)
});

app.post('/getFacebookUser', JWTVerify, async (req, res) => {
    const { email } = req.user
    try {
        if (email) {
            const { data, error } = await DB.from(DB_User).select(`facebook`).eq('email', email)
            if (error) return res.json({ error: "Getting Error" })
            res.json(data[0])
        } else {
            console.log("Getting Error");
            res.json({ error: "Getting Error" })
        }
    } catch (e) {
        console.log("Getting Error", e);
        res.json({ error: "Getting Error" })
    }
})


app.post('/checkfacebooktoken', (req, res) => {
    console.log(req.body);
    const data = {
        access_token: req.body.access_token,
        fields: "id,name",
    }
    axios.get(FbApiFull + "me", { params: data }).then((result) => {
        res.json(result.data)
    }).catch((e) => {
        res.json({ errorCode: 1 })
        console.log(e);
    })

})


app.post('/addaccountfacebook', JWTVerify, async (req, res) => {
    const { email } = req.user
    const facebook = await DB.from(DB_User).select(`facebook`).eq("email", email)
    if (facebook.error) return res.json({ error: "error add facebook" })
    var facebookAcc = facebook.data[0].facebook
    var newdatafacebook = [req.body.fb, ...facebookAcc]
    const update = await DB.from(DB_User).update({ facebook: newdatafacebook }).eq("email", email)
    if (update.error) return res.json({ error: "error remove facebook" })
    GetUser(req, res)
})

app.post('/removeaccountfacebook', JWTVerify, async (req, res) => {
    const { email } = req.user
    const { key } = req.body
    const facebook = await DB.from(DB_User).select(`facebook`).eq("email", email)
    if (facebook.error) return res.json({ error: "error remove facebook" })
    var facebookAcc = facebook.data[0].facebook
    var newdatafacebook = facebookAcc.filter((value, index, arr) => { return key != index; });
    const update = await DB.from(DB_User).update({ facebook: newdatafacebook }).eq("email", email)
    if (update.error) return res.json({ error: "error remove facebook" })
    GetUser(req, res)
})



//upload pe image to firease store
firebase.initializeApp(firebaseConfig)
const storage = getStorage()

app.post('/upload_pe_images', peImagesStorage.single('file'), JWTVerify, async (req, res) => {
    const { email } = req.user
    const oldPeImages = await DB.from(DB_User).select(`id, email, pe_image`).eq("email", email)
    if (oldPeImages.error) return console.log("error get old pe image");
    var peImages = oldPeImages.data[0].pe_image

    const fileExtension = "." + req.file.originalname.split('.').filter(Boolean).slice(1).join('.')
    const userID = oldPeImages.data[0].id
    const filename = `${PEImagePath}${userID}_${GetDate()}_${Random(20)}${fileExtension}`
    const storageRef = ref(storage, filename)
    uploadBytes(storageRef, req.file.buffer)
        .then((snapshot) => {
            getDownloadURL(storageRef)
                .then(async (url) => {
                    const dataPE = {
                        filename: snapshot.metadata.name,
                        uri: url
                    }
                    const upload = await DB.from(DB_User).update({ pe_image: [dataPE, ...peImages] }).eq("email", email)
                    if (upload.error) return console.log("error upload pe image");

                    const newPeImages = await DB.from(DB_User).select(`id, email, pe_image`).eq("email", email)
                    if (newPeImages.error) return console.log("error get old pe image");
                    res.json(newPeImages.data[0].pe_image)
                })
                .catch((e) => {
                    res.json(e)
                })
        })
        .catch((e) => {
            console.log(e);
            res.json(e)
        })
})
app.post('/delete_pe_images', JWTVerify, async (req, res) => {
    const { email } = req.user
    const { name } = req.body
    const pe_image = await DB.from(DB_User).select(`pe_image`).eq("email", email)
    if (pe_image.error) return res.json({ error: "error remove PE Image" })
    var pe_images = pe_image.data[0].pe_image
    var newdatape_image = pe_images.filter((value, index, arr) => { return name != value.filename; });
    const update = await DB.from(DB_User).update({ pe_image: newdatape_image }).eq("email", email)
    if (update.error) return res.json({ error: "error remove PE Image" })
    GetUser(req, res)
    const pathFile = `${PEImagePath}${name}`
    const storageRef = ref(storage, pathFile)
    deleteObject(storageRef).then(() => { }).catch((e) => { })
})

app.post('/upload', videosStorage.single('file'), (req, res) => {
    res.json({ message: 'Successfully', url: "uploads/" + req.file.filename, code: 200 });
});

//min ton brer
app.post('/SVTFacebook', (req, res) => {
    axios.post(FbApiFull + adAccount + "/advideos")
    // res.json({ message: 'Successfully', url: "uploads/" + req.file.filename, code: 200 });
});


app.get('/getThumbnails', (req, res) => {
    getThumbnails(req, res)
})

//About PostPE
app.post('/adcreatives', (req, res) => {
    adcreatives(req, res)
})
app.get('/EOSID', (req, res) => {
    effective_object_story_id(req, res)
})
app.post('/publishPost', (req, res) => {
    publishPost(req, res)
})


//get download videos

app.get('/downloadVideo', (req, res) => {
    if (req.query.url) {
        DownloadVideos(res, req.query.url)
    } else {
        const data = {
            msg: "No one",
            status: false
        }
        res.json(data);
    }

})


app.post('/getCTAOption', JWTVerify, async (req, res) => {
    getCTAOption(req, res)
})

app.post('/addCTAOption', JWTVerify, async (req, res) => {
    addCTAOption(req, res)
})

app.post('/removeCTAOption', JWTVerify, async (req, res) => {
    removeCTAOption(req, res)
})


app.post('/getAllUserAdmin', JWTVerify, async (req, res) => {
    const { email } = req.user
    try {
        if (email) {
            const { data, error } = await DB.from(DB_User).select(`role`).eq('email', email)
            if (error) return res.json({ error: "Getting Error" })
            if (data[0].role != "admin") return res.json({ msg: "Your Role is not Admin" })
            const getDataUser = await DB.from(DB_User).select(`id, username, email, expired, plan, role, created_at`).order('id')
            if (getDataUser.error) return res.json({ error: "Getting Error" })
            res.json(getDataUser.data)
        } else {
            console.log("Getting Error");
            res.json({ error: "Getting Error" })
        }
    } catch (e) {
        console.log("Getting Error", e);
        res.json({ error: "Getting Error" })
    }
})