# Tổng Quan Hệ Thống FIDO2 Passkey - Tài Liệu Kinh Doanh

## Thông Tin Tài Liệu
- **Phiên bản:** 1.0
- **Cập nhật:** 2025-12-29
- **Tác giả:** Business Analyst
- **Dự án:** Hệ Thống Xác Thực FIDO2 Passkey

---

## 1. Tóm Tắt Điều Hành

Hệ Thống FIDO2 Passkey là giải pháp xác thực hiện đại loại bỏ mật khẩu sử dụng tiêu chuẩn WebAuthn. Hệ thống cung cấp nhiều phương thức xác thực bao gồm đăng nhập bằng mật khẩu, xác thực bằng passkey, và đăng nhập không cần username.

### Lợi Ích Chính
- **Trải Nghiệm Không Mật Khẩu:** Người dùng xác thực mà không cần nhớ mật khẩu
- **Bảo Mật Cao Hơn:** Xác thực chống phishing bằng mật mã hóa khóa công khai
- **Hỗ Trợ Đa Thiết Bị:** Đăng ký passkey trên thiết bị di động qua mã QR
- **Nhiều Phương Thức Đăng Nhập:** Linh hoạt cho các trường hợp sử dụng khác nhau

---

## 2. Mục Tiêu Kinh Doanh

### Mục Tiêu Chính
1. **Loại Bỏ Rủi Ro Mật Khẩu**
   - Loại bỏ lỗ hổng bảo mật liên quan đến mật khẩu
   - Loại bỏ chi phí reset mật khẩu
   - Giảm thể lượng ticket hỗ trợ

2. **Cải Thiện Trải Nghiệm Người Dùng**
   - Đơn giản hóa quy trình đăng nhập
   - Giảm ma sát trong xác thực
   - Hỗ trợ nhiều nền tảng và thiết bị

3. **Đảm Bảo Tuân Thủ Quy Định**
   - Triển khai xác thực chống phishing
   - Đáp ứng tiêu chuẩn bảo mật hiện đại (FIDO2, WebAuthn)
   - Hỗ trợ GDPR và PSD2

### Chỉ Số Thành Công
- **Bảo Mật:** Giảm 99.9% vi phạm liên quan đến mật khẩu
- **Trải Nghiệm:** Nhanh hơn 50% so với mật khẩu
- **Độ Phổ Biến:** 80% người dùng đăng ký ít nhất 1 passkey
- **Hỗ Trợ:** Giảm 70% ticket reset mật khẩu

---

## 3. Các Tính Năng Chính

### 3.1 Đăng Nhập Bằng Mật Khẩu (Legacy)

**Trường Hợp Sử Dụng:** Đăng nhập lần đầu hoặc phương án dự phòng

**Quy Tắc Kinh Doanh:**
- Độ dài tối thiểu: 6 ký tự
- Lưu trữ: Bcrypt hashing
- Phiên làm việc: Hết hạn sau 24 giờ
- Mặc định: `user / user`

**Giới Hạn:**
- Dễ bị tấn công phishing
- Cần cơ chế reset mật khẩu
- Điểm UX thấp hơn

---

### 3.2 Đăng Ký Passkey (Trực Tiếp Trên Thiết Bị)

**Trường Hợp Sử Dụng:** Người dùng muốn đăng ký passkey trên thiết bị đang sử dụng

**Quy Tắc Kinh Doanh:**
- Người dùng phải xác thực trước (mật khẩu hoặc passkey已有)
- Display name là bắt buộc để xác định thiết bị
- Có thể đăng ký nhiều passkey cho mỗi người dùng
- Mỗi passkey có credential ID duy nhất

**Trải Nghiệm Người Dùng:**
1. Người dùng đã đăng nhập
2. Điều hướng đến "Quản lý Passkeys"
3. Nhập display name (ví dụ: "MacBook Pro Touch ID")
4. Browser hiển thị prompt sinh trắc học
5. Passkey được đăng ký trong < 5 giây

---

### 3.3 Đăng Ký Passkey Thông Qua Mã QR (Cross-Device)

**Trường Hợp Sử Dụng:** Người dùng muốn đăng ký passkey trên điện thoại khi đang dùng máy tính

**Quy Tắc Kinh Doanh:**
- Người dùng phải xác thực trên thiết bị chính
- Mã QR hết hạn sau 5 phút
- Cập nhật trạng thái real-time qua WebSocket
- Thiết bị di động phải hỗ trợ WebAuthn

