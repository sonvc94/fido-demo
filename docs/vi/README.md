# Hệ Thống Xác Thực FIDO2 Passkey - Tài Liệu

## 📚 Tổng Quan Tài Liệu

Thư mục này chứa tài liệu chi tiết cho Hệ Thống Xác Thực FIDO2 Passkey, bao gồm cả góc độ Chuyên viên Phân tích Nghiệp vụ (BA) và Kỹ thuật.

---

## 📂 Cấu Trúc Thư Mục

```
docs/
├── README.md                       # Tài liệu tiếng Anh
├── vi/                             # Tài liệu tiếng Việt
│   ├── README.md                   # File index - tài liệu tiếng Việt
│   ├── ba/                         # Tài liệu BA tiếng Việt
│   │   ├── tong-quan.md            # Tổng quan & mục tiêu kinh doanh
│   │   ├── luong-dang-nhap.md      # Quy trình đăng nhập chi tiết
│   │   └── dang-ky-passkey.md      # Quy trình đăng ký passkey
│   ├── technical/                  # Tài liệu kỹ thuật tiếng Việt
│   │   ├── kien-truc.md            # Kiến trúc hệ thống & thiết kế
│   │   └── api-endpoints.md         # Tham chiếu API hoàn chỉnh
│   └── diagrams/                   # Sơ đồ Mermaid
│       └── tat-ca-so-do.md         # Tất cả sơ đồ hệ thống (20+ sơ đồ)
└── ... (tài liệu tiếng Anh)
```

---

## 🎯 Điều Hướng Nhanh

### Đối Với Các Nhà Quản Lý & Stakeholder

1. **[Tổng Quan Kinh Doanh](vi/ba/tong-quan.md)** ⭐ Bắt Đầu Từ Đây
   - Tóm tắt điều hành
   - Mục tiêu kinh doanh và KPI
   - Nhân vật người dùng và trường hợp sử dụng
   - Tiêu chí thành công và lộ trình

2. **[Quy Trình Đăng Nhập](vi/ba/luong-dang-nhap.md)**
   - Xác thực bằng mật khẩu
   - Đăng nhập bằng passkey (có username)
   - Đăng nhập không cần username (usernameless)
   - So sánh các phương thức và xử lý lỗi

3. **[Đăng Ký Passkey](vi/ba/dang-ky-passkey.md)**
   - Đăng ký trực tiếp trên thiết bị
   - Đăng ký qua mã QR (cross-device)
   - Quản lý passkey

### Đối Với Đội Ngũ Kỹ Thuật

1. **[Kiến Trúc Hệ Thống](vi/technical/kien-truc.md)** ⭐ Bắt Đầu Từ Đây
   - Stack công nghệ
   - Chi tiết các thành phần
   - Luồng dữ liệu
   - Kiến trúc bảo mật
   - Cân nhắc về khả năng mở rộng

2. **[API Endpoints](vi/technical/api-endpoints.md)**
   - Tham chiếu API hoàn chỉnh
   - Ví dụ request/response
   - Mã lỗi
   - Ví dụ kiểm thử
   - Tài liệu OpenAPI/Swagger

3. **[Sơ Đồ Hệ Thống](vi/diagrams/tat-ca-so-do.md)**
   - Sơ đồ kiến trúc
   - Sơ đồ chuỗi (sequence) cho các luồng
   - Sơ đồ cơ sở dữ liệu
   - Sơ đồ mạng
   - Sơ đồ trạng thái
   - Sơ đồ triển khai

---

## 📖 Hướng Dẫn Đọc

### Mới Bắt Đầu Với Dự Án?

1. Bắt đầu với **[Tổng Quan BA](vi/ba/tong-quan.md)** để hiểu mục tiêu kinh doanh
2. Xem **[Luồng Đăng Nhập](vi/ba/luong-dang-nhap.md)** để hiểu hành trình người dùng
3. Kiểm tra **[Kiến Trúc Kỹ Thuật](vi/technical/kien-truc.md)** để hiểu thiết kế hệ thống
4. Khám phá **[Sơ Đồ](vi/diagrams/tat-ca-so-do.md)** để hiểu trực quan

### Triển Khai Một Tính Năng?

1. Đọc **[Tài liệu BA tiếng Việt](vi/ba/)** để hiểu yêu cầu
2. Xem **[API Endpoints](vi/technical/api-endpoints.md)** để hiểu điểm tích hợp
3. Kiểm tra **[Kiến Trúc](vi/technical/kien-truc.md)** để xem cân nhắc thiết kế
4. Tham khảo **[Sơ Đồ](vi/diagrams/tat-ca-so-do.md)** để trực quan hóa luồng

### Triển Khai Ra Production?

