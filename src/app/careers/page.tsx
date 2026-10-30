// src/app/careers/page.tsx
export const dynamic = "force-dynamic";

export default function CareersPage() {
  const jobs = [
    {
      title: "Nhân viên Tư vấn Thời trang & Chăm sóc khách hàng",
      location: "TP. Hồ Chí Minh",
      type: "Full-time / Part-time",
      description: "Tư vấn phong cách thời trang, hỗ trợ giải đáp thắc mắc và xử lý đơn hàng cho khách hàng qua các kênh trực tuyến.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#164F8D] mb-3">Tuyển dụng tại BlueWear</h1>
        <p className="text-gray-600 text-sm">
          Gia nhập đội ngũ trẻ trung, năng động và cùng chúng tôi lan tỏa phong cách thời trang hiện đại.
        </p>
      </div>

      <div className="space-y-6">
        {jobs.map((job, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {job.title}
            </h3>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500 mb-4">
              <span>{job.location}</span>
              <span>{job.type}</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              {job.description}
            </p>
            <a
              href="/contact"
              className="inline-block px-4 py-2 bg-[#17579B] text-white text-xs font-semibold rounded-lg hover:bg-[#124378] transition-colors"
            >
              Ứng tuyển ngay
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}