**Trải Nghiệm Người Dùng:**
1. Người dùng đã đăng nhập trên máy tính
2. Click "Generate QR Code"
3. Quét mã QR với điện thoại
4. Theo prompt đăng ký trên điện thoại
5. Máy tính hiển thị "Passkey registered successfully" real-time

**Lợi Ích:**
- Đăng ký passkey trên nhiều thiết bị dễ dàng
- Không cần chuyển thiết bị vật lý
- Hỗ trợ hệ sinh thái thiết bị hỗn tạp

---

### 3.4 Đăng Nhập Bằng Passkey (Có Username)

**Trường Hợp Sử Dụng:** Người dùng biết username và muốn dùng passkey

**Quy Tắc Kinh Doanh:**
- Username là bắt buộc
- Bất kỳ passkey đã đăng ký nào cũng có thể dùng
- Prompt sinh trắc học hiển thị tự động
- Có thể fallback về đăng nhập bằng mật khẩu

**Trải Nghiệm Người Dùng:**
1. Người dùng nhập username
2. Click "Login with Passkey"
3. Browser/Thiết bị hiển thị prompt sinh trắc học
4. Người dùng xác thực (Face ID, Touch ID, v.v.)
5. Đăng nhập thành công

---

### 3.5 Đăng Nhập Passkey Không Cần Username (Usernameless)

**Trường Hợp Sử Dụng:** Người dùng không nhớ username nhưng có passkey đã đăng ký

**Quy Tắc Kinh Doanh:**
- Không cần username
- Hệ thống truy vấn tất cả passkey đã đăng ký
- Tự động xác định người dùng từ passkey
- Chỉ hoạt động khi người dùng đã đăng ký ít nhất 1 passkey

**Trải Nghiệm Người Dùng:**
1. Người dùng click "Login with Passkey (No Username)"
2. Browser hiển thị passkey có sẵn
3. Người dùng chọn passkey và xác thực
4. Hệ thống chào đón người dùng bằng tên
5. Đăng nhập thành công

**Lợi Ích:**
- Tiện lợi tối đa - không cần nhớ gì
- Nhanh hơn bất kỳ phương thức nào khác
- Loại bỏ vấn đề quên username

---

## 4. Persona Người Dùng

### Persona 1: Người Dùng Chính
- **Tên:** Nguyễn Văn A
- **Độ tuổi:** 28-45
- **Mức độ công nghệ:** Trung bình đến Cao
- **Thiết bị:** Smartphone, laptop, máy tính bảng
- **Mục tiêu:** Truy cập an toàn, nhanh trên nhiều thiết bị
- **Vấn đề:** Quên mật khẩu, gõ mật khẩu phức tạp trên di động

---

### Persona 2: Người Dùng Quan Tâm Bảo Mật
- **Tên:** Trần Văn B
- **Độ tuổi:** 35-55
- **Mức độ công nghệ:** Cao
- **Thiết bị:** Desktop, security key vật lý
- **Mục tiêu:** Bảo mật tối đa, chống phishing
- **Vấn đề:** Lo ngại về vi phạm dữ liệu, tấn công phishing

---

### Persona 3: Người Dùng Tối Giản
- **Tên:** Lê Văn C
- **Độ tuổi:** 18-30
- **Mức độ công nghệ:** Thấp đến Trung bình
- **Thiết bị:** Một smartphone
- **Mục tiêu:** Trải nghiệm đơn giản nhất có thể
- **Vấn đề:** Thấy mật khẩu phiền phức, ghét gõ trên di động

---

## 5. Giá Trị Kinh Doanh

### Lợi Ích Định Lượng

#### Cải Tiến Bảo Mật
| Chỉ Số | Trước | Sau | Cải Thiện |
|--------|-------|-----|-----------|
| Tỷ lệ phishing thành công | 15% | <1% | Giảm 93% |
| Chiếm đoạt tài khoản | 2.5% | <0.1% | Giảm 96% |
| Ticket reset mật khẩu | 1000/tháng | 50/tháng | Giảm 95% |
| Thời gian đăng nhập trung bình | 12 giây | 3 giây | Nhanh hơn 75% |

#### Tiết Kiệm Chi Phí
- **Chi phí reset mật khẩu:** $15/ticket → Tiết kiệm hàng năm: $171,000
- **Giờ hỗ trợ:** 200 giờ/tháng → 30 giờ/tháng
- **Sự cố bảo mật:** 50 sự cố/năm → 2 sự cố/năm
- **Năng suất người dùng:** Tiết kiệm 5 phút/ngày → 21 giờ/năm

