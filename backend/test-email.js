require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

console.log('Testing email transporter with:', {
    user: process.env.EMAIL_USER,
    passLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0
});

transporter.verify(function (error, success) {
    if (error) {
        console.error('Email Transporter Error:', error);
        process.exit(1);
    } else {
        console.log('Email Transporter is ready to send messages');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // send to self for testing
            subject: 'Notebook Hub - Test Email',
            text: 'This is a test email from Notebook Hub to verify SMTP settings.'
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Send Mail Error:', err);
                process.exit(1);
            } else {
                console.log('Test email sent successfully:', info.response);
                process.exit(0);
            }
        });
    }
});
