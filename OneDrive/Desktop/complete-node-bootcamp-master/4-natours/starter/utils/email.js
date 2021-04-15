const nodemailer = require('nodemailer');

const sendEmail = async options => {
  //1) create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  }); //activate in gmail less secure

  //2) deifne the email options
  const mailOptions = {
    from: 'KARAN NAIDU <JUSTGUYSTUFF80085@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    //html:
  };

  await transporter.sendMail(mailOptions);

  //3) actually send the email
};

module.exports = sendEmail;