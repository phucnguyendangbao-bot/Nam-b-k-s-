# Nam Bộ Ký Sự — Website

## GitHub + Vercel

Nhánh `migration/github-vercel` là bản đọc công khai độc lập với Cloudflare D1.
Nó đóng gói đúng 11 hồ sơ và 3 hành trình đã duyệt từ
`lib/editorial-bundle.json`, cùng sổ nguồn trong `lib/research-seed.json`.
Website Sites hiện tại chưa bị xóa và vẫn là bản sao lưu CMS trong giai đoạn
chuyển đổi.

Chỉnh nội dung đã duyệt trong `lib/editorial-bundle.json`, mở pull request và chờ
GitHub Actions chạy `typecheck` + build Next.js. Khi repository được kết nối với
Vercel, mỗi pull request có một Preview Deployment; nhánh production được triển
khai tự động. Đặt `NEXT_PUBLIC_SITE_URL` trong Vercel theo `.env.example`.

```powershell
npm ci
npm run typecheck
npm run build:vercel
npm run dev:vercel
```

Bản Vercel không nhận thao tác ghi, đăng nhập, sổ tay hoặc đóng góp cộng đồng.
Muốn khôi phục CMS đầy đủ cần chuyển D1 và xác thực sang dịch vụ tương thích
Vercel trong một bước riêng; không đưa khóa, token hoặc `.env` vào Git.

Website văn hóa với thư viện, nguồn tư liệu, CMS và kiểm soát công bố theo phiên bản.
Dùng TypeScript, React, Vinext (App Router tương thích Next.js), Tailwind CSS và
Cloudflare D1/Drizzle theo môi trường Sites. Kho Python/SQLite/ETL ở thư mục cha
được giữ nguyên. Chưa dùng PostgreSQL/Prisma vì môi trường Worker sử dụng D1 và
chưa có kết nối PostgreSQL được cấu hình.

## Chạy local

Node >=22.13, npm. Từ thư mục web:

```powershell
npm ci
npm run db:generate
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_wise_peter_quill.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_publication_guards.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_wooden_surge.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0003_media_and_dictionary_guards.sql
npm run dev
```

Chỉ áp dụng migration chưa chạy; không replay SQL đã áp dụng. Build và migration
đã được chạy trong workspace bàn giao. Máy chủ portable thường in URL
http://127.0.0.1:5173/. `dist/server/wrangler.json` do build sinh, không sửa tay.
Thay đổi schema bằng Drizzle và thêm migration, không sửa lịch sử migration.

## Giao diện

Phong cách cổng di sản (tham khảo bố cục các trang di sản văn hóa Việt Nam): thanh
trên nâu phù sa, menu chữ in hoa chia hai bên biểu tượng ở giữa, ảnh trình chiếu
tràn màn hình, tiêu đề khối chữ Philosopher in hoa, nội dung chữ Roboto Condensed
(cả hai SIL OFL, tự lưu trữ trong public/fonts). Màu chính: nâu #1E140F, đồng thau
#8A6420, vàng lúa #E9B92F. Token và kiểu nằm ở app/theme.css; font ở
app/fonts-heritage.css. Ảnh dùng trên trang chủ lấy từ media đã duyệt quyền.

- Trang chủ: ảnh trình chiếu (kèm ghi công), khối giới thiệu có hình vẽ nét nhà cổ,
  dải hồ sơ đóng khung trên nền ảnh tối, khối "Mới cập nhật" có ô lịch, Tiếng quê,
  Hành trình và hộp Bản đồ trên ảnh nền.
- Tìm nhanh: Ctrl/⌘ + K hoặc phím / mở bảng tìm kiếm ở mọi trang; /kham-pha,
  /tim-kiem và /hoi-dap hiện kết quả ngay khi gõ, không cần dấu. Dữ liệu lấy từ
  GET /api/search, chỉ gồm hồ sơ và hành trình đã công bố.
- Tiếng quê mình: thẻ lật và trắc nghiệm từ các mục từ đã công bố (từ đang hỏi được
  che trong đáp án để không tự lộ).
- Bản đồ: Leaflet + ô bản đồ OpenStreetMap, ghim chỉ cho hồ sơ đã công bố có tọa độ
  được duyệt; bấm ghim hoặc danh sách để mở thẻ hồ sơ.
- Chuyển trang mượt bằng View Transitions, thanh tiến độ đọc bằng scroll-driven
  animation (trình duyệt không hỗ trợ thì bỏ qua). Tôn trọng prefers-reduced-motion.

## Đăng nhập và phân quyền

Hosted sử dụng Sign in with ChatGPT của Sites, không tự triển khai OAuth. Preview
loopback mô phỏng tài khoản local_seedy; mock không đi vào bản production.

Website đang owner-private. OWNER_PRIVATE_SETUP=true cho phép tài khoản đầu tiên
được nền tảng xác thực trở thành quản trị viên duy nhất của bước khởi tạo, khóa
vào user ID trong app_settings. Trước khi thay đổi phạm vi truy cập, đăng nhập
chủ sở hữu để hoàn tất khởi tạo và đặt OWNER_PRIVATE_SETUP=false bằng công cụ
cấu hình runtime của Sites. Không bật cơ chế này ở website public/shared chưa có
quản trị viên. Biến cấu hình không thay đổi quyền truy cập của Sites.

