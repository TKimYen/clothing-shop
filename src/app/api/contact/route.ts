
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập họ và tên").max(100),
  phone: z.string().trim().min(8, "Số điện thoại không hợp lệ").max(30),
  email: z.string().trim().email("Địa chỉ email không hợp lệ").max(254),
  topic: z.string().trim().min(1, "Vui lòng chọn loại vấn đề").max(100),
  message: z.string().trim().min(10, "Nội dung cần ít nhất 10 ký tự").max(5000),
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) =>
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
          error: {
            message:
              result.error.issues[0]?.message ??
              "Dữ liệu không hợp lệ",
          },
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const recipient = process.env.CONTACT_EMAIL;
    
    if (!apiKey || !recipient) {
      console.error("Missing Resend configuration");
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Dịch vụ email chưa được cấu hình.",
          },
        },
        { status: 500 },
      );
    }

    const resend = new Resend(apiKey);
    const { name, phone, email, topic, message } = result.data;

    const htmlMessage = escapeHtml(message).replace(/\n/g, "<br />");

    const { data, error } = await resend.emails.send({
      from: "BlueWear Contact <onboarding@resend.dev>",
      to: [recipient],
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

    if (error) {
      console.error("Resend email error:", {
        name: error.name,
        message: error.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Không thể gửi tin nhắn lúc này. Vui lòng thử lại sau.",
          },
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
    });
  } catch (error) {
    console.error("Failed to send contact message:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Không thể gửi tin nhắn lúc này. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
