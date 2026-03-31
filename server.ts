import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/contact", async (req, res) => {
    const { name, email, subject, message, toEmail } = req.body;

    if (!name || !email || !subject || !message || !toEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // In a real production app, you would use a service like Resend, SendGrid, or a real SMTP server.
      // For this demo, we'll use Ethereal Email (a fake SMTP service) to simulate sending an email.
      // Or you can configure it with your own SMTP credentials via environment variables.
      
      let transporter;
      
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        // Fallback to Ethereal for testing if no SMTP config is provided
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }

      const info = await transporter.sendMail({
        from: `"${name}" <${email}>`, // sender address
        to: toEmail, // list of receivers
        subject: `Portfolio Contact: ${subject}`, // Subject line
        text: `You have received a new message from your portfolio.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`, // plain text body
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
            <h2>New Contact Message</h2>
            <p>You have received a new message from your portfolio contact form.</p>
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-top: 16px;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        `, // html body
      });

      console.log("Message sent: %s", info.messageId);
      
      // If using Ethereal, log the preview URL
      if (!process.env.SMTP_HOST) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      }

      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
