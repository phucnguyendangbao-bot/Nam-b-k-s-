# Làm dày 11 hồ sơ hiện có — 02/11/2026

Phạm vi từ yêu cầu trong chat “cập nhật thêm thông tin nội dung”, được người dùng chọn rõ “Làm dày các hồ sơ hiện có”. Gói này bổ sung nội dung cho 11 hồ sơ ngắn của đợt 01/11; không thực hiện các chỉ dẫn khác trong tài liệu đính kèm như một yêu cầu mới.

## Nội dung

| Hồ sơ | Phần đọc bổ sung |
| --- | --- |
| Trà Sư | Nước theo mùa, nơi cá trú, mạng kênh và sinh kế quanh rừng |
| U Minh Thượng | Phục hồi sau cháy, vùng đệm và cách đọc rừng trên nền than bùn |
| Óc Eo – Ba Thê | Nhóm hiện vật, phân biệt khai quật và công bố báo cáo, câu hỏi về chứng cứ |
| Văn Thánh Miếu Vĩnh Long | Trục kiến trúc, sách và thờ tự, các lớp xây dựng |
| Gia Định thành thông chí | Cách dùng mục lục sáu quyển và giới hạn của nguồn giới thiệu thứ cấp |
| Chợ nổi Ngã Bảy | Đường hàng, đồ nghề và ký ức nghệ thuật |
| Mang Thít | Lời kể người làm nghề, kinh tế lò nung và bảo tồn |
| Chùa Dơi | Mái, cột, cây xanh và các mốc phục hồi khác nhau giữa nguồn |
| Vía Bà Chúa Xứ | Học qua thực hành, vai trò gia đình và cộng đồng bảo vệ di sản |
| Dạ cổ hoài lang | Nhịp thức, người diễn và cách tách các lớp tư liệu |
| Nhà cổ Cai Cường | Mặt tiền, thờ tự, vật liệu và những lớp sử dụng |

Thêm 33 mục: 22 mục tư liệu, 11 ghi chú biên tập gợi hướng đọc liên quan. Nội dung thân bài tăng từ 1.634 lên 4.489 đơn vị tách theo khoảng trắng (có tính tiêu đề); từng hồ sơ đều dài hơn gấp đôi. Các câu trả lời có nguồn được bổ sung theo mức supported/partial, các câu chưa giải quyết được giữ unknown với câu hỏi cụ thể. Lĩnh vực phụ giúp các hồ sơ xuất hiện trong chuyên đề và gợi ý đọc liên quan sẵn có.

## Nguồn và phạm vi đối chiếu

Gói có 17 nguồn, 47 nhận định với vị trí đối chiếu. Bốn nguồn thêm:

- [TTXVN đăng lại trên cổng Ủy ban Nhà nước về người Việt Nam ở nước ngoài](https://scov.gov.vn/dat-nuoc-con-nguoi/kham-pha-rung-tram-dat-than-bun-tai-vuon-quoc-gia-u-minh-thuong.html).
- [Báo cáo sơ bộ Louis Malleret trên Persée](https://www.persee.fr/doc/befeo_0336-1519_1951_num_45_1_5512): chỉ đọc thông tin xuất bản và đoạn mở đầu, không nhận đã đọc toàn báo cáo.
- [VietNamNet về Chùa Dơi](https://vietnamnet.vn/ngoi-chua-co-o-soc-trang-noi-tieng-voi-loai-doi-khong-lo-heo-5-mong-2412529.html): dùng các đoạn kiến trúc và phục dựng, không dùng chuyện linh dị hay lời kể làm kết quả điều tra động vật.
- [Thông báo Cục Di sản văn hóa về lễ Vía Bà Chúa Xứ](https://dsvh.gov.vn/di-san-le-hoi-via-ba-chua-xu-nui-sam-duoc-unesco-ghi-danh-vao-danh-sach-di-san-van-hoa-phi-vat-the-dai-dien-cua-nhan-loai-22193).

Các đoạn Ramsar và UNESCO giữ theo phần đã đối chiếu trong gói trước; lần tải lại 02/11 gặp lỗi máy chủ hoặc trang kiểm tra truy cập. Lý do ghi trong metadata nguồn, nội dung làm dày dùng nguồn mới đọc được. Không suy thêm dữ kiện từ phần chưa tải lại.

Vẫn giữ khác biệt về bia số 1 ở Văn Thánh Miếu, năm sáng tác Dạ cổ hoài lang và mốc phục chế/khánh thành Chùa Dơi. Không biến năm xuất bản, năm ghi danh hoặc định hướng dự án thành niên đại của đối tượng hay kết quả đã hoàn thành. Tư liệu có tuổi được ghi rõ năm, không dùng như thông báo hoạt động hiện hành.

## Tích hợp

`data/release/published-2026-11-02-enrichment.json` và bản quyết định cùng tên ngày khóa byte tệp và payload. Bản ghi kiểm tra do Codex lập trong phạm vi yêu cầu của chủ dự án; không nhận là phê duyệt học thuật từ bên thứ ba. Gói nằm sau supplement trong bộ nạp và trình kiểm tra, thay đúng 11 ID, giữ slug, chương và ảnh. Các gói duyệt trước không bị ghi lại.

Không thêm hồ sơ, mục từ, ảnh, âm thanh, sự kiện, tọa độ hoặc hành trình. Ba mục từ chưa đủ nguồn vẫn là nháp. Các thay đổi hành trình từ đợt trước được giữ nguyên.

## Kiểm tra

- `npm run release:validate`: cả bốn lớp nội dung hợp lệ.
- `node --test tests/*.test.mjs`: 55/55 đạt, gồm ba kiểm tra mới về giữ ID/slug, bằng chứng và các giới hạn chưa được giải quyết.
- `npm run typecheck`: đạt.
- `npm run lint`: không lỗi; còn 5 cảnh báo trong mã từ đợt trước ở `app/[...segments]/page.tsx` và `components/interactive/tour-player.tsx`.
- `npm run build:vercel`: đạt khi chạy ngoài sandbox. Lần trong sandbox gặp EPERM tạo `.next/server/app/_global-error.segments/_global-error`; không sửa mã để né lỗi quyền này.
- Bản production trên loopback: HTTP 200 cho 11 hồ sơ, trang hành trình, hai hành trình đọc và kho tri thức. Kiểm tra đủ sáu tiêu đề mục, câu trả lời liên quan và ID nguồn dẫn trên mỗi trang hồ sơ. Server tạm đã dừng.

## Production

Đã deploy production lên đúng dự án Vercel `nam-bo-ky-su` theo yêu cầu tiếp theo của chủ dự án. Deployment `dpl_pniXacAV9buTX3gRU8gTmxAweyMi` có trạng thái READY, alias https://nam-bo-ky-su.vercel.app. Không dùng ChatGPT Sites.

Vercel build và kiểm tra nguồn thành công. Đã kiểm tra trực tiếp alias công khai: cả 11 hồ sơ có đủ sáu mục, câu trả lời và nguồn dẫn của gói làm dày; tổng cộng 17 đường dẫn trả HTTP 200, gồm trang chủ, hành trình, hai hành trình đọc, kho tri thức và `/ho-so/kenh-vinh-te-1819-1824`.

Thêm `.vercelignore` để loại trừ `.env*`, `.dev.vars*`, thư mục build, công cụ và báo cáo cục bộ khỏi upload. Dry run xác nhận không còn tệp thuộc các nhóm bị loại, vẫn có gói nội dung mới. Deploy trực tiếp từ working tree; mã nguồn chưa commit hoặc push GitHub trong đợt này.