1. Xem **[Kiến Trúc Bảo Mật](vi/technical/kien-truc.md#kien-truc-bao-mat)**
2. Kiểm tra **[Kiến Trúc Triển Khai](vi/technical/kien-truc.md#kien-truc-trien-khai)**
3. Xem **[Cấu Hình Môi Trường](../../.env.example)** cấu hình
4. Theo **[Giới Hạn Tốc Độ](vi/technical/api-endpoints.md#gioi-han-toc-do)** hướng dẫn

---

## 🔑 Các Khái Niệm Chính

### Phương Thức Xác Thực

| Phương Thức | Mô Tả | Tài Liệu |
|-------------|-------|----------|
| **Mật khẩu** | Username/password truyền thống | [Đăng Nhập → Mật khẩu](vi/ba/luong-dang-nhap.md#1-dang-nhap-bang-mat-khau) |
| **Passkey + Username** | Không mật khẩu, có username | [Đăng Nhập → Passkey](vi/ba/luong-dang-nhap.md#2-dang-nhap-bang-passkey-co-username) |
| **Không Username** | Xác thực không cần nhập gì | [Đăng Nhập → Usernameless](vi/ba/luong-dang-nhap.md#3-dang-nhap-khong-can-username) |

### Phương Thức Đăng Ký

| Phương Thức | Mô Tả | Tài Liệu |
|-------------|-------|----------|
| **Trực Tiếp** | Đăng ký trên thiết bị hiện tại | [Đăng Ký → Trực Tiếp](vi/ba/dang-ky-passkey.md#1-dang-ky-passkey-truc-tiep-tren-thiet-bi) |
| **Mã QR** | Đăng ký trên thiết bị khác | [Đăng Ký → Mã QR](vi/ba/dang-ky-passkey.md#2-dang-ky-passkey-qua-ma-qr-cross-device) |

---

## 📊 Chỉ Số & KPI

### Chỉ Số Kinh Doanh (từ tài liệu BA)

- **Tỷ Lệ Đăng Ký Passkey:** 80% người dùng đăng ký ít nhất 1 passkey
- **Tỷ Lệ Sử Dụng Passkey:** 70% lần đăng nhập dùng passkey (không mật khẩu)
- **Tỷ Lệ Thành Công Đăng Nhập:** >98% cho passkey, >95% cho mật khẩu
- **Thời Gian Đăng Nhập Trung Bình:** <3 giây cho passkey, <10 giây cho mật khẩu
- **Giảm Ticket Hỗ Trợ:** Giảm 95% ticket reset mật khẩu

### Chỉ Số Kỹ Thuật (từ tài liệu Technical)

- **Thời Gian Phản Hồi API:** p50 <100ms, p95 <500ms
- **Thời Gian Đăng Ký:** <10 giây (trực tiếp), <60 giây (mã QR)
- **Tỷ Lệ Lỗi:** <2% cho tất cả endpoints
- **Mục Tiêu Uptime:** 99.9% khả dụng

---

## 🛠️ Stack Công Nghệ

### Frontend
- **React 18** - Framework UI
- **WebAuthn API** - Xác thực native trên browser
- **Nginx** - Web server & reverse proxy
- **Docker** - Containerization

### Backend
- **Python 3.11** - Runtime
- **FastAPI** - Web framework
- **py_webauthn** - Thư viện FIDO2/WebAuthn
- **SQLite** - Database (phát triển)
- **PostgreSQL** - Database (khuyến nghị production)

### Infrastructure
- **Docker Compose** - Điều phối multi-container
- **WebSocket** - Giao tiếp thời gian thực
- **JWT** - Xác thực không trạng thái

---

## 🔐 Tính Năng Bảo Mật

- ✅ **Chống Phishing:** Passkey gắn với domain
- ✅ **Không Lưu Mật Khẩu:** Chỉ lưu public key trên server
- ✅ **Bảo Vệp Sinh Trắc Học:** Private key trong secure enclave
- ✅ **Chống Replay:** Challenge + sign count
- ✅ **Xác Thực Origin:** Chữ ký số xác minh
- ✅ **Yêu Cầu HTTPS:** Triển khai production (yêu cầu WebAuthn)

---

## 🚀 Triển Khai

### Môi Trường Phát Triển
```bash
git clone <repo>
cd fido-demo
docker compose up --build -d
```
Truy cập: http://localhost

### Môi Trường Staging
- Dùng PostgreSQL thay vì SQLite
- Dùng Redis cho lưu session
- Bật HTTPS với Let's Encrypt
- Cấu hình biến môi trường

### Production
- Xem [Kiến Trúc Triển Khai](vi/technical/kien-truc.md#kien-truc-trien-khai)
- Dùng Kubernetes để mở rộng horizontal
- Bật giới hạn tốc độ
- Thiết lập monitoring và logging
- Cấu hình backup và recovery

---

## 📝 Phiên Bản Tài Liệu

| Phiên Bản | Ngày | Thay Đổi |
|-----------|------|---------|
| 1.0 | 2025-12-29 | Bản phát hành đầu tiên (tiếng Anh) |
| 1.1 | 2025-12-29 | Thêm tài liệu tiếng Việt |

---

## 🤝 Đóng Góp

Khi cập nhật tài liệu:

1. **Tài liệu BA:** Cập nhật yêu cầu kinh doanh, luồng người dùng, trường hợp sử dụng
2. **Tài liệu Kỹ Thuật:** Cập nhật kiến trúc, spec API, hướng dẫn triển khai
3. **Sơ Đồ:** Giữ Mermaid diagrams đồng bộ với code
4. **Phiên Bản:** Cập nhật cả tiếng Anh và tiếng Việt

---

## 📧 Liên Hệ

- **Project Repo:** [GitHub](https://github.com/sonvc94/fido-demo)
- **Issues:** Báo lỗi qua GitHub Issues
- **Tài Liệu:** Xem thư mục /docs để tài liệu chi tiết

---

## 🎓 Tài Nguyên Tham Khảo

### Tài Liệu Bên Ngoài
- [WebAuthn Specification (W3C)](https://w3c.github.io/webauthn/)
- [FIDO Alliance](https://fidoalliance.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)

### Tài Liệu Nội Bộ
- [API Swagger UI](http://localhost:8091/docs) - Khi chạy local
- [API ReDoc](http://localhost:8091/redoc) - Khi chạy local
- [OpenAPI JSON](http://localhost:8091/openapi.json) - Khi chạy local

---

**Cập Nhật Lần:** 2025-12-29

**Người Duy Trì Tài Liệu:**
- Đội ngũ BA (tài liệu BA)
- Technical Lead (tài liệu kỹ thuật)
