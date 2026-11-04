/**
 * Câu chuyện của trang: sáu chương nối toàn bộ hồ sơ đã kiểm chứng thành một mạch đọc.
 * Lời dẫn chương là lời biên tập, chỉ gom lại những gì các hồ sơ đã viết; mọi dữ kiện nằm trong hồ sơ, có nguồn.
 *
 * Ảnh chương là ảnh minh họa của trang (không phải ảnh tư liệu của hồ sơ), mỗi ảnh có đủ: tác giả, giấy phép,
 * trang gốc trên Wikimedia Commons, cách đã xử lý và mã băm tệp. Ảnh được chọn theo độ nét ở cỡ gốc (đã xem ở 100%).
 */
import { imagePathAllowed, permitsCommercialMedia } from './editorial-model.ts';

export type StoryImage = {
  url: string; width: number; height: number; alt: string; caption: string;
  author: string; source_url: string; license_name: string; license_url: string;
  modifications: string; attribution: string; sha256: string; checked_at: string; position?: string;
  /** Ảnh tư liệu của hồ sơ chụp cùng tệp gốc này (bản nhỏ hơn); trang chủ không lặp lại nó ngay bên dưới. */
  sameAs?: string;
};

const resized = (w: number, from: string) => `Thu nhỏ theo tỷ lệ từ tệp gốc ${from} px về chiều rộng ${w} px, lưu WebP; không cắt, không sửa cảnh, màu hay xóa dấu.`;

export const storyImages = {
  prologue: {
    url: '/media/story-kenh-my-tho-esin-ustun.webp', width: 2560, height: 1707, position: '42% 60%',
    alt: 'Người phụ nữ đội nón lá chèo xuồng trên con rạch giữa hai hàng dừa nước.',
    caption: 'Rạch dừa nước ở Mỹ Tho, ảnh Esin Üstün chụp ngày 29-10-2014.',
    author: 'Esin Üstün', source_url: 'https://commons.wikimedia.org/wiki/File:Canal_in_Mekong_Delta_-_My_Tho_-_Vietnam_(15912635245).jpg',
    license_name: 'CC BY 2.0', license_url: 'https://creativecommons.org/licenses/by/2.0/', modifications: resized(2560, '4431 × 2954'),
    attribution: 'Canal in Mekong Delta - My Tho - Vietnam — Esin Üstün, Flickr qua Wikimedia Commons, CC BY 2.0.',
    sha256: 'd670641ef6339f980cad4513401a77b7be1c1f0397e3140e49e0b26f408000a0', checked_at: '2026-11-01',
  },
  nuoc: {
    url: '/media/story-cu-lao-dung-nasa-iss.webp', width: 2400, height: 1348,
    alt: 'Ảnh chụp từ vũ trụ: dòng sông màu nâu phù sa chia hai nhánh ôm lấy một cù lao dài rồi đổ ra biển.',
    caption: 'Sông Hậu ôm quanh cù lao Dung trước khi ra Biển Đông, ảnh chụp từ Trạm Vũ trụ Quốc tế ngày 2-10-2025. Theo mô tả của NASA, màu nâu ở cửa sông là phù sa, sét và chất hữu cơ từ thượng nguồn Mê Kông.',
    author: 'NASA Johnson Space Center (ảnh iss073e0818427)', source_url: 'https://commons.wikimedia.org/wiki/File:The_Bassac_River_surrounds_C%C3%B9_Lao_Dung,_a_river_islet_district_in_southern_Vietnam_(iss073e0818427).jpg',
    license_name: 'Public domain', license_url: 'https://commons.wikimedia.org/wiki/Template:PD-USGov-NASA', modifications: resized(2400, '4928 × 2768'),
    attribution: 'The Bassac River surrounds Cù Lao Dung (iss073e0818427) — NASA Johnson Space Center, phạm vi công cộng.',
    sha256: '70034283cd51851bb89bb64ab15d0c632acfb0e2b5a06b46a7cb98f96704219c', checked_at: '2026-11-01',
  },
  ben: {
    url: '/media/story-cho-noi-cai-rang-astesana.webp', width: 2400, height: 1595, position: '50% 70%',
    alt: 'Những chiếc ghe chở bắp cải, hành và hàng hóa neo sát nhau trên sông, trời nhiều mây trắng.',
    caption: 'Ghe hàng ở chợ nổi Cái Răng (Cần Thơ), ảnh Jean-Marc Astesana chụp ngày 15-3-2013; không phản ánh hiện trạng năm 2026.',
    author: 'Jean-Marc Astesana', source_url: 'https://commons.wikimedia.org/wiki/File:Cai_Rang_floating_market_(15724707578).jpg',
    license_name: 'CC BY-SA 2.0', license_url: 'https://creativecommons.org/licenses/by-sa/2.0/', modifications: resized(2400, '4672 × 3104'),
    attribution: 'Cai Rang floating market (15724707578) — Jean-Marc Astesana, Flickr qua Wikimedia Commons, CC BY-SA 2.0.',
    sha256: '102d5363f05dff7bf2f28b0cf6e62c2fb45156d389ec901954227f118e07bde0', checked_at: '2026-11-01',
  },
  nha: {
    url: '/media/story-nha-co-binh-thuy-daae.webp', width: 2400, height: 1800, position: '50% 55%', sameAs: '/media/binh-thuy-house-daae.webp',
    alt: 'Mặt tiền nhà cổ Bình Thủy với hàng cửa vòm xanh, bậc thềm lan can trắng và chậu cây cảnh.',
    caption: 'Nhà cổ Bình Thủy (Cần Thơ), ảnh Daaé chụp ngày 7-8-2008.',
    author: 'Daaé', source_url: 'https://commons.wikimedia.org/wiki/File:Nha_co_Binh_Thuy_1.jpg',
    license_name: 'Public domain', license_url: 'https://commons.wikimedia.org/wiki/Template:PD-self', modifications: resized(2400, '3072 × 2304'),
    attribution: 'Nha co Binh Thuy 1.jpg — Daaé, Wikimedia Commons, tác giả tự đặt vào phạm vi công cộng.',
    sha256: '6f44d7d6d7cad23cd6a9c2af54a834df7d45e9bf2dafd128ad0350635aa66958', checked_at: '2026-11-01',
  },
  hoi: {
    url: '/media/story-chua-doi-soc-trang-mai-lan.webp', width: 2400, height: 1350, position: '45% 50%',
    alt: 'Chánh điện chùa Khmer mái nhiều tầng, đầu đao uốn cong, chạm khắc nhiều màu dưới tán cây.',
    caption: 'Chùa Dơi ở Sóc Trăng (địa danh theo thời điểm chụp), ảnh Mai Lan chụp ngày 31-12-2017. Ảnh minh họa không gian chùa Khmer, không phải ảnh một lễ hội cụ thể.',
    author: 'Mai Lan', source_url: 'https://commons.wikimedia.org/wiki/File:Ch%C3%B9a_D%C6%A1i_S%C3%B3c_Tr%C4%83ng_(40553739771).jpg',
    license_name: 'CC BY-SA 2.0', license_url: 'https://creativecommons.org/licenses/by-sa/2.0/', modifications: resized(2400, '4128 × 2322'),
    attribution: 'Chùa Dơi Sóc Trăng (40553739771) — Mai Lan, Flickr qua Wikimedia Commons, CC BY-SA 2.0.',
    sha256: 'c6216f57c45f7cc5cf2bdfcb886a4d8d7b717fc0299a6705196176b0fda0c438', checked_at: '2026-11-01',
  },
} satisfies Record<string, StoryImage>;

