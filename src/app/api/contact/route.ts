import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập họ và tên").max(100),
  phone: z.string().trim().min(8, "Số điện thoại không hợp lệ").max(30),
  email: z.string().trim().email("Địa chỉ email không hợp lệ").max(254),
  topic: z.string().trim().min(1, "Vui lòng chọn loại vấn đề").max(100),
  message: z.string().trim().min(10, "Nội dung cần ít nhất 10 ký tự").max(5000),
});

const recipient = "phamnhi839292@gmail.com";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !Number.isInteger(port) || !user || !password) {
    throw new Error("Email service is not configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass: password },
  });
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: { message: result.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
        },
        { status: 400 },
      );
    }

    const { name, phone, email, topic, message } = result.data;
    const transporter = getTransporter();
    const htmlMessage = escapeHtml(message).replace(/\n/g, "<br />");

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: recipient,
      replyTo: email,
      subject: `[BlueWear] ${topic} - ${name}`,
      text: [
        `Khách hàng: ${name}`,
        `Số điện thoại: ${phone}`,
        `Email: ${email}`,
        `Loại vấn đề: ${topic}`,
        "",
        "Nội dung:",
        message,
      ].join("\n"),
      html: `
        <h2>Thông tin liên hệ từ BlueWear</h2>
        <p><strong>Khách hàng:</strong> ${escapeHtml(name)}</p>
        <p><strong>Số điện thoại:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Loại vấn đề:</strong> ${escapeHtml(topic)}</p>
        <p><strong>Nội dung:</strong></p>
        <p>${htmlMessage}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send contact message", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Không thể gửi tin nhắn lúc này. Vui lòng thử lại sau." },
      },
      { status: 500 },
    );
  }
}
