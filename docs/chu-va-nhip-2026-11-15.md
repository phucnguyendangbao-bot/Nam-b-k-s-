# Chữ và nhịp chuyển động: một nguồn duy nhất (15/11/2026)

## Chữ
Ba họ chữ, ba vai. Luật cuối nằm trong `app/design/type.css` (nạp sau cùng); biến font chỉ khai báo trong `tokens.css`.

| Vai | Họ chữ | Dùng cho |
|---|---|---|
| `--f-script` | Charm 700 | h1 mọi trang, h2 của mục lớn trong nội dung chính, tiêu đề chương, intro |
| `--f-display` / `--f-read` | Newsreader 400/600 | h3, h4, tên thẻ, tên chương trong mục lục, chữ đọc, trích dẫn, mục từ đứng một mình |
| `--f-ui` | Be Vietnam Pro | menu, nút, nhãn, chú thích, số liệu, chân trang |

- Hai cỡ nhãn: nhãn mục 14px (`.eyebrow`, `.sx-eyebrow`, `.journey-eyebrow`…), nhãn thẻ 12px (`.nb-story-kicker`, `.epistemic-label`…). Không viết hoa toàn bộ, không giãn chữ; các chuỗi viết hoa trong trang Hành trình đã đổi về chữ thường.
- Đã bỏ Noto Serif (6 khai báo @font-face): Newsreader thay cho chữ đọc. Đã bỏ các chỗ `heritage.css` ghi đè biến font.
- Không đặt `font-family` riêng ở file khác; cần kiểu mới thì thêm vai vào `type.css`.

## Nhịp chuyển động
Biến trong `tokens.css` là nguồn duy nhất (bỏ dòng ghi đè trong `heritage.css`):

| Biến | Giá trị | Dùng cho |
|---|---|---|
| `--d-press` | 90ms | phản hồi chạm |
| `--d-hover` | 200ms | hover nhỏ |
| `--d-ui` | 280ms | đổi trạng thái, hover thẻ |
| `--d-reveal` | 800ms | nội dung hiện khi cuộn, chuyển trang |
| `--d-scene` | 1800ms | ảnh nền lắng, cảnh mở đầu |
| `--ease` / `--ease-out` / `--ease-in` / `--ease-scene` | | đổi tại chỗ / vào cảnh / ra / màn kéo |
| `--stagger` 70ms, tối đa 6 nhịp | | các phần tử cùng nhóm hiện nối nhau |
| `--m-rise` 14px | | quãng trượt khi hiện |

- 133 thời lượng và 43 đường cong viết tay trong 13 file CSS đã đổi về biến (thời lượng gần nhất). Vòng lặp dài (sóng, ghe trôi, >2,4s) giữ nguyên.
- Mọi khối hiện khi cuộn trượt cùng một quãng (`--m-rise`), nối nhau cùng nhịp (`--stagger`, tối đa 6).
- Hover thẻ: nhấc lên nhanh (`--d-ui`) ngay trên `:hover`, rời ra thì lắng chậm; không làm mất nhịp hiện nối nhau.
