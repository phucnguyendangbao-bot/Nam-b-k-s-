/**
 * Tour bản đồ 3D: nối các điểm di sản thành tuyến có camera bay, chú thích và lời thuyết minh.
 *
 * Quy ước biên tập (giống hồ sơ):
 * - Mỗi câu thuyết minh gắn với ít nhất một nguồn trong `mapSources`; câu dẫn đường không mang dữ kiện thì để `src: []`.
 * - Tọa độ lấy từ OpenStreetMap (Nominatim, truy vấn ngày 28-10-2026) và cần biên tập viên đối chiếu tại chỗ.
 * - `review: 'draft'` nghĩa là tuyến đang chờ duyệt nguồn; giao diện luôn hiện nhãn này.
 * - `publicDraft: true` cho phép công bố tuyến nháp kèm nhãn (chủ dự án quyết định ngày 28-10-2026).
 * - Viết số và ngày theo cách đọc được thành tiếng, vì câu được đưa thẳng vào giọng đọc máy.
 */

export type MapSource = { id: string; title: string; publisher: string; url: string; date?: string };
export type NarrationLine = { text: string; src: string[] };
export type LegMode = 'walk' | 'boat' | 'drive';
export type MapStop = {
  id: string;
  name: string;
  kicker: string;
  lat: number;
  lng: number;
  camera: { zoom: number; pitch: number; bearing: number };
  lines: NarrationLine[];
  facts: { label: string; value: string }[];
  /** Hồ sơ đầy đủ trên trang, nếu có. */
  dossier?: { id: string; slug: string };
  image?: { src: string; credit: string };
  /** Cách đi từ điểm này sang điểm kế tiếp. */
  next?: { mode: LegMode; note: string };
};
export type MapTour = {
  id: string;
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  area: string;
  duration: string;
  review: 'draft' | 'reviewed';
  /** Mở công khai dù chưa duyệt xong; trang luôn hiện nhãn bản nháp. */
  publicDraft?: boolean;
  cover?: { src: string; credit: string };
  /** Hành trình đọc liên quan (slug trong /hanh-trinh). */
  readingTours?: string[];
  stops: MapStop[];
};

export const mapSources: Record<string, MapSource> = {
  'S-MUNIR-CT': { id: 'S-MUNIR-CT', title: 'Munir Ansay Pagoda', publisher: 'Cổng thông tin du lịch Cần Thơ', url: 'https://canthotourism.vn/en/chuamuniransay' },
  'S-CHUAONG-CT': { id: 'S-CHUAONG-CT', title: 'Di tích kiến trúc nghệ thuật Chùa Ông (Quảng Triệu Hội Quán)', publisher: 'Cổng du lịch số TP Cần Thơ', url: 'https://thanhnien.dulichso.cantho.gov.vn/baiviet/125' },
  'S-NINHKIEU-CT': { id: 'S-NINHKIEU-CT', title: 'Bến Ninh Kiều', publisher: 'Cổng thông tin du lịch Cần Thơ', url: 'https://canthotourism.vn/vi/benninhkieu' },
  'S-CHOCO-BCT': { id: 'S-CHOCO-BCT', title: 'Chợ cổ trăm năm, biểu tượng Cần Thơ', publisher: 'Báo Cần Thơ', url: 'https://baocantho.com.vn/cho-co-tram-nam-bieu-tuong-can-tho-a171923.html', date: '01-04-2024' },
  'R-MARKET-CONGBAO': { id: 'R-MARKET-CONGBAO', title: 'Công báo TP Cần Thơ số 45+46, trang 27 (Quyết định 1189/QĐ-UBND)', publisher: 'UBND TP Cần Thơ', url: 'https://congbao.cantho.gov.vn/tmp/docga_18843922_page27.pdf', date: '21-06-2024' },
  'R-MARKET-BVHTTDL': { id: 'R-MARKET-BVHTTDL', title: 'Ban giải pháp bảo tồn và phát triển chợ nổi Cái Răng', publisher: 'Bộ Văn hóa, Thể thao và Du lịch', url: 'https://bvhttdl.gov.vn/ban-giai-phap-bao-ton-va-phat-trien-cho-noi-cai-rang-tp-can-tho-20190709110942916.htm', date: '09-07-2019' },
  'S-VNAT-CANTHO': { id: 'S-VNAT-CANTHO', title: 'Cần Thơ (cẩm nang điểm đến)', publisher: 'Cục Du lịch Quốc gia Việt Nam', url: 'https://vietnam.travel/vi/node/1626' },
  'S-DINHBT-BVH': { id: 'S-DINHBT-BVH', title: 'Khai mạc Lễ hội Kỳ yên Thượng điền đình Bình Thủy 2026', publisher: 'Báo Văn hóa', url: 'https://baovanhoa.vn/van-hoa/khai-mac-le-hoi-ky-yen-thuong-dien-dinh-binh-thuy-2026-232344.html', date: '28-05-2026' },
  'S-NAMNHA-TP': { id: 'S-NAMNHA-TP', title: 'Hàng nghìn người về ngôi chùa hơn 130 tuổi ở Cần Thơ', publisher: 'Tiền Phong', url: 'https://tienphong.vn/hang-nghin-nguoi-ve-ngoi-chua-hon-130-tuoi-o-can-tho-post1855115.tpo', date: '28-06-2026' },
  'R-BINHTHUY-VNAT': { id: 'R-BINHTHUY-VNAT', title: 'Nhà cổ Bình Thủy', publisher: 'Cơ sở dữ liệu du lịch Việt Nam', url: 'https://csdl.vietnamtourism.gov.vn/dest/?item=145' },
  'R-BINHTHUY-CT': { id: 'R-BINHTHUY-CT', title: 'Nhà cổ Bình Thủy', publisher: 'Cổng thông tin du lịch Cần Thơ', url: 'https://canthotourism.vn/vi/nhacobinhthuy' },
  'S-OSM': { id: 'S-OSM', title: 'Tọa độ điểm dừng (Nominatim)', publisher: 'OpenStreetMap, giấy phép ODbL', url: 'https://www.openstreetmap.org/copyright' },
};

