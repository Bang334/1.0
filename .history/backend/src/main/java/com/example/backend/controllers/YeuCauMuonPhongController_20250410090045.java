package com.example.backend.controllers;

import com.example.backend.model.NguoiDung;
import com.example.backend.model.Phong;
import com.example.backend.model.SinhVien;
import com.example.backend.model.YeuCauMuonPhong;
import com.example.backend.model.YeuCauMuonPhong.TrangThai;
import com.example.backend.payload.request.YeuCauMuonPhongRequest;
import com.example.backend.payload.response.MessageResponse;
import com.example.backend.repository.NguoiDungRepository;
import com.example.backend.repository.PhongRepository;
import com.example.backend.repository.SinhVienRepository;
import com.example.backend.repository.YeuCauMuonPhongRepository;
import com.example.backend.service.UserDetailsImpl;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
@RestController
@RequestMapping("/api/yeucaumuon")
public class YeuCauMuonPhongController {

    @Autowired
    private YeuCauMuonPhongRepository yeuCauMuonPhongRepository;

    @Autowired
    private SinhVienRepository sinhVienRepository;

    @Autowired
    private PhongRepository phongRepository;

    @Autowired
    private NguoiDungRepository nguoiDungRepository;

    @PostMapping("/gui")
    @PreAuthorize("hasRole('SV')")
    public ResponseEntity<?> guiYeuCauMuonPhong(@RequestBody YeuCauMuonPhongRequest yeuCauRequest) {
        try {
            // Kiểm tra người dùng hiện tại
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String userId = userDetails.getId();
            
            SinhVien sinhVien = sinhVienRepository.findByNguoiDungIdNguoiDung(userId);
            if (sinhVien == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Không tìm thấy thông tin sinh viên"));
            }
            
            // Kiểm tra ngày mượn và ngày trả có hợp lệ không
            if (yeuCauRequest.getThoiGianMuon() == null || yeuCauRequest.getThoiGianTra() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("Thời gian mượn và trả không được để trống"));
            }
            
            if (yeuCauRequest.getThoiGianMuon().after(yeuCauRequest.getThoiGianTra())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("Thời gian mượn phải trước thời gian trả"));
            }
            
            // Kiểm tra xung đột với các yêu cầu đã tồn tại của phòng
            List<YeuCauMuonPhong> trungLichPhong = yeuCauMuonPhongRepository.kiemTraTrungLichPhong(
                yeuCauRequest.getMaPhong(),
                yeuCauRequest.getThoiGianMuon(),
                yeuCauRequest.getThoiGianTra()
            );
            
