const {createTransport} = require("nodemailer");
const transporter = createTransport({
    host: process.env.HOST_DOMAIN,
    port: 587,
    auth: {
        user: process.env.USER,
        pass: process.env.PASS
    },
});

/**
 * @description this function using for sending mail to user 
 * @param {{to:string, subject:string, text:string, html:HTMLElement}}
 * @returns promise
 */
module.exports.sendMail = async ({to, subject, text , html})=>{
    try {
        transporter.sendMail({from:process.env.MAIL_FROM, subject, to, text , html}, (error, info)=>{
            if (error) {
                console.log(error);
            }else{
                console.log('Email sent: ' + info.response);
            }
        });
    } catch (error) {
        console.log(error);
    }
}