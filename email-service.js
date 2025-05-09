// Email Notification Service for RBAC changes
const nodemailer = require("nodemailer");

// Configure the email transporter (for development, we're using Ethereal)
async function createTransporter() {
  // For production, you would use your actual SMTP credentials
  // const transporter = nodemailer.createTransport({
  //   host: 'smtp.your-email-provider.com',
  //   port: 587,
  //   secure: false,
  //   auth: {
  //     user: process.env.EMAIL_USER,
  //     pass: process.env.EMAIL_PASSWORD
  //   }
  // });

  // For development, create a test account with Ethereal
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return { transporter, testAccount };
}

// Send email notification for user role change
async function sendRoleChangeNotification(user, oldRole, newRole) {
  try {
    const { transporter, testAccount } = await createTransporter();

    const mailOptions = {
      from: '"RBAC System" <rbac-system@example.com>',
      to: user.email,
      subject: "Your Role Has Been Updated",
      html: `
        <h1>Role Update Notification</h1>
        <p>Hello ${user.name},</p>
        <p>Your role in the Leave Approval System has been updated.</p>
        <p><strong>Previous Role:</strong> ${oldRole || "None"}</p>
        <p><strong>New Role:</strong> ${newRole}</p>
        <p>This change may affect your permissions within the system. Please contact your administrator if you have any questions.</p>
        <p>Thank you,<br>RBAC Management System</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);

    // Log the test URL for development purposes
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Send email notification for permission changes
async function sendPermissionChangeNotification(
  user,
  changedPermissions,
  action
) {
  try {
    const { transporter, testAccount } = await createTransporter();

    const mailOptions = {
      from: '"RBAC System" <rbac-system@example.com>',
      to: user.email,
      subject: "Your Permissions Have Been Updated",
      html: `
        <h1>Permission Update Notification</h1>
        <p>Hello ${user.name},</p>
        <p>Your permissions in the Leave Approval System have been updated.</p>
        <p><strong>Action:</strong> ${action}</p>
        <p><strong>Changed Permissions:</strong></p>
        <ul>
          ${changedPermissions.map((perm) => `<li>${perm}</li>`).join("")}
        </ul>
        <p>Please contact your administrator if you have any questions about these changes.</p>
        <p>Thank you,<br>RBAC Management System</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);

    // Log the test URL for development purposes
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Send email notification for new user creation
async function sendNewUserNotification(user, password) {
  try {
    const { transporter, testAccount } = await createTransporter();

    const mailOptions = {
      from: '"RBAC System" <rbac-system@example.com>',
      to: user.email,
      subject: "Welcome to Leave Approval System",
      html: `
        <h1>Welcome to the Leave Approval System</h1>
        <p>Hello ${user.name},</p>
        <p>An account has been created for you in the Leave Approval System.</p>
        <p><strong>Username:</strong> ${user.username}</p>
        <p><strong>Role:</strong> ${user.role}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
        <p>Please login and change your password immediately.</p>
        <p>Thank you,<br>RBAC Management System</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);

    // Log the test URL for development purposes
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  sendRoleChangeNotification,
  sendPermissionChangeNotification,
  sendNewUserNotification,
};
