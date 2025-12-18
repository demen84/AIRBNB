use air_bnb;

-- Vị trí (3 records)
INSERT INTO ViTri (ten_vi_tri, tinh_thanh, quoc_gia, hinh_anh) VALUES
('Beach House', 'Vũng Tàu', 'Việt Nam', 'vt1.jpg'),
('City Center', 'TP. Hồ Chí Minh', 'Việt Nam', 'hcm1.jpg'),
('Mountain View', 'Đà Lạt', 'Việt Nam', 'dl1.jpg');

-- Phòng (5 records, thêm danh_gia)
INSERT INTO Phong (ten_phong, khach, phong_ngu, giuong, phong_tam, mo_ta, gia_tien, may_giat, ban_la, tivi, dieu_hoa, wifi, bep, do_xe, ho_boi, ban_ui, ma_vi_tri, hinh_anh, danh_gia) VALUES
('Phòng biển đẹp', 4, 2, 2, 1, 'View biển cực chill', 1200000, true, true, true, true, true, true, true, false, true, 1, 'p1.jpg', 4),
('Căn hộ trung tâm', 2, 1, 1, 1, 'Gần Bitexco', 800000, true, false, true, true, true, false, false, false, false, 2, 'p2.jpg', 5),
('Villa Đà Lạt', 8, 4, 5, 3, 'Có hồ bơi riêng', 3500000, true, true, true, true, true, true, true, true, true, 3, 'p3.jpg', 5),
('Studio nhỏ xinh', 2, 1, 1, 1, 'Phù hợp cặp đôi', 600000, false, false, true, true, true, true, false, false, false, 2, 'p4.jpg', 4),
('Homestay biển', 6, 3, 4, 2, 'Gần bãi tắm', 1800000, true, true, false, true, true, true, true, false, false, 1, 'p5.jpg', 4);

-- Người dùng (4 records, thêm avatar)
INSERT INTO NguoiDung (name, email, pass_word, phone, birth_day, gender, role, avatar) VALUES
('Nguyễn Văn A', 'a@gmail.com', '123456', '0901234567', '1995-05-10', 'nam', 'user', 'avatar_a.jpg'),
('Trần Thị B', 'b@gmail.com', '123456', '0912345678', '1998-12-20', 'nữ', 'user', 'avatar_b.jpg'),
('Lê Admin', 'admin@gmail.com', '123456', '0923456789', '1990-01-01', 'nam', 'admin', 'avatar_admin.jpg'),
('Phạm Văn C', 'c@gmail.com', '123456', '0934567890', '1997-08-15', 'nam', 'user', 'avatar_c.jpg');

-- Đặt phòng (4 records, thêm trang_thai)
INSERT INTO DatPhong (ma_phong, ngay_den, ngay_di, so_luong_khach, ma_nguoi_dat, trang_thai) VALUES
(1, '2025-12-25', '2025-12-28', 3, 1, 'confirmed'),
(2, '2025-12-20', '2025-12-22', 2, 2, 'pending'),
(3, '2026-01-05', '2026-01-10', 8, 4, 'confirmed'),
(1, '2026-01-15', '2026-01-17', 4, 1, 'cancelled');

-- Bình luận (4 records, sửa ma_cong_viec thành ma_phong)
INSERT INTO BinhLuan (ma_phong, ma_nguoi_binh_luan, ngay_binh_luan, noi_dung, sao_binh_luan) VALUES
(1, 1, '2025-12-10', 'Phòng sạch sẽ, view biển đẹp lắm!', 5),
(1, 2, '2025-12-12', 'Chủ nhà thân thiện', 4),
(2, 4, '2025-11-25', 'Vị trí siêu tiện, đi bộ ra phố', 5),
(3, 1, '2025-10-30', 'Villa rộng, đáng giá tiền', 5);
