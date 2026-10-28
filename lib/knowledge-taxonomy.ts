export const knowledgeDomains = [
  { id: 'lich-su-khao-co', name: 'Lịch sử và khảo cổ', description: 'Di tích, hiện vật, văn bản và dấu vết qua các thời kỳ.', topics: ['Đọc hiện vật Dốc Chùa từ hồ sơ bảo tàng', 'Văn hóa Óc Eo qua báo cáo khai quật'], priority: 'P0' },
  { id: 'phong-tuc-doi-song', name: 'Phong tục và đời sống', description: 'Nếp nhà, vòng đời và cách thực hành trong từng cộng đồng.', topics: ['Đối chiếu các bước cưới hỏi theo địa bàn', 'Tang lễ: tìm toàn văn gốc và phân biệt hệ phái'], priority: 'P0' },
  { id: 'tin-nguong-ton-giao', name: 'Tín ngưỡng và tôn giáo', description: 'Không gian thờ tự, thực hành và cách cộng đồng lý giải.', topics: ['Vai trò chùa Khmer qua từng nghiên cứu', 'Tư liệu về hội quán và sinh hoạt tôn giáo người Hoa'], priority: 'P0' },
  { id: 'phuong-ngu-nam-bo', name: 'Phương ngữ Nam Bộ', description: 'Nghĩa, ngữ cảnh, cách gọi và bản ghi có xuất xứ.', topics: ['Đối chiếu mục từ với từ điển chuyên ngành', 'Thu âm có sự đồng ý và quyền sử dụng rõ ràng'], priority: 'P0' },
  { id: 'van-hoc-nghe-thuat', name: 'Văn học và nghệ thuật dân gian', description: 'Bản ghi lời dân gian, diễn xướng và người thực hành.', topics: ['Ca dao Nhơn Ái: bản dẫn, bản sưu tầm và dị bản', 'Phân biệt văn bản tác phẩm với quyền bản diễn'], priority: 'P0' },
  { id: 'dia-danh', name: 'Địa danh và nguồn gốc tên gọi', description: 'Tên đất theo tư liệu, dị danh và những giả thuyết chưa ngã ngũ.', topics: ['Ba Láng và Phong Điền: tìm chứng cứ từ nguyên', 'Tên địa danh cũ và các lớp địa giới'], priority: 'P0' },
  { id: 'am-thuc', name: 'Ẩm thực', description: 'Món ăn, kỹ thuật chế biến, dịp sử dụng và ý nghĩa có nguồn.', topics: ['Bánh pía: món ăn và tri thức nghề', 'Mâm cơm gia đình: khảo sát theo cộng đồng và thời kỳ'], priority: 'P1' },
  { id: 'lang-nghe-sinh-ke', name: 'Làng nghề và sinh kế', description: 'Kỹ năng, vật liệu, trao truyền và cách mưu sinh.', topics: ['Nghề lạp xưởng cần hồ sơ riêng', 'Nghề dệt trong cộng đồng Chăm ở An Giang'], priority: 'P1' },
  { id: 'kien-truc-khong-gian-song', name: 'Kiến trúc và không gian sống', description: 'Nhà ở, phố chợ, công trình cộng đồng và cảnh quan.', topics: ['Nhà cổ Bình Thủy: kiến trúc và các lần biến đổi', 'Hội quán Nghĩa An: đối chiếu tên và địa chỉ theo thời kỳ'], priority: 'P1' },
  { id: 'le-hoi', name: 'Lễ hội', description: 'Lễ thức và một kỳ tổ chức được ghi nhận, có thời gian cụ thể.', topics: ['Nguyên Tiêu 2024 qua ghi nhận của đơn vị tổ chức', 'Phân biệt lịch truyền thống và thông báo sự kiện hiện hành'], priority: 'P1' },
  { id: 'nhan-vat-ky-uc', name: 'Nhân vật và ký ức lịch sử', description: 'Nhân vật, người kể, gia đình và tư liệu có xuất xứ.', topics: ['Hồ sơ người thực hành và quyền lời kể', 'Lịch sử gia đình: người kể, niên đại và tài liệu đối chiếu'], priority: 'P1' },
  { id: 'dia-ly-sinh-thai', name: 'Địa lý và sinh thái', description: 'Thủy hệ, môi trường sống và quan hệ với sinh kế.', topics: ['Đối chiếu tên sông và tọa độ qua từng nguồn', 'Sinh thái đất ngập nước Nam Bộ qua hồ sơ chuyên môn'], priority: 'P1' },
] as const;

