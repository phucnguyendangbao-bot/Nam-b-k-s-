# Lời dẫn hành trình — 02/11/2026

Yêu cầu: “các câu quote còn sơ sài, dẫn truyện hay hơn”. Phạm vi là giọng dẫn và mạch kể của chế độ hành trình.

## Thay đổi

- Viết lời mở cho trang hành trình, 14 bộ lời dẫn cho 12 tuyến đọc và 2 tour ảnh/bản đồ; mỗi bộ có câu gợi mở, đoạn vào chuyến, các câu nối và lời khép tuyến.
- Có lời vào chặng riêng cho toàn bộ các điểm đang dùng trong các tuyến. `lib/journey-narrative.ts` quản lý 47 khóa nội dung/địa điểm, trong đó nhà cổ Bình Thủy có cùng đoạn dẫn ở tour ảnh và hồ sơ đọc.
- Câu chuyển viết theo thứ tự cụ thể của từng tuyến: từ đình sang chùa là mạch chuyện làng–học hành; từ nhà Cai Cường sang Mang Thít là mạch vật liệu–người làm nghề; từ Trà Sư sang Óc Eo là đổi góc đọc từ mùa nước sang dấu vết khảo cổ.
- Card hành trình có câu gợi mở thay cho phần mô tả chủ yếu liệt kê. Trong tuyến đọc, lời dẫn đứng trước tóm tắt tư liệu; đoạn nối nằm cạnh phần chuyển chặng. Tour ảnh có lời vào tuyến, vào chặng và lời kết tương ứng.
- `JourneyWords` trình bày lời biên soạn bằng typography riêng, ghi rõ “Lời dẫn · Nam Bộ Ký Sự”. Các đoạn không được gán cho nhân vật lịch sử, người dân, ca dao hoặc tài liệu nguồn.

Văn bản tư liệu, nguồn, các gói duyệt/hash, nhãn nháp, ảnh, tọa độ và bản thu/cue thuyết minh giữ nguyên. Lời dẫn mới là phần đọc trên giao diện, tách khỏi bản thuyết minh tư liệu đã thu. Không thêm dữ kiện niên đại, danh hiệu hoặc giờ tham quan.

## Kiểm tra

- Kiểm tra bốn gói nội dung và 55/55 test đạt.
- TypeScript đạt; lint các tệp sửa không lỗi, còn ba cảnh báo ref cleanup đã có ở tour-player.
- Chrome headless kiểm tra toàn bộ 12 tuyến đọc và 2 tour ảnh: lời vào, chuyển mọi chặng, câu nối và kết đúng tuyến, nguồn tư liệu vẫn có, không lỗi JavaScript và không tràn ngang ở 390 px.
- Ảnh kiểm tra desktop/mobile nằm trong `outputs/journey-narrative/`, script QA tạm trong `work/`; cả hai được Git và Vercel bỏ qua.

## Tệp

Giọng kể tập trung trong `lib/journey-narrative.ts`; khối trình bày ở `components/journey-words.tsx`. Các trang và trình phát chỉ chọn đúng đoạn theo ID nội dung hoặc điểm dừng, giữ cơ chế điều hướng, lưu tiến độ và phát âm thanh hiện có.

## Production

Build production trên máy và trên Vercel đều đạt. Deployment `dpl_D4iaXrVaBmiLWt4zgJaeCXnwTuG8` ở trạng thái READY, alias https://nam-bo-ky-su.vercel.app. Deploy trực tiếp working tree lên dự án `nam-bo-ky-su`, không dùng ChatGPT Sites, không commit/push trong đợt này.

Kiểm tra Chrome đã chạy lại thành công trên alias công khai cho toàn bộ 14 tuyến: lời mở, mọi đoạn dẫn, câu nối, lời kết và tư liệu đúng như bản đã kiểm tra; không lỗi JavaScript, không tràn ngang trên điện thoại. Server preview của tác vụ đã được dừng.