export type Chapter = {
  n: number; slug: string; name: string; title: string; lede: string;
  /** Hồ sơ theo thứ tự đọc trong chương. */
  ids: string[];
  image?: StoryImage;
};

export const chapters: Chapter[] = [
  { n: 1, slug: 'nuoc', name: 'Nước', title: 'Trước hết là nước.',
    lede: 'Nhìn từ trên cao, sông Hậu mang phù sa ra biển. Câu chuyện bắt đầu ở hai vùng đất ngập nước: đồng cỏ, rừng tràm Tràm Chim sống theo nhịp nước, và rừng ngập mặn Cần Giờ với công việc giữ rừng.',
    ids: ['KN-TRAM-CHIM', 'KN-CAN-GIO', 'NBS-RUNG-TRAM-TRA-SU', 'NBS-U-MINH-THUONG'], image: storyImages.nuoc },
  { n: 2, slug: 'dau-vet', name: 'Dấu vết', title: 'Những lớp đất biết kể.',
    lede: 'Có câu hỏi đã có tư liệu trả lời, có câu hỏi còn để ngỏ. Từ tượng động vật Dốc Chùa, mốc hành chính năm 1698, con kênh Vĩnh Tế đào bằng tay, cuộc đời thầy đồ Nguyễn Đình Chiểu đến những giả thuyết về tên Đầu Sấu, Cái Răng, mỗi hồ sơ tách rõ dữ kiện với chuyện kể.',
    ids: ['KN-SAMPLE-DOC-CHUA', 'NBS-NGUYEN-HUU-CANH', 'NBS-KENH-VINH-TE', 'NBS-NGUYEN-DINH-CHIEU', 'E020', 'E021', 'NBS-OC-EO-BA-THE', 'NBS-VAN-THANH-MIEU-VL', 'NBS-GIA-DINH-THONG-CHI'] },
  { n: 3, slug: 'ben-song', name: 'Bến sông', title: 'Đời sống họp lại bên bến.',
    lede: 'Nơi sông gặp sông thành bến, bến thành chợ. Đọc bến Ninh Kiều, cái tên Cần Thơ của một con sông nhỏ, chợ nổi Cái Răng, rồi nghề bánh pía và bánh tráng phơi sương qua bàn tay người làm.',
    ids: ['NBS-NINH-KIEU', 'NBS-TEN-CAN-THO', 'NBS-CHO-NOI', 'E027', 'NBS-BANH-TRANG-TRANG-BANG', 'NBS-CHO-NOI-NGA-BAY', 'NBS-GACH-GOM-MANG-THIT'], image: storyImages.ben },
  { n: 4, slug: 'nep-nha', name: 'Nếp nhà', title: 'Từ bậc thềm vào gian nhà.',
    lede: 'Một ngôi nhà cổ, một mái đình làng, một mâm trầu cau, một lời mời cưới, một ngày giỗ. Những nếp sống gia đình và xóm làng được đọc qua tư liệu và lời kể.',
    ids: ['NBS-BINH-THUY', 'NBS-DINH-BINH-THUY', 'E001', 'E002', 'E004', 'E008', 'NBS-CHUA-DOI-MAHATUP', 'NBS-NHA-CO-CAI-CUONG'], image: storyImages.nha },
  { n: 5, slug: 'mua-hoi', name: 'Mùa hội', title: 'Khi các cộng đồng gặp nhau.',
    lede: 'Năm mới và mùa trăng của người Khmer, nhịp chèo ghe Ngo, đêm Nguyên Tiêu, đời sống Chăm ở Châu Giang, tiếng đờn ca tài tử và sân khấu Rô Băm: phương Nam là nơi nhiều cộng đồng cùng sống.',
    ids: ['E011', 'E010', 'E012', 'E013', 'KN-SAMPLE-NGUYEN-TIEU', 'KN-SAMPLE-CHAU-GIANG', 'E018', 'E014', 'NBS-VIA-BA-CHUA-XU', 'NBS-DA-CO-HOAI-LANG'], image: storyImages.hoi },
  { n: 6, slug: 'tieng-noi', name: 'Tiếng nói', title: 'Lời xưa còn trong lời nay.',
    lede: 'Một câu hò kể bốn bến sông Cần Thơ mà đoán được tuổi, những lời thương thời kinh xáng, nỗi sợ của người mở đất; rồi hai câu tục ngữ in ở Sài Gòn năm 1897 và những tiếng xưng hô người miền Tây vẫn nói mỗi ngày.',
    ids: ['NBS-CD-CAI-RANG', 'NBS-CD-KINH-XANG', 'NBS-CD-GAO-TRANG', 'NBS-CD-MO-DAT', 'NBS-TUCNGU-18', 'NBS-TUCNGU-22', 'E029', 'E030', 'E031', 'E032', 'E033', 'NBS-TU-VAY', 'NBS-TU-VO', 'NBS-TU-NGHEN', 'NBS-TD-CAY-BEO', 'NBS-TD-LI-XI'] },
];

export const chapterAnchor = (c: Pick<Chapter, 'n'>) => `chuong-${c.n}`;

/** Vị trí của một hồ sơ trong câu chuyện, kèm bài trước và bài sau (có thể sang chương khác). */
export function storyPosition(id: string) {
  const flat = chapters.flatMap(c => c.ids.map((cid, i) => ({ id: cid, chapter: c, index: i })));
  const at = flat.findIndex(x => x.id === id);
  if (at < 0) return null;
  return { ...flat[at], total: flat[at].chapter.ids.length, prev: flat[at - 1] ?? null, next: flat[at + 1] ?? null, order: at + 1, count: flat.length };
}

/** Kiểm tra quyền ảnh theo đúng quy tắc của ảnh hồ sơ. */
export function storyImageCleared(img: StoryImage) {
  return imagePathAllowed(img.url) && permitsCommercialMedia(img.license_name, img.license_url)
    && img.author.length > 0 && img.source_url.startsWith('https://commons.wikimedia.org/wiki/File:') && img.modifications.length > 0 && /^[0-9a-f]{64}$/.test(img.sha256);
}
