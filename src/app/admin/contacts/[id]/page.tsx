// src/app/admin/contacts/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/db";
import { Badge, Button, Card, CardBody } from "@/src/components/ui";
import { PageHeader } from "@/src/components/admin/layout";
import { formatDateTime } from "@/src/lib/utils";
import Link from "next/link";
import { Mail, Phone, Clock, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
  });

  if (!contact) {
    notFound();
  }

  if (!contact.isRead) {
    await prisma.contact.update({
      where: { id },
      data: { isRead: true },
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Commerce"
        title={`Chi tiết tin nhắn: ${contact.topic}`}
        description="Xem toàn bộ nội dung phản hồi và thông tin liên hệ từ khách hàng."
        back={{ label: "Quay lại danh sách", href: "/admin/contacts" }}
      />

      <div className="grid gap-6">
        <Card>
          <CardBody className="space-y-6 p-6 sm:p-8">
            {/* Thông tin trạng thái và thời gian */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted">Trạng thái:</span>
                <Badge tone="neutral">Đã đọc</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Clock className="size-4" />
                <span>Thời gian gửi: {formatDateTime(contact.createdAt.toISOString())}</span>
              </div>
            </div>

            {/* Thông tin khách hàng */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-canvas-soft p-4 rounded-xl border border-line">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
                  <User className="size-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] text-muted uppercase font-semibold">Khách hàng</span>
                  <span className="text-sm font-bold text-ink truncate block">{contact.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
                  <Phone className="size-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] text-muted uppercase font-semibold">Số điện thoại</span>
                  <span className="text-sm font-mono font-medium text-ink truncate block">{contact.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
                  <Mail className="size-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] text-muted uppercase font-semibold">Email</span>
                  <span className="text-sm font-mono font-medium text-ink truncate block">{contact.email}</span>
                </div>
              </div>
            </div>

            {/* Chủ đề và Nội dung */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Chủ đề yêu cầu</h4>
              <p className="text-base font-semibold text-ink bg-white border border-line p-3 rounded-xl">
                {contact.topic}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Nội dung chi tiết</h4>
              <div className="rounded-xl border border-line bg-white p-4 text-sm text-ink whitespace-pre-wrap leading-relaxed min-h-[150px]">
                {contact.message}
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <Link href="/admin/contacts">
                <Button variant="secondary">Quay lại danh sách</Button>
              </Link>
              <a href={`mailto:${contact.email}?subject=Re: [BlueWear] Phản hồi yêu cầu - ${contact.topic}`}>
                <Button>Gửi email phản hồi</Button>
              </a>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}