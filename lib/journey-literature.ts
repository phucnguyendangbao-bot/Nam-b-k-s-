/** Trích nguyên tác cổ; chú giải điển tích do ban biên soạn viết, không dùng làm chứng cứ địa phương. */
export type LiteraryPassage = {
  id: string; kind: 'verse' | 'allusion'; text: string; author: string; work: string;
  sourceUrl: string; locator: string; version: string; context: string; checkedAt: string;
  rights: 'public_domain_original';
};
const kieu = 'https://vi.wikisource.org/w/index.php?title=Truyện_Kiều&oldid=205132';
export const journeyLiterature: Record<string, LiteraryPassage> = {
  'song-lap': {
    id: 'song-lap', kind: 'verse', text: 'Vẳng nghe tiếng ếch bên tai,\nGiật mình còn tưởng tiếng ai gọi đò.',
    author: 'Trần Tế Xương', work: 'Sông Lấp',
    sourceUrl: 'https://vi.wikisource.org/wiki/Sông_Lấp', locator: 'Hai câu cuối', version: 'Bản chép Wikisource, đối chiếu văn bản và chú thích ngày 02/11/2026.',
    context: 'Tiếng gọi đò trong bài thơ gắn với ký ức sông Vị Hoàng ở Nam Định. Đặt ở đầu chuyến như một tiếng vọng văn chương về bến cũ; địa danh của nguyên tác được giữ riêng với các bến sông Nam Bộ.',
    checkedAt: '2026-11-02', rights: 'public_domain_original',
  },
  'loi-xua': {
    id: 'loi-xua', kind: 'verse', text: 'Lối xưa xe ngựa hồn thu thảo,\nNền cũ lâu đài bóng tịch dương.',
    author: 'Bà Huyện Thanh Quan', work: 'Thăng Long thành hoài cổ',
    sourceUrl: 'https://vi.wikisource.org/w/index.php?title=Thăng_Long_thành_hoài_cổ&oldid=18342', locator: 'Câu 3–4', version: 'Wikisource oldid 18342; dùng chữ “Lối” theo bản này, đối chiếu ngày 02/11/2026.',
    context: 'Hai câu thơ hoài cổ về Thăng Long được mượn làm đề từ cho mạch đọc dấu vết. Cảnh lâu đài, xe ngựa thuộc nguyên tác; phần tư liệu bên dưới trình bày riêng các địa điểm của hành trình.',
    checkedAt: '2026-11-02', rights: 'public_domain_original',
  },
  'ban-den-nha': {
    id: 'ban-den-nha', kind: 'verse', text: 'Bác đến chơi đây, ta với ta!',
    author: 'Nguyễn Khuyến', work: 'Bạn đến chơi nhà',
    sourceUrl: 'https://vi.wikisource.org/w/index.php?title=Bạn_đến_chơi_nhà&oldid=206536', locator: 'Câu cuối; chuẩn hóa khoảng trắng trước dấu chấm than', version: 'Wikisource oldid 206536, đối chiếu ngày 02/11/2026; chỉ trích câu cuối, không chọn biến thể câu mở đầu.',
    context: 'Lời thơ về tình bạn và cuộc thăm nhà, dùng để mở mạch hiếu khách. Đây là câu của Nguyễn Khuyến, không phải lời của gia chủ các ngôi nhà trong tour.',
    checkedAt: '2026-11-02', rights: 'public_domain_original',
  },
  'loi-que': {
    id: 'loi-que', kind: 'verse', text: 'Lời quê chắp nhặt dông dài,\nMua vui cũng được một vài trống canh.',
    author: 'Nguyễn Du', work: 'Truyện Kiều', sourceUrl: kieu, locator: 'Câu 3253–3254', version: 'Bản Chiêm Vân Thị trên Wikisource, oldid 205132; đối chiếu ngày 02/11/2026.',
    context: 'Hai câu khép Truyện Kiều được dùng làm đề từ cho tiếng nói và chữ nghĩa. “Lời quê” ở đây là lời tự khiêm trong nguyên tác, không xác định Truyện Kiều là tư liệu phương ngữ Nam Bộ.',
    checkedAt: '2026-11-02', rights: 'public_domain_original',
  },
  'cam-tho': {
    id: 'cam-tho', kind: 'verse', text: 'Khi chén rượu khi cuộc cờ,\nKhi xem hoa nở khi chờ trăng lên.',
    author: 'Nguyễn Du', work: 'Truyện Kiều', sourceUrl: kieu, locator: 'Câu 3223–3224', version: 'Bản Chiêm Vân Thị trên Wikisource, oldid 205132; đối chiếu ngày 02/11/2026.',
    context: 'Câu thơ thuộc đoạn đoàn viên của Kiều và Kim Trọng, gợi sự bầu bạn trong cầm thơ. Đề từ gợi không khí nếp nhà, không phục dựng sinh hoạt của một gia đình cụ thể trong hồ sơ.',
    checkedAt: '2026-11-02', rights: 'public_domain_original',
  },
  'truoc-den': {
    id: 'truoc-den', kind: 'verse', text: 'Trước đèn xem truyện Tây minh,\nGẫm cười hai chữ nhơn tình éo le.',
    author: 'Nguyễn Đình Chiểu', work: 'Lục Vân Tiên',
    sourceUrl: 'https://vi.wikisource.org/w/index.php?title=Lục_Vân_Tiên_(bản_Quốc_ngữ_2082_câu)/I&oldid=38436', locator: 'Hai câu mở đầu', version: 'Bản Quốc ngữ 2082 câu, Wikisource oldid 38436; giữ “Gẫm”, “nhơn”, “Tây minh” theo bản đã đọc ngày 02/11/2026.',
    context: 'Mượn hai câu mở đầu truyện thơ để dẫn vào việc lần giở bản in và lời xưa. Cách viết giữ theo bản 2082 câu được dẫn; chưa bàn các cách giải thích khác nhau về “Tây minh”.',
    checkedAt: '2026-11-02', rights: 'public_domain_original',
  },
  'be-dau': {
    id: 'be-dau', kind: 'allusion', text: 'Bể dâu', author: 'Nguyễn Du', work: 'Truyện Kiều', sourceUrl: kieu, locator: 'Câu 3–4: “Trải qua một cuộc bể dâu”', version: 'Wikisource oldid 205132; đối chiếu ngày 02/11/2026.',
    context: 'Lời dẫn mượn hình ảnh bể dâu ở đầu Truyện Kiều để nói sự đổi thay qua năm tháng. Đây là nghĩa bóng văn chương; niên đại và biến đổi cảnh quan tại mỗi nơi vẫn phải đọc từ chứng cứ của hồ sơ.',
    checkedAt: '2026-11-02', rights: 'public_domain_original',
  },
  'tri-am': {
    id: 'tri-am', kind: 'allusion', text: 'Bá Nha – Tử Kỳ, cao sơn lưu thủy', author: 'Cổ thư Liệt Tử', work: 'Thang vấn',
    sourceUrl: 'https://zh.wikisource.org/zh-hant/列子/湯問篇', locator: 'Đoạn bắt đầu “伯牙善鼓琴，鍾子期善聽”', version: 'Đối chiếu nguyên văn Hán trên Wikisource ngày 02/11/2026; chỉ đoạn Bá Nha gảy đàn và Tử Kỳ hiểu ý núi cao, nước chảy.',
    context: 'Liệt Tử kể Bá Nha giỏi đàn, Chung Tử Kỳ giỏi nghe; ý đàn hướng núi cao hay dòng nước đều được Tử Kỳ hiểu. Lời dẫn mượn tích ấy nói sự gặp gỡ giữa người diễn và người nghe. Đây là liên tưởng biên tập, không phải tích nguồn gốc của đờn ca tài tử hay Rô Băm.',
    checkedAt: '2026-11-02', rights: 'public_domain_original',
  },
};