Các vai trò: admin, editor, researcher, contributor, visitor. Mọi thao tác ghi đều
kiểm tra danh tính và vai trò ở server. Researcher sửa nháp/metadata; editor duyệt
chứng minh, bài và hành trình; admin phân quyền. Đóng góp và sổ tay gắn với user ID.
API ghi kiểm tra cùng origin, giới hạn body 70 KB, trường nhập có độ dài tối đa và
truy vấn tham số hóa. Đóng góp tối đa 5 mục/giờ/tài khoản. Không render HTML người
nhập; nội dung bài là văn bản thuần với tiêu đề ## và các đoạn.

## Dữ liệu và công bố

Lần đọc đầu, server nhập metadata theo SHA-256 đã xác nhận từ
lib/research-seed.json: 20 nguồn, 40 hồ sơ nháp và 40 liên kết đầu mối. Có 3 ý tưởng
hành trình nháp, chưa có chặng hoặc tuyến được xác minh. Seed nằm ở module server,
không nằm trong public/. Dữ liệu runtime đọc từ D1, không đọc mảng seed để giả CMS.

Không đồng bộ ghi hai chiều với kho SQLite. Metadata là snapshot ban đầu; biên tập
trên D1 được lưu riêng. ETL Cần Thơ và OSM vẫn vận hành tại thư mục cha; cần bước
đối chiếu/nhập có kiểm soát trước khi đưa kết quả mới vào CMS.

Công bố cần: phân loại phù hợp, nội dung có quyền lưu, mọi liên kết đã chuyển thành
chứng minh cụ thể được duyệt, quyền công bố có căn cứ, phiên bản được duyệt đúng
hiện tại và vị trí được đối chiếu nếu có. Catalog không chứng minh toàn văn sách.
Sửa bài, nguồn hay chứng minh làm mất duyệt. Nhập metadata không công bố bài.

Bản đồ dùng iframe OpenStreetMap, giữ attribution và chỉ gắn marker cho bài đã
công bố có tọa độ được duyệt. Khung nhìn không xác nhận địa giới hành chính. Tour
thực địa không được công bố khi thiếu vị trí đã đối chiếu. Không có giờ, giá vé,
khoảng cách hoặc thời lượng tự suy đoán.

## Kiểm tra

```powershell
npx tsc --noEmit
npm run lint
node --experimental-strip-types --test tests/domain.test.mjs
python -m unittest discover -s tests -p 'test_*.py' -v
npm run build
```

Kết quả đợt xây dựng: 5 kiểm tra logic miền, 8 kiểm tra schema/chốt công bố và 40
kiểm tra HTTP/API đạt. Test HTTP đã dùng fixture gắn nhãn Dữ liệu minh họa trên
D1 local rồi dọn trước khi áp dụng migration log append-only. Không chạy lại
integration.py vào kho đang có dữ liệu cần giữ hoặc hosted Site; dùng một bản
local disposable mới, trước migration append-only như mô tả trong file test.
Đợt nâng cấp ba chuyên mục có kiểm tra bằng Edge headless tại local, gồm ảnh chụp
desktop/mobile, tìm kiếm, bộ lọc, trang chi tiết, giấy phép và luồng duyệt thủ công.
Xem báo cáo [nâng cấp chuyên mục](docs/collections-release.md).

## Tính năng còn thiếu hoặc chờ dữ liệu

- Đã chuẩn bị 11 hồ sơ có nguồn tại /quan-tri/ban-thao (4 địa danh/không gian,
  2 phong tục, 5 mục từ). Chủ sở hữu đã phê duyệt và công bố đúng 11 bài cùng
  3 hành trình đọc vào ngày 27/10/2026. Biên tập tiếp tục qua CMS; mỗi thay đổi
  làm mất duyệt. Không có cơ chế tự công bố khi mở trang.
- Đã có 3 hành trình đọc từ xa. Chưa có tuyến thực địa được đối chiếu tọa độ.
- Đã tích hợp 4 ảnh Wikimedia Commons có hồ sơ tác giả, giấy phép và thay đổi,
  cùng font Noto tự lưu trữ với giấy phép OFL. Chưa nhận upload ảnh/audio/video;
  chưa có bản ghi phát âm được cấp quyền. Không tạo âm thanh giả làm tư liệu.
- AI chưa cấu hình; trang hỏi đáp dùng tìm kiếm truyền thống, không trả câu trả lời giả.
- Chưa có xử lý dị bản chuyên biệt, timeline địa giới, vector search hoặc đồng bộ
  ETL tự động. Mô hình nguồn, quan hệ và cổng quyền đã có để mở rộng.
- Chưa có dịch vụ sao lưu/takedown/CDN vận hành tự động. Cần quy trình vận hành
  trước khi mở cho cộng đồng rộng hơn.

Không tuyên bố toàn bộ tiêu chuẩn MVP trong MASTER PROMPT đã đạt khi chưa có
nội dung và tour thật được kiểm chứng.