### Lợi Ích Định Tính

#### Trải Nghiệm Người Dùng
- **Xác Thực Không Ma Sát:** Không gõ mật khẩu, không cần password manager
- **Nhất Quán Trên Các Thiết Bị:** Trải nghiệm giống nhau trên tất cả thiết bị
- **Giảm Nhận Thức Cogni:** Không cần nhớ gì
- **Tăng Niềm Tin:** Người dùng cảm thấy an toàn hơn

#### Lợi Ích Kinh Doanh
- **Khác Biạnh Cạnh:** Trải nghiệm xác thực hiện đại
- **Uy Tín Thương Hiệu:** Cam kết về bảo mật và đổi mới
- **Tuân Thủ Quy Định:** Đáp ứng tiêu chuẩn bảo mật mới nổi
- **Tương Lai:** Sẵn sàng cho tương lai không mật khẩu

---

## 6. Đánh Giá Rủi Ro

### Rủi Ro Kỹ Thuật
| Rủi Ro | Tác Động | Xác Suất | Giảm Thiểu |
|--------|----------|-----------|------------|
| Vấn đề tương thích thiết bị | Trung bình | Thấp | Nhiều phương thức xác thực, fallback mật khẩu |
| Giới hạn browser hỗ trợ | Trung bình | Thấp | Progressive enhancement, giáo dục người dùng |
| Mất thiết bị | Cao | Trung bình | Nhiều passkey mỗi người dùng, khôi phục tài khoản |
| Yêu cầu SSL certificate | Cao | Trung bình | Tài liệu triển khai rõ ràng |

### Rủi Ro Kinh Doanh
| Rủi Ro | Tác Động | Xác Suất | Giảm Thiểu |
|--------|----------|-----------|------------|
| Kháng cự người dùng | Trung bình | Trung bình | Triển khai dần, khuyến khích, giáo dục |
| Khoảng trống tuân thủ quy định | Cao | Thấp | Xem xét pháp lý, tuân thủ FIDO2 |
| Đội ngũ hỗ trợ thiếu kiến thức | Trung bình | Cao | Đào tạo, tài liệu toàn diện |

---

## 7. Tiêu Chí Thành Công

### Giai Đoạn 1 (MVP - Hiện Tại)
- ✅ Đăng nhập bằng mật khẩu hoạt động
- ✅ Đăng ký passkey trực tiếp trên thiết bị
- ✅ Đăng nhập bằng passkey có username
- ✅ Quản lý người dùng cơ bản
- ✅ Luồng đăng ký qua mã QR
- ✅ Đăng nhập không cần username

### Giai Đoạn 2 (Nâng Cấp)
- ⬜ Luồng khôi phục tài khoản
- ⬜ Cải thiện UI quản lý passkey
- ⬜ Dashboard analytics và monitoring
- ⬜ Quản lý người dùng admin
- ⬜ Audit logging

### Giai Đoạn 3 (Sản Xuất)
- ⬜ Thiết lập HTTPS/SSL tự động
- ⬜ Giới hạn tốc độ và bảo vệ brute force
- ⬜ Tùy chọn MFA
- ⬜ Mã khôi phục/backup
- ⬜ Tích hợp SSO doanh nghiệp

---

## 8. Bảng Chú Giải Thuật Ngữ

- **Passkey:** Credential FIDO2 thay thế mật khẩu, lưu trữ trên thiết bị người dùng
- **WebAuthn:** Web Authentication API, tiêu chuẩn cơ bản của FIDO2
- **FIDO2:** Fast Identity Online 2.0, tiêu chuẩn công nghiệp cho xác thực không mật khẩu
- **Usernameless Authentication:** Đăng nhập không cần nhập username
- **Cross-Device Registration:** Đăng ký passkey trên thiết bị này khi dùng thiết bị khác
- **Xác Thực Sinh Trắc Học:** Dùng vân tay, nhận diện khuôn mặt, v.v.
- **Credential ID:** Định danh duy nhất cho passkey
- **Relying Party (RP):** Server/application yêu cầu xác thực
- **Authenticator:** Thiết bị/phương thức lưu passkey (iPhone, Windows Hello, v.v.)

---

*Tài liệu được chuẩn bị bởi đội ngũ Business Analyst. Để biết chi tiết triển khai, xem Tài Liệu Kỹ Thuật.*
