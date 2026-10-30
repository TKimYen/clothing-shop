// src/app/admin/contacts/page.tsx
import * as React from "react";
import Link from "next/link";
import { Badge, Card, CardBody, Table, TableWrap, TBody, TD, TH, THead, TR, Button } from "@/src/components/ui";
import { PageHeader } from "@/src/components/admin/layout";
import { prisma } from "@/src/lib/db";
import { formatDateTime } from "@/src/lib/utils";
import { Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        eyebrow="Commerce"
        title="Tin nhắn liên hệ"
        description="Danh sách các tin nhắn phản hồi và hỗ trợ từ khách hàng."
      />

      <Card>
        {contacts.length === 0 ? (
          <CardBody>
            <p className="py-8 text-center text-sm text-muted">Chưa có tin nhắn liên hệ nào.</p>
          </CardBody>
        ) : (
          <TableWrap>
            <Table className="min-w-2xl">
              <THead>
                <tr>
                  <TH scope="col">Khách hàng</TH>
                  <TH scope="col">Chủ đề</TH>
                  <TH scope="col">Nội dung tóm tắt</TH>
                  <TH scope="col">Ngày gửi</TH>
                  <TH scope="col">Trạng thái</TH>
                  <TH scope="col" className="text-right">Thao tác</TH>
                </tr>
              </THead>
              <TBody>
                {contacts.map((contact) => (
                  <TR key={contact.id}>
                    <TD>
                      <span className="block text-sm font-semibold text-ink">{contact.name}</span>
                      <span className="block font-mono text-[11px] text-muted">{contact.email}</span>
                      <span className="block text-[11px] text-muted">{contact.phone}</span>
                    </TD>
                    <TD>
                      <span className="text-sm font-medium">{contact.topic}</span>
                    </TD>
                    <TD>
                      <span className="block max-w-xs truncate text-sm text-muted">{contact.message}</span>
                    </TD>
                    <TD>
                      <span className="whitespace-nowrap text-xs text-muted">
                        {formatDateTime(contact.createdAt.toISOString())}
                      </span>
                    </TD>
                    <TD>
                      {contact.isRead ? (
                        <Badge tone="neutral">Đã đọc</Badge>
                      ) : (
                        <Badge tone="info">Mới</Badge>
                      )}
                    </TD>
                    <TD className="text-right">
                      <Link href={`/admin/contacts/${contact.id}`}>
                        <Button size="sm" variant="secondary" className="gap-1.5">
                          <Eye className="size-3.5" />
                          Xem
                        </Button>
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        )}
      </Card>
    </>
  );
}