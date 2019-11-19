const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth:{
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    }
    // host: "smtp.mailtrap.io",
    // port: 2525,
    // auth: {
    //     user: "42246ef7214a6c",
    //     pass: "136ed69ea857f8"
    // }
    
});

const makeEmail = text => `
    <div className="email" style="
        border: 1px solid black;
        padding: 20px;
        font-family: sans-seriff;
        line-height: 2;
        font-size: 20px
    ">
    <h2>Hello There!</h2>
    <p>${text}</p>
    </div>
`;



exports.transport = transport;
exports.makeEmail = makeEmail;
