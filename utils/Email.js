const { createTransport } = require("nodemailer")

const Email = (username, url) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Password Reset</title>
        <style>
            * {
                margin: 0;
                padding: 0;
            }

            body {
                width: 100%;
                background-color: #112E42;
            }
            .bd{
                width: 100%;
                background-color: #112E42;
            }
            .logo {
                width: 100%;
                text-align: center;
                color: #EDEDED;
                padding-top: 30px;
                padding-bottom: 30px;
            }

            .logo span {
                color: #00ABF0;
            }

            .copyrights {
                width: 100%;
                text-align: center;
                color: #C5C5C5;
                padding-top: 30px;
                padding-bottom: 30px;
            }

            .con {
                max-width: 500px;
                width: 80%;
                border-radius: 10px;
                border: 1px solid #00ABF0;
                margin: auto;
                padding: 20px;
                color: #EDEDED;
            }


        </style>
    </head>

    <body>
        <div class="bd">
            <h1 class="logo">JS<span>Tools</span></h1>
            <div class="con">
                <h3>Hello ${username}</h3>
                <br>
                <p>We received a request to reset your password for your JSTools account. If you did not make this request,
                    please ignore this email.</p>
                <br>
                <p>To reset your password, please click on the following link:<br><a style="color: #00ABF0" href=${url}>${url}</a></p>
                <br>
                <p>
                    If the above link doesn't work, copy and paste the URL into your browser's address bar. 
                    <br><br>
                    Please note that this link is valid for 60min.
                </p>
                
                <br>
                <p>If you have any questions or need further assistance, please contact our support team at
                    <a style="color: #00ABF0" href = "mailto:admin@JSTools.co">admin@JSTools.co</a>
                </p>
                <br>
            
                <p>Regards,<br>
                    JSTools team</p>
                    
            </div>
            <h5 class="copyrights">© 2023 JSTools.<br>All rights reserved.</h5>
        </div>
    </body>

    </html>
    
    `

}

const sendEmail = async (email, username, urlResetPassword) => {
    const systemEmail = "noreply@jstools.co"
    const password = "Sk14062003"
    const error = false
    try {
        createTransport({
            host: "mail.privateemail.com",
            port: 465,
            secure: true,
            auth: {
                user: systemEmail,
                pass: password,
            },
        }).sendMail({
            from: `JSTools <${systemEmail}>`,
            to: email,
            subject: 'Password Reset Request',
            name: "updates",
            html: Email(username, urlResetPassword)
        });
    } catch (error) {
        error = true
    }
    return error
}

module.exports = { sendEmail }