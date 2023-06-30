const { createClient } = require("@supabase/supabase-js")

const DB_Url = "https://rhhpxyxpmlsggnqkhfup.supabase.co"
const DB_Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoaHB4eXhwbWxzZ2ducWtoZnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY0OTAxNjEsImV4cCI6MjAwMjA2NjE2MX0._lFct_DDnkB_UnjEb6Do0WY_0t6AYLGnuzQNA6ePRBI"
const DB_User = "UserData"
const DB_PaymentMethod = "PaymentMethod"
const DB = createClient(DB_Url, DB_Token)




module.exports = {
    DB_Url,
    DB_Token,
    DB_User,
    DB_PaymentMethod,
    DB
}