import nodemailer from "nodemailer"

// Email configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || "Ticketing System"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    })

    console.log("Email sent:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Email sending failed:", error)
    return { success: false, error: error.message }
  }
}

// Email templates
export const emailTemplates = {
  ticketCreated: (ticketNumber: string, title: string, assignedTo: string) => ({
    subject: `New Ticket Created: ${ticketNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Ticket Created</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2 style="color: #374151;">Ticket #${ticketNumber}</h2>
          <p style="color: #6b7280; font-size: 16px;"><strong>Title:</strong> ${title}</p>
          <p style="color: #6b7280; font-size: 16px;"><strong>Assigned to:</strong> ${assignedTo}</p>
          <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #8b5cf6;">
            <p style="margin: 0; color: #374151;">A new ticket has been created and assigned to you. Please review and take appropriate action.</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticketNumber}" 
             style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
            View Ticket
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 14px;">
          <p>© 2024 Professional Ticketing System. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  ticketUpdated: (ticketNumber: string, title: string, status: string, updatedBy: string) => ({
    subject: `Ticket Updated: ${ticketNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Ticket Updated</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2 style="color: #374151;">Ticket #${ticketNumber}</h2>
          <p style="color: #6b7280; font-size: 16px;"><strong>Title:</strong> ${title}</p>
          <p style="color: #6b7280; font-size: 16px;"><strong>Status:</strong> ${status}</p>
          <p style="color: #6b7280; font-size: 16px;"><strong>Updated by:</strong> ${updatedBy}</p>
          <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #374151;">Your ticket has been updated. Please check the latest status and comments.</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticketNumber}" 
             style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
            View Ticket
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 14px;">
          <p>© 2024 Professional Ticketing System. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  newComment: (ticketNumber: string, title: string, commentBy: string, comment: string) => ({
    subject: `New Comment on Ticket: ${ticketNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Comment</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2 style="color: #374151;">Ticket #${ticketNumber}</h2>
          <p style="color: #6b7280; font-size: 16px;"><strong>Title:</strong> ${title}</p>
          <p style="color: #6b7280; font-size: 16px;"><strong>Comment by:</strong> ${commentBy}</p>
          <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #374151; font-style: italic;">"${comment.substring(0, 200)}${comment.length > 200 ? "..." : ""}"</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticketNumber}" 
             style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
            View Ticket
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 14px;">
          <p>© 2024 Professional Ticketing System. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  userApproved: (firstName: string, lastName: string, email: string) => ({
    subject: "Account Approved - Welcome to the Team!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to the Team!</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2 style="color: #374151;">Hello ${firstName} ${lastName},</h2>
          <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #374151;">Your account has been approved! You can now access the ticketing system and start collaborating with your team.</p>
          </div>
          <p style="color: #6b7280; font-size: 16px;"><strong>Your login email:</strong> ${email}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
             style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
            Login Now
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 14px;">
          <p>© 2024 Professional Ticketing System. All rights reserved.</p>
        </div>
      </div>
    `,
  }),
}
