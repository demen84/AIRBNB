create database air_bnb;
use air_bnb;

-- Table vitri
CREATE TABLE `vitri` (
   `id` int NOT NULL AUTO_INCREMENT,
   `ten_vi_tri` varchar(255) NOT NULL,
   `tinh_thanh` varchar(255) NOT NULL,
   `quoc_gia` varchar(255) NOT NULL,
   `hinh_anh` varchar(255) DEFAULT NULL,
   `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
   `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`)
 ) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- Table phong
CREATE TABLE `phong` (
   `id` int NOT NULL AUTO_INCREMENT,
   `ten_phong` varchar(255) NOT NULL,
   `khach` int NOT NULL,
   `phong_ngu` int NOT NULL,
   `giuong` int NOT NULL,
   `phong_tam` int NOT NULL,
   `mo_ta` text,
   `gia_tien` int NOT NULL,
   `may_giat` tinyint(1) DEFAULT '0',
   `tivi` tinyint(1) DEFAULT '0',
   `dieu_hoa` tinyint(1) DEFAULT '0',
   `wifi` tinyint(1) DEFAULT '0',
   `bep` tinyint(1) DEFAULT '0',
   `do_xe` tinyint(1) DEFAULT '0',
   `ho_boi` tinyint(1) DEFAULT '0',
   `ban_ui` tinyint(1) DEFAULT '0',
   `ma_vi_tri` int NOT NULL,
   `hinh_anh` varchar(255) DEFAULT NULL,
   `danh_gia` int DEFAULT '0',
   `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
   `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   KEY `ma_vi_tri` (`ma_vi_tri`),
   CONSTRAINT `phong_ibfk_1` FOREIGN KEY (`ma_vi_tri`) REFERENCES `vitri` (`id`) ON DELETE CASCADE
 ) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- Table nguoidung
CREATE TABLE `nguoidung` (
   `id` int NOT NULL AUTO_INCREMENT,
   `name` varchar(255) NOT NULL,
   `email` varchar(255) NOT NULL,
   `pass_word` varchar(255) NOT NULL,
   `phone` varchar(20) DEFAULT NULL,
   `birth_day` varchar(20) DEFAULT NULL,
   `gender` varchar(10) DEFAULT NULL,
   `role` varchar(20) DEFAULT 'user',
   `avatar` varchar(255) DEFAULT NULL,
   `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
   `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   `status` enum('active','banned','pending') DEFAULT 'active',
   `banned_at` datetime DEFAULT NULL,
   `two_fa_secret` varchar(255) DEFAULT NULL COMMENT 'TOTP secret (Base32 encoded string)',
   `is_2fa_enabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Cờ bật/tắt 2FA (0=off,1=on)',
   PRIMARY KEY (`id`),
   UNIQUE KEY `email` (`email`),
   UNIQUE KEY `phone` (`phone`),
   KEY `idx_is_2fa_enabled` (`is_2fa_enabled`),
   CONSTRAINT `chk_2fa_secret_required` CHECK (((`is_2fa_enabled` in (0,1)) and ((`is_2fa_enabled` = 0) or (`two_fa_secret` is not null))))
 ) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci


-- Table datphong
CREATE TABLE `datphong` (
   `id` int NOT NULL AUTO_INCREMENT,
   `ma_phong` int NOT NULL,
   `ngay_den` date NOT NULL,
   `ngay_di` date NOT NULL,
   `so_luong_khach` int NOT NULL,
   `tong_tien` decimal(10,2) DEFAULT NULL,
   `ma_nguoi_dat` int NOT NULL,
   `trang_thai` enum('pending','confirmed','checked_in','completed','cancelled') DEFAULT 'pending',
   `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
   `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   KEY `ma_phong` (`ma_phong`),
   KEY `ma_nguoi_dat` (`ma_nguoi_dat`),
   CONSTRAINT `datphong_ibfk_1` FOREIGN KEY (`ma_phong`) REFERENCES `phong` (`id`) ON DELETE CASCADE,
   CONSTRAINT `datphong_ibfk_2` FOREIGN KEY (`ma_nguoi_dat`) REFERENCES `nguoidung` (`id`) ON DELETE CASCADE
 ) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- Table binhluan
CREATE TABLE `binhluan` (
   `id` int NOT NULL AUTO_INCREMENT,
   `ma_phong` int NOT NULL,
   `ma_nguoi_binh_luan` int NOT NULL,
   `noi_dung` text NOT NULL,
   `sao_binh_luan` int NOT NULL,
   `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
   `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   KEY `ma_phong` (`ma_phong`),
   KEY `ma_nguoi_binh_luan` (`ma_nguoi_binh_luan`),
   CONSTRAINT `binhluan_ibfk_1` FOREIGN KEY (`ma_phong`) REFERENCES `phong` (`id`) ON DELETE CASCADE,
   CONSTRAINT `binhluan_ibfk_2` FOREIGN KEY (`ma_nguoi_binh_luan`) REFERENCES `nguoidung` (`id`) ON DELETE CASCADE,
   CONSTRAINT `binhluan_chk_1` CHECK ((`sao_binh_luan` between 1 and 5)),
   CONSTRAINT `check_sao_rating` CHECK (((`sao_binh_luan` >= 1) and (`sao_binh_luan` <= 5)))
 ) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- -- 1. Thêm cột tong_tien vào sau cột so_luong_khach
-- -- Tôi dùng kiểu dữ liệu INT, nếu bạn dùng tiền USD có thể đổi thành DECIMAL(10,2)
-- ALTER TABLE datphong 
-- ADD COLUMN tong_tien DECIMAL(10, 2) NULL AFTER so_luong_khach;

-- -- 2. Cập nhật Enum để thêm 2 trạng thái: checked_in và completed
-- -- Lưu ý: Phải liệt kê lại toàn bộ các giá trị cũ (pending, confirmed, cancelled) 
-- -- cộng thêm các giá trị mới.
-- ALTER TABLE datphong 
-- MODIFY COLUMN trang_thai ENUM('pending', 'confirmed', 'checked_in', 'completed', 'cancelled') 
-- DEFAULT 'pending';


-- -- 1. Thay đổi kiểu dữ liệu cột noi_dung thành TEXT
-- ALTER TABLE binhluan 
-- MODIFY COLUMN noi_dung TEXT NOT NULL;

-- -- 2. Xóa cột ngay_binh_luan dư thừa
-- ALTER TABLE binhluan 
-- DROP COLUMN ngay_binh_luan;

-- -- 3. Thêm ràng buộc Check cho số sao (Chỉ hoạt động trên MySQL 8.0.16+)
-- -- Nếu bạn dùng phiên bản cũ hơn, lệnh này sẽ không chạy, nhưng cũng không sao 
-- -- vì chúng ta sẽ chặn bằng code NestJS ở DTO vào ngày mai.
-- ALTER TABLE binhluan 
-- ADD CONSTRAINT check_sao_rating CHECK (sao_binh_luan >= 1 AND sao_binh_luan <= 5);