export type DomainId = typeof knowledgeDomains[number]['id'];
export const knowledgeRegions = [
  { id: 'dong-nam-bo', name: 'Đông Nam Bộ' }, { id: 'tay-nam-bo', name: 'Tây Nam Bộ' },
  { id: 'lien-vung', name: 'Liên vùng theo tư liệu' },
] as const;
export type RegionId = typeof knowledgeRegions[number]['id'];
export const knowledgeCommunities = [
  { id: 'kinh', name: 'Kinh (Việt)' }, { id: 'khmer', name: 'Khmer' },
  { id: 'hoa', name: 'Hoa' }, { id: 'cham', name: 'Chăm' }, { id: 'khac', name: 'Cộng đồng khác' },
] as const;
export type CommunityId = typeof knowledgeCommunities[number]['id'];
export const factKindLabels = {
  documented_history: 'Tư liệu lịch sử', observed_practice: 'Thực hành được ghi nhận',
  folk_belief: 'Quan niệm dân gian', legend: 'Truyền thuyết', anecdote: 'Giai thoại',
  hypothesis: 'Giả thuyết', explanation: 'Giải thích theo nguồn',
  community_memory: 'Ký ức của người kể', editorial_note: 'Ghi chú biên tập',
} as const;
export const editorialQuestions = [
  { id: 'what', label: 'Đó là gì?' }, { id: 'when_where', label: 'Khi nào, ở đâu?' },
  { id: 'community', label: 'Gắn với cộng đồng nào?' }, { id: 'origins', label: 'Nguồn gốc và ý nghĩa?' },
  { id: 'changes', label: 'Đã thay đổi ra sao?' }, { id: 'unknowns', label: 'Điều gì chưa được xác minh?' },
  { id: 'related', label: 'Nội dung liên quan?' },
] as const;
export type QuestionId = typeof editorialQuestions[number]['id'];
export const knowledgePages = [
  { slug: 'tri-thuc', title: 'Kho tri thức Nam Bộ', description: 'Tra cứu 12 lĩnh vực, theo địa bàn tư liệu và cộng đồng.' },
  { slug: 'tu-dien', title: 'Từ điển phương ngữ', description: 'Tra nghĩa, ngữ cảnh, ví dụ và nguồn của từng mục từ.' },
  { slug: 'dong-thoi-gian', title: 'Dòng thời gian tư liệu', description: 'Những mốc có nguồn, phân biệt ghi danh, xuất bản và sự kiện được ghi nhận.' },
  { slug: 'lien-ket-tri-thuc', title: 'Bản đồ tri thức', description: 'Đi từ một hồ sơ đến các hồ sơ chung nguồn hoặc lĩnh vực.' },
  { slug: 'vi-sao-lai-the', title: 'Vì sao lại thế?', description: 'Đọc lời giải thích và điều chưa rõ từ các hồ sơ đã công bố.' },
  { slug: 'ong-ba-ke-chuyen', title: 'Ông bà kể chuyện', description: 'Lời kể cần có người kể, bối cảnh và sự đồng ý trước khi lưu hoặc công bố.' },
] as const;

export function domainById(id: string) { return knowledgeDomains.find(domain => domain.id === id); }
export function normalizeKnowledge(value: string) {
  return value.normalize('NFD').toLocaleLowerCase('vi').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
}
