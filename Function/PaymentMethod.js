const { default: axios } = require("axios");
const { BakongKHQR, khqrData, IndividualInfo } = require("bakong-khqr");
const { addDate } = require("./Date");
const QRCode = require('qrcode');
const { GetUser } = require("./GetUser");
const { DB, DB_PaymentMethod, DB_User } = require("../core/Database");
require('dotenv').config();


const headers = {
    headers: {
        'Authorization': `Bearer ${process.env.Token_PaymentMethod}`,
        'Content-Type': 'application/json'
    }
}

const dataChecking = []

const GeneratePaymentMethod = async (req, res) => {
    const { plan, months } = req.body
    var price = 0
    if (plan == "starter") price = 2 * months
    else if (plan == "premium") price = 3 * months
    else if (plan == "business") price = 5 * months
    // price -= 0.01

    const optionalData = {
        currency: khqrData.currency.usd,
        amount: price,
        billNumber: plan,
        mobileNumber: "855962799923",
        storeLabel: "JSTools",
        terminalLabel: plan,
    };

    const individualInfo = new IndividualInfo(
        "long_jingseang@wing",
        "JSTools",
        "Phnom Penh",
        optionalData
    )

    const khqr = new BakongKHQR()
    const response = khqr.generateIndividual(individualInfo)

    const data = {
        userid: req.user.id,
        months,
        plan,
        qr: response.data.qr,
        md5: response.data.md5,
    }

    const insert = await DB.from(DB_PaymentMethod).insert([data])
    if (insert.error) return
    const resForUser = {
        price,
        qr: "",
        md5: data.md5
    }
    QRCode.toFile(`./public/qrpayment/${data.userid}.png`, data.qr, {
        errorCorrectionLevel: 'H',
        quality: 0.3,
        margin: 0,
    }, function (err) {
        if (err) throw err;
        resForUser.qr = `qrpayment/${data.userid}.png`
        return res.json(resForUser)
    });
}

const CheckUser = async (req, res, md5) => {
    const data = {
        md5
    }
    axios.post("https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5", data, headers).then(async (result) => {
        if (result.data.responseCode == 0) {
            if (result.data) {
                const findByMd5 = await DB.from(DB_PaymentMethod).select("*").eq("md5", md5)
                if (findByMd5.error) return
                const userId = await findByMd5.data[0].userid
                const plan = await findByMd5.data[0].plan
                const expired = addDate("m", await findByMd5.data[0].months)
                const upload = await DB.from(DB_User).update({ plan, expired }).eq('id', userId)
                if (!upload.error) {
                    await DB.from('PaymentMethod').delete().eq('id', await findByMd5.data[0].id)
                    GetUser(req, res)
                }
            }
        } else {
            setTimeout(() => {
                CheckUser(req, res, md5)
            }, 5000)
        }
    }).catch((e) => {
        console.log("Error: ", e);
    })
}

const CheckAllUserPayment = async () => {
    const insert = await DB.from(DB_PaymentMethod).select("*")
    if (insert.error) return
    var MD5List = []
    for (let i = 0; i < insert.data.length; i++) {
        MD5List = [...MD5List, insert.data[i].md5]
    }
    const data = MD5List
    if (data.length == 0) return
    axios.post("https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5_list", data, headers).then((result) => {
        // console.log(result.data);
        UserPayment(result.data.data)
    }).catch((e) => {
        console.log("Error: ", e);
    })
}

const UserPayment = async (ListCheckMD5) => {
    for (let i = 0; i < ListCheckMD5.length; i++) {
        if (ListCheckMD5[i].status == "SUCCESS") {
            const findByMd5 = await DB.from(DB_PaymentMethod).select("*").eq("md5", ListCheckMD5[i].md5)
            if (!findByMd5.error) {
                const userId = findByMd5.data[0].userid
                const plan = findByMd5.data[0].plan
                const expired = addDate("m", findByMd5.data[0].months)
                const upload = await DB.from(DB_User).update({ plan, expired }).eq('id', userId)
                if (!upload.error) {
                    await DB.from('PaymentMethod').delete().eq('id', findByMd5.data[0].id)
                }
            }
        }
    }
}

module.exports = {
    GeneratePaymentMethod,
    CheckAllUserPayment,
    CheckUser
}