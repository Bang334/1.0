import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Row, Col, Nav, Table, Button, Badge, Modal, Card, Pagination, Tab, Tabs } from "react-bootstrap";
import { format } from 'date-fns';
import UserService from "../services/user.service";
import "../css/ThongBaoList.css";
import { FaInbox, FaPaperPlane, FaTrash, FaEye, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "react-toastify";

const ThongBaoList = forwardRef(({ isGiangVien = false }, ref) => {
  const [thongBaoNhanList, setThongBaoNhanList] = useState([]);
  const [thongBaoGuiList, setThongBaoGuiList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("nhan");
  const [activeThongBaoTab, setActiveThongBaoTab] = useState("nhan");
  const [showThongBaoDetailModal, setShowThongBaoDetailModal] = useState(false);
  const [showThongBaoDaGuiDetailModal, setShowThongBaoDaGuiDetailModal] = useState(false);
  const [selectedThongBao, setSelectedThongBao] = useState(null);
  const [selectedThongBaoDaGui, setSelectedThongBaoDaGui] = useState(null);
  const [nguoiNhanThongBao, setNguoiNhanThongBao] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [thongBaoToDelete, setThongBaoToDelete] = useState(null);

  useEffect(() => {
    fetchThongBaoNhan();
    fetchThongBaoGui();
  }, [isGiangVien]);

  // Thêm hiển thị thông báo lỗi nếu có
  useEffect(() => {
    if (error) {
      // Auto clear error after 5 seconds
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchThongBaoNhan = async () => {
    try {
      setLoading(true);
      const response = isGiangVien 
        ? await UserService.getThongBaoNhanGV() 
        : await UserService.getThongBaoNhan();
      setThongBaoNhanList(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching thông báo nhận:", error);
      setError("Không thể tải thông báo đã nhận");
      setLoading(false);
    }
  };

  const fetchThongBaoGui = async () => {
    try {
      setLoading(true);
      const response = isGiangVien 
        ? await UserService.getThongBaoGuiGV() 
        : await UserService.getThongBaoGui();
      
      // Kiểm tra từng thông báo để đảm bảo dữ liệu chính xác
      response.data.forEach(tb => {
        console.log(`Thông báo ID ${tb.id || tb.idTB}: Người nhận = ${tb.soNguoiNhan}, Đã đọc = ${tb.soNguoiDaDoc}`);
      });
      
      setThongBaoGuiList(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching thông báo gửi:", error);
      setError("Không thể tải thông báo đã gửi");
      setLoading(false);
    }
  };

  const handleDanhDauDaDoc = async (maThongBao) => {
    // Kiểm tra nếu maThongBao không tồn tại
    if (!maThongBao) {
      console.error("Không thể đánh dấu đã đọc: ID thông báo không hợp lệ");
      setError("Không thể đánh dấu đã đọc: ID thông báo không hợp lệ");
      return;
    }

    try {
      setLoading(true);
      console.log(`Đang đánh dấu đã đọc thông báo với ID: ${maThongBao}`);
      const response = isGiangVien 
        ? await UserService.danhDauDaDocGV(maThongBao) 
        : await UserService.danhDauDaDoc(maThongBao);
      
      // Cập nhật lại trạng thái thông báo trong danh sách
      // CHỈ cập nhật thông báo với ID tương ứng
      setThongBaoNhanList(prev => 
        prev.map(tb => {
          // Xác định ID của thông báo hiện tại
          const tbId = tb.maThongBao || tb.id;
          // Chỉ cập nhật thông báo có ID trùng khớp
          return tbId === maThongBao
            ? { ...tb, trangThai: "DADOC" } 
            : tb;
        })
      );
      
      setLoading(false);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      setError("Không thể đánh dấu đã đọc");
      setLoading(false);
    }
  };

  // Hiển thị modal xác nhận xóa thông báo
  const confirmDeleteThongBao = (thongBao) => {
    setThongBaoToDelete(thongBao);
    setShowDeleteConfirmModal(true);
  };

  // Xử lý xóa thông báo
  const handleXoaThongBao = async (maThongBao) => {
    // Kiểm tra nếu maThongBao không tồn tại
    if (!maThongBao) {
      console.error("Không thể xóa: ID thông báo không hợp lệ");
      setError("Không thể xóa: ID thông báo không hợp lệ");
      return;
    }

    try {
      setDeleting(true);
      console.log(`Đang xóa thông báo với ID: ${maThongBao}`);
      
      const response = isGiangVien 
        ? await UserService.xoaThongBaoGV(maThongBao) 
        : await UserService.xoaThongBao(maThongBao);
      
      // Cập nhật lại danh sách thông báo (loại bỏ thông báo đã xóa)
      setThongBaoNhanList(prev => 
        prev.filter(tb => {
          const tbId = tb.maThongBao || tb.id;
          return tbId !== maThongBao;
        })
      );
      
      toast.success("Đã xóa thông báo thành công");
      setDeleting(false);
      setShowDeleteConfirmModal(false);
    } catch (error) {
      console.error("Error deleting notification:", error);
      setError("Không thể xóa thông báo: " + (error.response?.data?.message || error.message));
      toast.error("Không thể xóa thông báo");
      setDeleting(false);
    }
  };

  // Utility
  const formatDate = (dateString) => dateString ? format(new Date(dateString), 'dd/MM/yyyy HH:mm') : '';

  const openThongBaoDetail = async (thongBao) => {
    try {
      setSelectedThongBao(thongBao);
      setShowThongBaoDetailModal(true);
      
      // Xác định ID thông báo (có thể là maThongBao hoặc id)
      const thongBaoId = thongBao.maThongBao || thongBao.id;
      
      // Kiểm tra ID thông báo có tồn tại không
      if (!thongBaoId) {
        console.error("Không thể đánh dấu đã đọc: ID thông báo không hợp lệ");
        return;
      }
      
      // Luôn đánh dấu thông báo là đã đọc khi mở xem chi tiết, bất kể trạng thái hiện tại
      // Cập nhật giao diện ngay lập tức để phản hồi nhanh với người dùng
      if (thongBao.trangThai !== 'DADOC') {
        // Cập nhật UI ngay lập tức để người dùng thấy sự thay đổi
        // CHỈ cập nhật thông báo hiện tại, không phải tất cả
        setThongBaoNhanList(prev => 
          prev.map(tb => {
            // So sánh ID chính xác để chỉ cập nhật đúng thông báo đang xem
            const tbId = tb.maThongBao || tb.id;
            return tbId === thongBaoId 
              ? { ...tb, trangThai: "DADOC" } 
              : tb;
          })
        );
        
        // Gọi API để cập nhật trạng thái trên server
        try {
          console.log(`Đánh dấu đã đọc thông báo với ID: ${thongBaoId}`);
          const response = isGiangVien 
            ? await UserService.danhDauDaDocGV(thongBaoId) 
            : await UserService.danhDauDaDoc(thongBaoId);
          
          console.log("Đã đánh dấu thông báo đã đọc:", response);
        } catch (error) {
          // Nếu API gặp lỗi, log lỗi nhưng vẫn giữ trạng thái đã đọc trên UI
          console.error("Lỗi khi đánh dấu thông báo đã đọc:", error);
        }
      }
    } catch (error) {
      console.error("Lỗi khi mở chi tiết thông báo:", error);
      setError(error?.response?.data?.message || "Không thể mở chi tiết thông báo");
    }
  };

  const closeThongBaoDetail = () => {
    setShowThongBaoDetailModal(false);
    setSelectedThongBao(null);
  };

  const openThongBaoDaGuiDetail = async (thongBao) => {
    try {
      console.log("Chi tiết thông báo:", thongBao);
      
      // Kiểm tra thông báo có tồn tại không
      if (!thongBao) {
        setError("Không thể xem chi tiết: Thông báo không hợp lệ");
        return;
      }
      
      // Xác định ID của thông báo (có thể là id hoặc idTB)
      const thongBaoId = thongBao.id || thongBao.idTB;
      
      if (!thongBaoId) {
        setError("Không thể xem chi tiết: ID thông báo không hợp lệ");
        return;
      }
      
      const response = await UserService.getNguoiNhanThongBao(thongBaoId);
      setNguoiNhanThongBao(response.data);
      setSelectedThongBaoDaGui(thongBao);
      setShowThongBaoDaGuiDetailModal(true);
    } catch (error) {
      console.error("Error fetching notification recipients:", error);
      if (error) {
        setError("Không thể tải danh sách người nhận thông báo: " + (error.response?.data || error.message));
      }
    }
  };
  
  const closeThongBaoDaGuiDetail = () => {
    setShowThongBaoDaGuiDetailModal(false);
    setSelectedThongBaoDaGui(null);
    setNguoiNhanThongBao([]);
  };

  // Công khai phương thức để cập nhật tab
  useImperativeHandle(ref, () => ({
    switchToSentTab: () => {
      setActiveThongBaoTab("gui");
    },
    refreshList: () => {
      fetchThongBaoGui();
    }
  }));

  return (
    <Row>
      <Col>
        <div className="d-flex justify-content-center align-items-center mb-3 mt-3">
          <h4>Thông báo</h4>
        </div>
        
        <Nav variant="tabs" className="mb-3 custom-tabs" activeKey={activeThongBaoTab} onSelect={(k) => setActiveThongBaoTab(k)}>
          <Nav.Item>
            <Nav.Link eventKey="nhan" className="custom-tab-link">
              <FaInbox className="me-2" /> Thông báo đã nhận
              {thongBaoNhanList.filter(tb => tb.trangThai === 'CHUADOC').length > 0 && (
                <Badge pill bg="danger" className="ms-2">
                  {thongBaoNhanList.filter(tb => tb.trangThai === 'CHUADOC').length}
                </Badge>
              )}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="gui" className="custom-tab-link">
              <FaPaperPlane className="me-2" /> Thông báo đã gửi
              {thongBaoGuiList.length > 0 && (
                <Badge pill bg="info" className="ms-2">
                  {thongBaoGuiList.length}
                </Badge>
              )}
            </Nav.Link>
          </Nav.Item>
        </Nav>
        
        {activeThongBaoTab === "nhan" && (
          <Table striped bordered hover responsive className="thongbao-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Người gửi</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {thongBaoNhanList.length > 0 ? thongBaoNhanList.map(tb => (
                <tr key={tb.id} className={tb.trangThai === 'CHUADOC' ? 'chuadoc' : ''}>
                  <td>{tb.thongBaoGui?.tieuDe}</td>
                  <td>{tb.thongBaoGui?.nguoiGui?.hoTen ?? "Quản Lý"}</td>
                  <td>{formatDate(tb.thongBaoGui?.thoiGian)}</td>
                  <td>
                    <Badge bg={tb.trangThai === 'DADOC' ? 'success' : 'warning'}>
                      {tb.trangThai === 'DADOC' ? 'Đã đọc' : 'Chưa đọc'}
                    </Badge>
                  </td>
                  <td>
                    <Button 
                      variant="outline-info" 
                      size="sm" 
                      onClick={() => openThongBaoDetail(tb)}
                      className="me-1"
                    >
                      <FaEye className="me-1" /> Xem
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      style={{color: 'red'}}
                      onClick={() => confirmDeleteThongBao(tb)}
                      disabled={deleting}
                    >
                      <FaTrash className="me-1" /> Xóa
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="text-center">Không có thông báo</td></tr>
              )}
            </tbody>
          </Table>
        )}
        
        {activeThongBaoTab === "gui" && (
          <Table striped bordered hover responsive className="thongbao-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Nội dung</th>
                <th>Thời gian</th>
                <th>Số người nhận</th>
                <th>Đã đọc</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {thongBaoGuiList.length > 0 ? thongBaoGuiList.map(tb => (
                <tr key={tb.id || tb.idTB}>
                  <td>{tb.tieuDe}</td>
                  <td>{tb.noiDung?.length > 50 ? tb.noiDung.substring(0, 50) + '...' : tb.noiDung}</td>
                  <td>{formatDate(tb.thoiGian)}</td>
                  <td>{tb.soNguoiNhan !== undefined ? tb.soNguoiNhan : '-'}</td>
                  <td>
                    <Badge bg="info">
                      {tb.soNguoiDaDoc !== undefined && tb.soNguoiNhan !== undefined 
                        ? `${tb.soNguoiDaDoc}/${tb.soNguoiNhan}` 
                        : '-'}
                    </Badge>
                  </td>
                  <td>
                    <Button 
                      variant="outline-info" 
                      size="sm" 
                      onClick={() => openThongBaoDaGuiDetail(tb)}
                    >
                      <FaEye className="me-1" /> Chi tiết
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="text-center">Bạn chưa gửi thông báo nào</td></tr>
              )}
            </tbody>
          </Table>
        )}
      </Col>

      {/* Modal xác nhận xóa thông báo */}
      <Modal 
        show={showDeleteConfirmModal} 
        onHide={() => setShowDeleteConfirmModal(false)}
        centered
        backdrop="static"
        className="delete-confirm-modal"
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FaExclamationTriangle className="me-2" />
            Xác nhận xóa thông báo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <FaExclamationTriangle size={50} className="text-danger mb-3" />
            <h5>Bạn có chắc chắn muốn xóa thông báo này?</h5>
            {thongBaoToDelete && (
              <p className="text-muted">
                Tiêu đề: <strong>{thongBaoToDelete.thongBaoGui?.tieuDe}</strong><br />
                Người gửi: <strong>{thongBaoToDelete.thongBaoGui?.nguoiGui?.hoTen ?? "Quản Lý"}</strong><br />
                Thời gian: <strong>{formatDate(thongBaoToDelete.thongBaoGui?.thoiGian)}</strong>
              </p>
            )}
            <p className="alert alert-warning">
              <strong>Lưu ý:</strong> Hành động này không thể hoàn tác!
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteConfirmModal(false)}
            className="px-4"
          >
            Hủy
          </Button>
          <Button 
            variant="danger" 
            onClick={() => handleXoaThongBao(thongBaoToDelete?.id)}
            disabled={deleting}
            className="px-4"
          >
            {deleting ? 'Đang xóa...' : 'Xóa thông báo'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Thông báo Detail Modal */}
      <Modal 
        show={showThongBaoDetailModal} 
        onHide={closeThongBaoDetail} 
        size="lg"
        centered
      >
        <Modal.Header closeButton className="modal-header">
          <Modal.Title>NỘI DUNG THÔNG BÁO</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body">
          {selectedThongBao && (
            <div>
              <div className="mb-3">
                <label className="fw-bold me-2">Ngày gửi:</label>
                <span>{formatDate(selectedThongBao.thongBaoGui?.thoiGian)}</span>
              </div>
              <div className="mb-3">
                <label className="fw-bold me-2">Tiêu đề:</label>
                <span>
                  {selectedThongBao.thongBaoGui?.nguoiGui?.hoTen} gửi cho{" "}
                  {selectedThongBao.thongBaoGui?.guiChoLop ? selectedThongBao.thongBaoGui?.lopNhan?.tenLop : "bạn"} về vấn đề{" "}
                  {selectedThongBao.thongBaoGui?.tieuDe}
                </span>
              </div>
              <div className="mb-3">
                <label className="fw-bold me-2">Nội dung:</label>
                <span>{selectedThongBao.thongBaoGui?.noiDung}</span>
              </div>
              <hr/>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="danger" 
            onClick={() => {
              closeThongBaoDetail();
              if (selectedThongBao?.id) {
                confirmDeleteThongBao(selectedThongBao);
              }
            }} 
            className="me-2"
          >
            <FaTrash className="me-1" /> Xóa thông báo
          </Button>
          <Button variant="secondary" onClick={closeThongBaoDetail}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Thông báo Đã Gửi Detail Modal */}
      <Modal 
        show={showThongBaoDaGuiDetailModal} 
        onHide={closeThongBaoDaGuiDetail} 
        size="lg"
        centered
      >
        <Modal.Header closeButton className="modal-header">
          <Modal.Title>CHI TIẾT THÔNG BÁO ĐÃ GỬI</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body">
          {selectedThongBaoDaGui && (
            <div>
              <div className="mb-3">
                <label className="fw-bold me-2">Ngày gửi:</label>
                <span>{formatDate(selectedThongBaoDaGui.thoiGian)}</span>
              </div>
              <div className="mb-3">
                <label className="fw-bold me-2">Tiêu đề:</label>
                <span>{selectedThongBaoDaGui.tieuDe}</span>
              </div>
              <div className="mb-3">
                <label className="fw-bold me-2">Nội dung:</label>
                <span>{selectedThongBaoDaGui.noiDung}</span>
              </div>
              <div className="mb-3">
                <label className="fw-bold">Danh sách người nhận:</label>
                <Table striped bordered hover className="mt-2">
                  <thead>
                    <tr>
                      <th>Họ tên</th>
                      <th>Vai trò</th>
                      <th>Lớp</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nguoiNhanThongBao.danhSachNguoiNhan?.length > 0 ? (
                      nguoiNhanThongBao.danhSachNguoiNhan.map(nguoiNhan => (
                        <tr key={nguoiNhan.id}>
                          <td>{nguoiNhan.hoTen}</td>
                          <td>{nguoiNhan.vaiTro}</td>
                          <td>{nguoiNhan.maLop || '-'}</td>
                          <td>
                            <Badge bg={nguoiNhan.trangThai === 'DADOC' ? 'success' : 'warning'}>
                              {nguoiNhan.trangThai === 'DADOC' ? 'Đã đọc' : 'Chưa đọc'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">Không có người nhận</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeThongBaoDaGuiDetail}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </Row>
  );
});

export default ThongBaoList; 