-- create database air_bnb;
use air_bnb;

-- Table ViTri
CREATE TABLE ViTri (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_vi_tri VARCHAR(255) NOT NULL,
    tinh_thanh VARCHAR(255) NOT NULL,
    quoc_gia VARCHAR(255) NOT NULL,
    hinh_anh VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table Phong
CREATE TABLE Phong (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_phong VARCHAR(255) NOT NULL,
    khach INT NOT NULL,
    phong_ngu INT NOT NULL,
    giuong INT NOT NULL,
    phong_tam INT NOT NULL,
    mo_ta TEXT,
    gia_tien INT NOT NULL,
    may_giat BOOLEAN DEFAULT FALSE,
    ban_la BOOLEAN DEFAULT FALSE,
    tivi BOOLEAN DEFAULT FALSE,
    dieu_hoa BOOLEAN DEFAULT FALSE,
    wifi BOOLEAN DEFAULT FALSE,
    bep BOOLEAN DEFAULT FALSE,
    do_xe BOOLEAN DEFAULT FALSE,
    ho_boi BOOLEAN DEFAULT FALSE,
    ban_ui BOOLEAN DEFAULT FALSE,
    ma_vi_tri INT NOT NULL,
    hinh_anh VARCHAR(255),
    danh_gia INT DEFAULT 0,  -- Thêm theo gợi ý
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_vi_tri) REFERENCES ViTri(id) ON DELETE CASCADE
);

-- Table NguoiDung
CREATE TABLE NguoiDung (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    pass_word VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    birth_day VARCHAR(20),
    gender VARCHAR(10),
    role VARCHAR(20) DEFAULT 'user',
    avatar VARCHAR(255),  -- Thêm avatar
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table DatPhong
CREATE TABLE DatPhong (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_phong INT NOT NULL,
    ngay_den DATE NOT NULL,
    ngay_di DATE NOT NULL,
    so_luong_khach INT NOT NULL,
    ma_nguoi_dat INT NOT NULL,
    trang_thai ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',  -- Thêm trạng thái
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_phong) REFERENCES Phong(id) ON DELETE CASCADE,
    FOREIGN KEY (ma_nguoi_dat) REFERENCES NguoiDung(id) ON DELETE CASCADE
);

-- Table BinhLuan (sửa ma_cong_viec thành ma_phong)
CREATE TABLE BinhLuan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_phong INT NOT NULL,  -- Đã sửa từ ma_cong_viec
    ma_nguoi_binh_luan INT NOT NULL,
    ngay_binh_luan DATE NOT NULL,
    noi_dung VARCHAR(255) NOT NULL,
    sao_binh_luan INT NOT NULL CHECK (sao_binh_luan BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_phong) REFERENCES Phong(id) ON DELETE CASCADE,
    FOREIGN KEY (ma_nguoi_binh_luan) REFERENCES NguoiDung(id) ON DELETE CASCADE
);