export const mapTourDrafts: MapTour[] = [
  {
    id: 'NBS-MAP-VEN-SONG',
    slug: 'ven-song-can-tho-tu-pho-cho-den-cho-noi',
    title: 'Ven sông Cần Thơ: từ phố chợ đến chợ nổi',
    kicker: 'Tour bản đồ 3D · Cần Thơ',
    summary: 'Đi bộ qua một ngôi chùa Khmer, một hội quán người Hoa, bến sông và nhà lồng chợ cổ, rồi theo dòng sông Cần Thơ xuống chợ nổi Cái Răng.',
    area: 'Ninh Kiều và Cái Răng, TP Cần Thơ',
    duration: 'Khoảng 15 phút xem, 5 chặng',
    review: 'draft',
    publicDraft: true,
    cover: { src: '/media/cai-rang-market-dalbera.webp', credit: 'Ảnh: Jean-Pierre Dalbéra, CC BY 2.0' },
    readingTours: ['doc-ten-dat-qua-nhung-gia-thuyet-nbs-doc-ten-dat'],
    stops: [
      {
        id: 'munir-ansay',
        name: 'Chùa Munir Ansay',
        kicker: 'Chùa Khmer giữa phố',
        lat: 10.03355, lng: 105.78406,
        camera: { zoom: 17.6, pitch: 62, bearing: -35 },
        lines: [
          { text: 'Tour bắt đầu ở một ngôi chùa Khmer nằm ngay trên đại lộ Hòa Bình, giữa trung tâm Cần Thơ.', src: ['S-MUNIR-CT'] },
          { text: 'Theo cổng thông tin du lịch thành phố, chùa được dựng năm 1948 bằng tre, vật liệu rất đơn sơ, rồi được trùng tu và xây lại nhiều lần.', src: ['S-MUNIR-CT'] },
          { text: 'Năm 1954 chùa có cổng mới, mô phỏng tháp Tam Bảo; năm 1964 có thêm chính điện mới.', src: ['S-MUNIR-CT'] },
          { text: 'Giống nhiều chùa Khmer khác, chính điện quay về hướng đông.', src: ['S-MUNIR-CT'] },
          { text: 'Đây cũng là nơi tổ chức các lễ lớn trong năm của đồng bào Khmer như Chôl Chnăm Thmây, Ok Om Bok, Sene Đôlta và lễ dâng y Kathina.', src: ['S-MUNIR-CT'] },
        ],
        facts: [
          { label: 'Dựng lần đầu', value: '1948, theo nguồn du lịch' },
          { label: 'Cộng đồng', value: 'Khmer' },
          { label: 'Địa chỉ', value: '36 đại lộ Hòa Bình' },
        ],
        next: { mode: 'walk', note: 'Đi bộ ra phía sông, về đường Hai Bà Trưng' },
      },
      {
        id: 'chua-ong',
        name: 'Chùa Ông',
        kicker: 'Quảng Triệu Hội Quán · Di tích quốc gia',
        lat: 10.03416, lng: 105.78853,
        camera: { zoom: 18.2, pitch: 64, bearing: 40 },
        lines: [
          { text: 'Người dân quen gọi nơi này là Chùa Ông; tên chính thức là Quảng Triệu Hội Quán.', src: ['S-CHUAONG-CT'] },
          { text: 'Hội quán do nhóm người Hoa đến từ hai phủ Quảng Châu và Triệu Khánh, tỉnh Quảng Đông, dựng nên.', src: ['S-CHUAONG-CT'] },
          { text: 'Công trình khởi công năm 1894 và hoàn thành năm 1896, thờ Quan Thánh Đế.', src: ['S-CHUAONG-CT'] },
          { text: 'Mặt bằng bố cục theo hình chữ Quốc: các dãy nhà khép kín, vuông góc với nhau, ở giữa là sân thiên tỉnh.', src: ['S-CHUAONG-CT'] },
          { text: 'Ngày 21 tháng 6 năm 1993, Bộ Văn hóa Thông tin xếp hạng Chùa Ông là di tích kiến trúc nghệ thuật.', src: ['S-CHUAONG-CT'] },
        ],
        facts: [
          { label: 'Xây dựng', value: '1894 đến 1896' },
          { label: 'Xếp hạng', value: '21-6-1993' },
          { label: 'Địa chỉ', value: '32 Hai Bà Trưng' },
        ],
        next: { mode: 'walk', note: 'Băng qua đường, ra mép sông' },
      },
      {
        id: 'ben-ninh-kieu',
        name: 'Bến Ninh Kiều',
        kicker: 'Nơi sông Cần Thơ gặp sông Hậu',
        lat: 10.03383, lng: 105.78865,
        camera: { zoom: 16.4, pitch: 66, bearing: 120 },
        lines: [
          { text: 'Bến Ninh Kiều, còn gọi là công viên Ninh Kiều, nằm ở nơi sông Cần Thơ hợp lưu với sông Hậu, dọc đường Hai Bà Trưng.', src: ['S-NINHKIEU-CT'] },
          { text: 'Cổng du lịch thành phố cho biết bến hình thành từ thế kỷ mười chín.', src: ['S-NINHKIEU-CT'] },
          { text: 'Trong công viên có tượng đồng Chủ tịch Hồ Chí Minh cao bảy phẩy hai mét, đặt trên bệ cao ba phẩy sáu mét.', src: ['S-NINHKIEU-CT'] },
          { text: 'Từ bến có thể nhìn thấy cầu Cần Thơ, cây cầu dây văng hoàn thành năm 2010.', src: ['S-NINHKIEU-CT'] },
          { text: 'Sáng sớm, nhiều tàu khách rời bến này để xuống chợ nổi Cái Răng.', src: ['S-NINHKIEU-CT'] },
        ],
        facts: [
          { label: 'Hình thành', value: 'Thế kỷ 19, theo nguồn du lịch' },
          { label: 'Vị trí', value: 'Hợp lưu sông Cần Thơ và sông Hậu' },
        ],
        next: { mode: 'walk', note: 'Men theo bờ sông về phía nhà lồng chợ' },
      },
      {
        id: 'cho-co',
        name: 'Chợ cổ Cần Thơ',
        kicker: 'Nhà lồng chợ · Di tích cấp thành phố',
        lat: 10.03138, lng: 105.78818,
        camera: { zoom: 18, pitch: 62, bearing: 75 },
        lines: [
          { text: 'Ngay trên bến là nhà lồng chợ Cần Thơ.', src: ['S-CHOCO-BCT'] },
          { text: 'Báo Cần Thơ viết chợ được lập từ đầu thế kỷ hai mươi và hoạt động liên tục đến nay; công trình được trùng tu, hoàn thành năm 2005.', src: ['S-CHOCO-BCT'] },
          { text: 'Nhà lồng rộng khoảng một nghìn bảy trăm mét vuông, thiết kế theo chữ T, mái lợp ngói, kết hợp hài hòa kiến trúc Đông và Tây.', src: ['S-CHOCO-BCT'] },
          { text: 'Năm 2012, Ủy ban nhân dân thành phố xếp hạng nơi đây là di tích lịch sử văn hóa cấp thành phố.', src: ['S-CHOCO-BCT'] },
          { text: 'Hình nhà lồng chợ cách điệu bên dòng sông uốn lượn đã trở thành biểu trưng của thành phố.', src: ['S-CHOCO-BCT'] },
        ],
        facts: [
          { label: 'Diện tích', value: 'Khoảng 1.700 m²' },
          { label: 'Trùng tu', value: 'Hoàn thành năm 2005' },
          { label: 'Xếp hạng', value: 'Di tích cấp thành phố, 2012' },
        ],
        next: { mode: 'boat', note: 'Theo sông Cần Thơ ngược về phía Cái Răng' },
      },
      {
        id: 'cho-noi-cai-rang',
        name: 'Chợ nổi Cái Răng',
        kicker: 'Di sản văn hóa phi vật thể quốc gia',
        lat: 10.0024, lng: 105.74439,
        camera: { zoom: 16.2, pitch: 64, bearing: -60 },
        lines: [
          { text: 'Chặng cuối là chợ nổi Cái Răng trên sông Cần Thơ.', src: [] },
          { text: 'Văn hóa Chợ nổi Cái Răng là di sản văn hóa phi vật thể quốc gia, theo quyết định số 829 của Bộ Văn hóa, Thể thao và Du lịch ngày 10 tháng 3 năm 2016.', src: ['R-MARKET-CONGBAO'] },
          { text: 'Cẩm nang của Cục Du lịch Quốc gia ghi chợ thường họp từ khoảng bốn giờ ba mươi đến tám giờ sáng.', src: ['S-VNAT-CANTHO'] },
          { text: 'Đề án bảo tồn hướng tới giữ vai trò đầu mối, trung chuyển nông sản, đồng thời gắn du lịch với vệ sinh môi trường và an sinh.', src: ['R-MARKET-BVHTTDL'] },
          { text: 'Quy mô buôn bán hôm nay có thể khác những gì tư liệu ghi lại, nên hãy xem chợ như một không gian sống chứ không chỉ là điểm chụp ảnh.', src: [] },
        ],
        facts: [
          { label: 'Ghi nhận', value: 'Di sản phi vật thể quốc gia, 2016' },
          { label: 'Giờ họp', value: 'Khoảng 4:30 đến 8:00, theo nguồn' },
        ],
        dossier: { id: 'NBS-CHO-NOI', slug: 'cho-noi-cai-rang-mot-khong-gian-van-hoa-song-nuoc-nbs-cho-noi' },
        image: { src: '/media/cai-rang-market-dalbera.webp', credit: 'Jean-Pierre Dalbéra, CC BY 2.0, ảnh chụp năm 2011' },
      },
    ],
  },
  {
    id: 'NBS-MAP-LONG-TUYEN',
    slug: 'lang-co-long-tuyen-ben-rach-binh-thuy',
    title: 'Làng cổ Long Tuyền bên rạch Bình Thủy',
    kicker: 'Tour bản đồ 3D · Bình Thủy',
    summary: 'Ngôi đình làng, ngôi chùa của phong trào Đông Du và nhà cổ họ Dương nằm gần nhau quanh rạch Bình Thủy.',
    area: 'Bình Thủy, TP Cần Thơ',
    duration: 'Khoảng 10 phút xem, 3 chặng',
    review: 'draft',
    publicDraft: true,
    cover: { src: '/media/binh-thuy-house-daae.webp', credit: 'Ảnh: Daaé, Public domain' },
    readingTours: ['nep-nha-qua-tu-lieu-va-loi-ke-nbs-doc-nep-nha'],
    stops: [
      {
        id: 'dinh-binh-thuy',
        name: 'Đình Bình Thủy',
        kicker: 'Long Tuyền Cổ Miếu · Di tích quốc gia',
        lat: 10.07249, lng: 105.75224,
        camera: { zoom: 18, pitch: 63, bearing: 20 },
        lines: [
          { text: 'Đình Bình Thủy còn có tên là Long Tuyền Cổ Miếu.', src: ['S-DINHBT-BVH'] },
          { text: 'Theo Báo Văn hóa, đình được xây dựng năm 1844; đến năm 1852, vua Tự Đức sắc phong Bổn Cảnh Thành Hoàng cho làng.', src: ['S-DINHBT-BVH'] },
          { text: 'Đầu thế kỷ hai mươi, đình được xây lại bằng gạch ngói và hoàn thành năm 1910, với diện mạo còn giữ đến nay.', src: ['S-DINHBT-BVH'] },
          { text: 'Năm 1989, đình được công nhận là di tích kiến trúc nghệ thuật cấp quốc gia.', src: ['S-DINHBT-BVH'] },
          { text: 'Lễ hội Kỳ yên Thượng điền diễn ra vào dịp rằm tháng tư âm lịch, Hạ điền vào dịp rằm tháng chạp. Năm 2018, lễ hội được đưa vào danh mục di sản văn hóa phi vật thể quốc gia.', src: ['S-DINHBT-BVH'] },
        ],
        facts: [
          { label: 'Xây dựng', value: '1844; xây lại xong 1910' },
          { label: 'Xếp hạng', value: 'Di tích quốc gia, 1989' },
          { label: 'Lễ hội', value: 'Rằm tháng 4 và rằm tháng Chạp âm lịch' },
        ],
        next: { mode: 'walk', note: 'Qua cầu Bình Thủy sang bờ bên kia rạch' },
      },
      {
        id: 'chua-nam-nha',
        name: 'Chùa Nam Nhã',
        kicker: 'Di tích lịch sử cách mạng quốc gia',
        lat: 10.072, lng: 105.7542,
        camera: { zoom: 18, pitch: 62, bearing: -70 },
        lines: [
          { text: 'Bên kia rạch, nhìn sang đình Bình Thủy, là chùa Nam Nhã, còn gọi Nam Nhã Phật đường.', src: ['S-NAMNHA-TP'] },
          { text: 'Báo Tiền Phong ghi chùa được xây dựng năm 1895.', src: ['S-NAMNHA-TP'] },
          { text: 'Từ năm 1905, thời phong trào Đông Du, ngôi chùa trở thành nơi kinh tài, ủng hộ học sinh xuất dương du học.', src: ['S-NAMNHA-TP'] },
          { text: 'Chánh điện được thiết kế theo kiểu nhà năm gian hai chái.', src: ['S-NAMNHA-TP'] },
          { text: 'Ngày 25 tháng 1 năm 1991, Bộ Văn hóa Thông tin công nhận chùa là di tích lịch sử cách mạng cấp quốc gia.', src: ['S-NAMNHA-TP'] },
        ],
        facts: [
          { label: 'Xây dựng', value: '1895, theo báo chí' },
          { label: 'Xếp hạng', value: 'Di tích quốc gia, 25-1-1991' },
        ],
        next: { mode: 'drive', note: 'Theo đường Bùi Hữu Nghĩa về phía nam' },
      },
      {
        id: 'nha-co-binh-thuy',
        name: 'Nhà cổ Bình Thủy',
        kicker: 'Nhà họ Dương · Di tích quốc gia',
        lat: 10.067, lng: 105.74963,
        camera: { zoom: 18.3, pitch: 64, bearing: 15 },
        lines: [
          { text: 'Chặng cuối là ngôi nhà cổ của gia đình họ Dương trên đường Bùi Hữu Nghĩa.', src: ['R-BINHTHUY-VNAT'] },
          { text: 'Cơ sở dữ liệu ngành Du lịch ghi mốc xây dựng năm 1870 và mô tả ngôi nhà năm gian, hai mái, có ảnh hưởng kiến trúc Pháp.', src: ['R-BINHTHUY-VNAT'] },
          { text: 'Năm 2009, ngôi nhà được xếp hạng di tích kiến trúc nghệ thuật cấp quốc gia.', src: ['S-VNAT-CANTHO'] },
          { text: 'Ngôi nhà từng làm bối cảnh cho các phim Người đẹp Tây Đô, Những nẻo đường phù sa và Người tình.', src: ['R-BINHTHUY-CT'] },
        ],
        facts: [
          { label: 'Mốc xây dựng', value: '1870, theo nguồn du lịch' },
          { label: 'Xếp hạng', value: 'Di tích quốc gia, 2009' },
        ],
        dossier: { id: 'NBS-BINH-THUY', slug: 'nha-co-binh-thuy-doc-kien-truc-va-nep-nha-nbs-binh-thuy' },
        image: { src: '/media/binh-thuy-house-daae.webp', credit: 'Daaé, Public domain' },
      },
    ],
  },
];

/** Tuyến được dùng trong trang, sitemap và liên kết hồ sơ: đã duyệt, hoặc nháp được phép công bố kèm nhãn. */
export const mapTours: MapTour[] = mapTourDrafts.filter(tour => tour.review === 'reviewed' || tour.publicDraft);

/** Khoảng cách theo đường chim bay, mét. */
export function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

export function tourLength(t: MapTour) {
  let total = 0;
  for (let i = 1; i < t.stops.length; i++) total += distance(t.stops[i - 1], t.stops[i]);
  return total;
}

export const mapTourBySlug = (slug: string) => mapTours.find(t => t.slug === slug);

/** Các tour bản đồ có chặng trỏ về một hồ sơ. */
export function mapToursFor(contentId: string) {
  return mapTours.flatMap(t => t.stops.flatMap((s, i) => (s.dossier?.id === contentId ? [{ tour: t, stop: s, index: i }] : [])));
}

export const legLabel: Record<LegMode, string> = { walk: 'Đi bộ', boat: 'Đi ghe, tàu', drive: 'Xe máy, ô tô' };