            if (!trungLichPhong.isEmpty()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageResponse("Phòng đã được đăng ký mượn trong khoảng thời gian này"));
            }
            
            // Kiểm tra xung đột với các yêu cầu đã tồn tại của người mượn
            List<YeuCauMuonPhong> trungLichNguoiMuon = yeuCauMuonPhongRepository.kiemTraTrungLichNguoiMuon(
                userId,
                yeuCauRequest.getThoiGianMuon(),
                yeuCauRequest.getThoiGianTra()
            );
            
            if (!trungLichNguoiMuon.isEmpty()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageResponse("Bạn đã đăng ký mượn phòng trong khoảng thời gian này"));
            }
            
            // Tạo yêu cầu mượn phòng mới
            YeuCauMuonPhong yeuCauMuonPhong = new YeuCauMuonPhong();
            yeuCauMuonPhong.setNguoiMuon(sinhVien.getNguoiDung());
            yeuCauMuonPhong.setTrangThai(TrangThai.DANGXULY);
            yeuCauMuonPhong.setLyDo(yeuCauRequest.getLyDo());
            yeuCauMuonPhong.setMucDich(yeuCauRequest.getMucDich());
            
            // Thiết lập thông tin phòng
            Optional<Phong> phongOptional = phongRepository.findById(yeuCauRequest.getMaPhong());
            if (!phongOptional.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Không tìm thấy thông tin phòng"));
            }
            
            yeuCauMuonPhong.setPhong(phongOptional.get());
            
            // Thiết lập thời gian
            yeuCauMuonPhong.setThoiGianMuon(yeuCauRequest.getThoiGianMuon());
            yeuCauMuonPhong.setThoiGianTra(yeuCauRequest.getThoiGianTra());
            
            // Lưu yêu cầu vào database
            yeuCauMuonPhongRepository.save(yeuCauMuonPhong);
            
            return ResponseEntity.ok(new MessageResponse("Gửi yêu cầu mượn phòng thành công"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Lỗi khi xử lý yêu cầu: " + e.getMessage()));
        }
    }

    @DeleteMapping("/huy/{maYeuCau}")
    @PreAuthorize("hasRole('SV') or hasRole('GV')")
    public ResponseEntity<?> huyYeuCau(@PathVariable Integer maYeuCau) {
        try {
            // Kiểm tra người dùng hiện tại
            UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String userId = userDetails.getId();
            
            // Lấy idNguoiDung từ userId
            Optional<NguoiDung> nguoiDungOpt = nguoiDungRepository.findByTaiKhoanId(userId);
            if (!nguoiDungOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Không tìm thấy thông tin người dùng"));
            }
            String idNguoiDung = nguoiDungOpt.get().getIdNguoiDung();
            
            // Lấy yêu cầu từ database
            Optional<YeuCauMuonPhong> yeuCauOpt = yeuCauMuonPhongRepository.findById(maYeuCau);
            if (!yeuCauOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Không tìm thấy yêu cầu mượn phòng"));
            }
            
            YeuCauMuonPhong yeuCau = yeuCauOpt.get();
            if (!yeuCau.getNguoiMuon().getIdNguoiDung().equals(idNguoiDung)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Bạn không có quyền hủy yêu cầu này"));
            }
            
            Date now = new Date();
            if (now.after(yeuCau.getThoiGianMuon())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("Không thể hủy yêu cầu đã quá thời gian mượn"));
            }
            
            // Xóa yêu cầu
            yeuCauMuonPhongRepository.delete(yeuCau);
            
            return ResponseEntity.ok(new MessageResponse("Đã hủy yêu cầu mượn phòng thành công"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Lỗi khi xử lý yêu cầu: " + e.getMessage()));
        }
    }

    @GetMapping("/phongtrong")
    @PreAuthorize("hasRole('SV') or hasRole('GV')")
    public ResponseEntity<?> timPhongTrong(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Date thoiGianMuon,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Date thoiGianTra,
            @RequestParam(required = false) Integer soChoDat,
            @RequestParam(required = false) String loaiPhong) {
        try {
            // Kiểm tra thời gian có hợp lệ không
            if (thoiGianMuon == null || thoiGianTra == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("Thời gian mượn và trả không được để trống"));
            }
            
            if (thoiGianMuon.after(thoiGianTra)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("Thời gian mượn phải trước thời gian trả"));
            }
            
            // Lấy danh sách tất cả phòng
            List<Phong> danhSachPhong;
            
            // Lọc theo loại phòng nếu có
            if (loaiPhong != null && !loaiPhong.isEmpty()) {
                try {
                    Phong.LoaiPhong loaiPhongEnum = Phong.LoaiPhong.valueOf(loaiPhong);
                    danhSachPhong = phongRepository.findByLoaiPhong(loaiPhongEnum);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new MessageResponse("Loại phòng không hợp lệ: " + loaiPhong));
                }
            } else {
                danhSachPhong = phongRepository.findAll();
            }
            
            // Lọc theo số chỗ ngồi nếu có
            if (soChoDat != null && soChoDat > 0) {
                danhSachPhong.removeIf(phong -> phong.getSucChua() < soChoDat);
            }
            
            List<Phong> phongTrongList = new ArrayList<>();
            for (Phong phong : danhSachPhong) {
                List<YeuCauMuonPhong> trungLichPhong = yeuCauMuonPhongRepository.kiemTraTrungLichPhong(
                        phong.getMaPhong(), thoiGianMuon, thoiGianTra);
                if (trungLichPhong.isEmpty()) {
                    phongTrongList.add(phong);
                }
            }
    
            // Nếu có phòng trống, trả về danh sách phòng trống
            if (!phongTrongList.isEmpty()) {
                return ResponseEntity.ok(
                        java.util.Map.of(
                                "phongTrongList", phongTrongList,
                                "goiYPhongGanNhat", Collections.emptyList()
                        )
                );
            }
            
            // Tìm các khung giờ gần nhất nếu không có phòng trống
            List<Object> goiYPhongGanNhat = null;
            if (danhSachPhong.isEmpty()) {
                // TODO: Implement gợi ý các khung giờ gần nhất
                // Logic này có thể được triển khai ở phía client hoặc sẽ được bổ sung sau
            }
            
            // Trả về kết quả
            return ResponseEntity.ok(
                java.util.Map.of(
                    "phongTrongList", danhSachPhong,
                    "goiYPhongGanNhat", goiYPhongGanNhat != null ? goiYPhongGanNhat : java.util.Collections.emptyList()
                )
            );
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Lỗi khi xử lý yêu cầu: " + e.getMessage()));
        }
    }
} 