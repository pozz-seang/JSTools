const { createClient } = require("@supabase/supabase-js")
require('dotenv').config();

const DB_Url = process.env.DB_Url
const DB_Token = process.env.DB_Token
const DB_User = process.env.DB_User
const DB_PaymentMethod = process.env.DB_PaymentMethod
const DB = createClient(DB_Url, DB_Token)




module.exports = {
    DB_Url,
    DB_Token,
    DB_User,
    DB_PaymentMethod,
    DB
}