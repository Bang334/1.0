import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert, Badge, ProgressBar } from "react-bootstrap";
import axios from "axios";
import authHeader from "../services/auth-header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSearch, faKey, faChartBar, faUsers, faUniversity } from "@fortawesome/free-solid-svg-icons";

const API_URL = "http://localhost:8080/api/quanly";

const GiangVienManager = ({ refreshKey }) => {
  const [giangVienList, setGiangVienList] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showPhanKhoaModal, setShowPhanKhoaModal] = useState(false);
  const [currentGiangVien, setCurrentGiangVien] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showTaiKhoanForm, setShowTaiKhoanForm] = useState(false);
  const [khoaList, setKhoaList] = useState([]);
  const [selectedGiangVien, setSelectedGiangVien] = useState([]);
  const [selectedKhoa, setSelectedKhoa] = useState("");
  const [formData, setFormData] = useState({
    maGV: "",
    hoTen: "",
    email: "",
    lienHe: "",
    gioiTinh: "Nam",
    khoa: "",
    userId: "",
    password: ""
  });
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Lấy danh sách giảng viên khi component được render
  useEffect(() => {
    fetchGiangVienList();
    fetchKhoaList();
  }, []);

  // Lấy danh sách giảng viên khi refreshKey thay đổi
  useEffect(() => {
    if (refreshKey) {
      console.log("GiangVienManager refreshing due to refreshKey change:", refreshKey);
      fetchGiangVienList();
    }
  }, [refreshKey]);

  // Lấy danh sách giảng viên từ API
  const fetchGiangVienList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/giangvien`, { headers: authHeader() });
      setGiangVienList(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách giảng viên:", error);
      setMessage("Không thể lấy danh sách giảng viên. Vui lòng thử lại sau.");
      setMessageType("danger");
      setLoading(false);
    }
  };

  // Lấy danh sách khoa từ API
  const fetchKhoaList = async () => {
    try {
      // Đây là ví dụ, bạn cần thay thế bằng API thực tế để lấy danh sách khoa
      // Hoặc có thể dùng danh sách khoa cứng như bên dưới nếu chưa có API
      // const response = await axios.get(`${API_URL}/khoa`, { headers: authHeader() });
      // setKhoaList(response.data);

      // Danh sách khoa mẫu - thay thế bằng API thực tế khi có
      setKhoaList([
        { maKhoa: "CNTT", tenKhoa: "Công nghệ thông tin" },
        { maKhoa: "KTMT", tenKhoa: "Kỹ thuật máy tính" },
        { maKhoa: "KHMT", tenKhoa: "Khoa học máy tính" },
        { maKhoa: "HTTT", tenKhoa: "Hệ thống thông tin" },
        { maKhoa: "MMT", tenKhoa: "Mạng máy tính và truyền thông" },
        { maKhoa: "KTKT", tenKhoa: "Kinh tế và Kế toán" },
        { maKhoa: "QTKD", tenKhoa: "Quản trị kinh doanh" }
      ]);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách khoa:", error);
    }
  };

  // Lấy thống kê về giảng viên
  const fetchGiangVienStats = async () => {
    setStatsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/giangvien/thongke`, { headers: authHeader() });
      setStatsData(response.data);
      setStatsLoading(false);
    } catch (error) {
      console.error("Lỗi khi lấy thống kê giảng viên:", error);
      setStatsLoading(false);
    }
  };

  // Xử lý thay đổi trên form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Toggle form tài khoản
  const handleToggleTaiKhoanForm = () => {
    setShowTaiKhoanForm(!showTaiKhoanForm);
    if (!showTaiKhoanForm) {
      // Reset trường tài khoản khi hiển thị form
      setFormData({
        ...formData,
        userId: "",
        password: ""
      });
    }
  };

  // Hiển thị modal sửa giảng viên
  const handleShowEditModal = (giangVien) => {
    setCurrentGiangVien(giangVien);
    setFormData({
      maGV: giangVien.maGV,
      hoTen: giangVien.hoTen,
      email: giangVien.email,
      lienHe: giangVien.lienHe || "",
      gioiTinh: giangVien.gioiTinh,
      khoa: giangVien.khoa,
      password: "" // Password luôn trống khi sửa
    });
    setShowTaiKhoanForm(false);
    setShowEditModal(true);
  };

  // Cập nhật giảng viên
  const handleUpdateGiangVien = async () => {
    if (!formData.hoTen || !formData.email || !formData.khoa) {
      setMessage("Vui lòng điền đầy đủ thông tin bắt buộc.");
      setMessageType("danger");
      return;
    }

    try {
      const requestData = { ...formData };
      
      // Nếu mật khẩu trống, không gửi lên server
      if (!requestData.password) {
        delete requestData.password;
      }
      
      // Không cần gửi userId khi cập nhật
      delete requestData.userId;

      const response = await axios.put(
        `${API_URL}/giangvien/${currentGiangVien.maGV}`,
        requestData,
        { headers: authHeader() }
      );
      setShowEditModal(false);
      setMessage("Cập nhật giảng viên thành công!");
      setMessageType("success");
      fetchGiangVienList();
    } catch (error) {
      setMessage(error.response?.data?.message || "Đã có lỗi xảy ra khi cập nhật giảng viên.");
      setMessageType("danger");
    }
  };

  // Hiển thị modal xác nhận xóa
  const handleShowDeleteConfirm = (giangVien) => {
    setCurrentGiangVien(giangVien);
    setShowConfirmModal(true);
  };

  // Xóa giảng viên
  const handleDeleteGiangVien = async () => {
    try {
      await axios.delete(
        `${API_URL}/giangvien/${currentGiangVien.maGV}`,
        { headers: authHeader() }
      );
      setShowConfirmModal(false);
      setMessage("Giảng viên đã được xóa thành công!");
      setMessageType("success");
      fetchGiangVienList();
    } catch (error) {
      setMessage(error.response?.data?.message || "Đã có lỗi xảy ra khi xóa giảng viên.");
      setMessageType("danger");
      setShowConfirmModal(false);
    }
  };

  // Hiển thị giới tính
  const renderGioiTinh = (gioiTinh) => {
    switch (gioiTinh) {
      case "Nam":
        return "Nam";
      case "Nu":
        return "Nữ";
      case "KhongXacDinh":
        return "Không xác định";
      default:
        return gioiTinh;
    }
  };

  // Lọc danh sách giảng viên theo từ khóa tìm kiếm
  const filteredGiangVien = giangVienList.filter(gv =>
    gv.maGV.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gv.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gv.khoa.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Hiển thị modal thống kê
  const handleShowStatsModal = () => {
    fetchGiangVienStats();
    setShowStatsModal(true);
  };

  // Hiển thị modal phân khoa
  const handleShowPhanKhoaModal = () => {
    setSelectedGiangVien([]);
    setSelectedKhoa("");
    setShowPhanKhoaModal(true);
  };

  // Xử lý chọn/bỏ chọn giảng viên trong modal phân khoa
  const handleSelectGiangVien = (maGV) => {
    setSelectedGiangVien(prev => {
      if (prev.includes(maGV)) {
        return prev.filter(id => id !== maGV);
      } else {
        return [...prev, maGV];
      }
    });
  };

  // Xử lý chọn tất cả giảng viên
  const handleSelectAllGiangVien = () => {
    if (selectedGiangVien.length === filteredGiangVien.length) {
      setSelectedGiangVien([]);
    } else {
      setSelectedGiangVien(filteredGiangVien.map(gv => gv.maGV));
    }
  };

  // Phân khoa cho giảng viên
  const handlePhanKhoa = async () => {
    if (!selectedKhoa || selectedGiangVien.length === 0) {
      setMessage("Vui lòng chọn khoa và ít nhất một giảng viên.");
      setMessageType("danger");
      return;
    }

    try {
      // API call để cập nhật khoa cho các giảng viên được chọn
      // Đây là ví dụ, cần thay thế bằng API thực tế
      for (const maGV of selectedGiangVien) {
        await axios.put(
          `${API_URL}/giangvien/${maGV}/khoa`,
          { khoa: selectedKhoa },
          { headers: authHeader() }
        );
      }
      
      setShowPhanKhoaModal(false);
      setMessage(`Đã phân ${selectedGiangVien.length} giảng viên vào khoa ${khoaList.find(k => k.maKhoa === selectedKhoa)?.tenKhoa} thành công!`);
      setMessageType("success");
      fetchGiangVienList();
    } catch (error) {
      setMessage(error.response?.data?.message || "Đã có lỗi xảy ra khi phân khoa.");
      setMessageType("danger");
    }
  };

  return (
    <Container fluid>
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Quản lý giảng viên</h5>
          <div>
            <Button variant="warning" className="me-2" onClick={handleShowPhanKhoaModal}>
              <FontAwesomeIcon icon={faUniversity} /> Phân khoa
            </Button>
            <Button variant="info" onClick={handleShowStatsModal} id="giangvien-stats-btn">
              <FontAwesomeIcon icon={faChartBar} /> Báo cáo thống kê
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {message && (
            <Alert variant={messageType} onClose={() => setMessage("")} dismissible>
              {message}
            </Alert>
          )}
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-0">
                <div className="input-group">
                  <span className="input-group-text">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>
                  <Form.Control
                    type="text"
                    placeholder="Tìm kiếm theo mã GV, họ tên, email, khoa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>
          
          <div className="table-responsive">
            <Table striped hover className="align-middle">
              <thead>
                <tr>
                  <th>Mã GV</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Liên hệ</th>
                  <th>Giới tính</th>
                  <th>Khoa</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredGiangVien.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Không có giảng viên nào
                    </td>
                  </tr>
                ) : (
                  filteredGiangVien.map((giangVien) => (
                    <tr key={giangVien.maGV}>
                      <td>{giangVien.maGV}</td>
                      <td>{giangVien.hoTen}</td>
                      <td>{giangVien.email}</td>
                      <td>{giangVien.lienHe || "N/A"}</td>
                      <td>{renderGioiTinh(giangVien.gioiTinh)}</td>
                      <td>{giangVien.khoa}</td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleShowEditModal(giangVien)}>
                          <FontAwesomeIcon icon={faEdit} />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleShowDeleteConfirm(giangVien)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Modal Sửa giảng viên */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Sửa giảng viên {currentGiangVien?.hoTen}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mã giảng viên</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.maGV}
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Khoa <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="khoa"
                    value={formData.khoa}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Họ tên <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="hoTen"
                    value={formData.hoTen}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control
                    type="text"
                    name="lienHe"
                    value={formData.lienHe}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giới tính <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="gioiTinh"
                    value={formData.gioiTinh}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nu">Nữ</option>
                    <option value="KhongXacDinh">Không xác định</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Button variant="link" onClick={handleToggleTaiKhoanForm} className="p-0">
                    <FontAwesomeIcon icon={faKey} className="me-1" />
                    {showTaiKhoanForm ? "Ẩn cập nhật mật khẩu" : "Cập nhật mật khẩu"}
                  </Button>
                </Form.Group>
              </Col>
            </Row>

            {showTaiKhoanForm && (
              <Card className="mb-3 bg-light">
                <Card.Body>
                  <Card.Title className="fs-6">Cập nhật mật khẩu</Card.Title>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mật khẩu mới <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                        <Form.Text className="text-muted">
                          Để trống nếu không muốn thay đổi mật khẩu.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleUpdateGiangVien}>
            Cập nhật
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Xác nhận xóa */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa giảng viên <strong>{currentGiangVien?.hoTen}</strong>?</p>
          <p className="text-danger">Lưu ý: Hành động này không thể hoàn tác và sẽ xóa cả thông tin người dùng và tài khoản.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDeleteGiangVien}>
            Xóa giảng viên
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Thống kê giảng viên */}
      <Modal show={showStatsModal} onHide={() => setShowStatsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Báo cáo thống kê giảng viên</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {statsLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : statsData ? (
            <>
              <h5 className="mb-3">Thống kê tổng quát</h5>
              <Row className="mb-4">
                <Col md={4} className="text-center">
                  <Card className="h-100">
                    <Card.Body>
                      <h2 className="display-4">{statsData.totalLecturers}</h2>
                      <p className="text-muted">Tổng số giảng viên</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4} className="text-center">
                  <Card className="h-100 bg-success text-white">
                    <Card.Body>
                      <h2 className="display-4">{statsData.accountRegistration.registered}</h2>
                      <p>Đã đăng ký tài khoản</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4} className="text-center">
                  <Card className="h-100 bg-warning text-white">
                    <Card.Body>
                      <h2 className="display-4">{statsData.accountRegistration.unregistered}</h2>
                      <p>Chưa đăng ký tài khoản</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <h5 className="mb-3">Tỷ lệ đăng ký tài khoản</h5>
              <Card className="mb-4">
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <div>
                      <Badge bg="success" className="me-1">■</Badge> Đã đăng ký
                    </div>
                    <div>
                      <strong>{statsData.accountRegistration.registrationRate}%</strong>
                    </div>
                  </div>
                  <ProgressBar>
                    <ProgressBar 
                      variant="success" 
                      now={statsData.accountRegistration.registrationRate} 
                      key={1} 
                    />
                    <ProgressBar 
                      variant="warning" 
                      now={100 - statsData.accountRegistration.registrationRate} 
                      key={2} 
                    />
                  </ProgressBar>
                  <div className="d-flex justify-content-between mt-2">
                    <div>
                      <Badge bg="warning" className="me-1">■</Badge> Chưa đăng ký
                    </div>
                    <div>
                      <strong>{100 - statsData.accountRegistration.registrationRate}%</strong>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Row>
                <Col md={6}>
                  <h5 className="mb-3">Phân bố theo khoa</h5>
                  {statsData.topDepartments && statsData.topDepartments.length > 0 ? (
                    <Table striped bordered hover className="mb-4">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Khoa</th>
                          <th>Số lượng</th>
                          <th>Tỷ lệ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.topDepartments.map((dept, index) => (
                          <tr key={dept.name}>
                            <td>{index + 1}</td>
                            <td>{dept.name}</td>
                            <td className="text-center">
                              <Badge bg="primary" pill>
                                {dept.count}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div style={{ width: "50px" }}>{dept.percentage}%</div>
                                <ProgressBar 
                                  variant="primary" 
                                  now={dept.percentage} 
                                  style={{ height: "8px", width: "100%" }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">
                      Chưa có dữ liệu về phân bố theo khoa.
                    </Alert>
                  )}
                </Col>
                <Col md={6}>
                  <h5 className="mb-3">Phân bố theo giới tính</h5>
                  {statsData.byGender && Object.keys(statsData.byGender).length > 0 ? (
                    <Card className="mb-4">
                      <Card.Body>
                        {Object.entries(statsData.byGender).map(([gender, count]) => {
                          const percentage = Math.round((count / statsData.totalLecturers) * 100);
                          let variant, label;
                          
                          switch(gender) {
                            case "Nam":
                              variant = "primary";
                              label = "Nam";
                              break;
                            case "Nu":
                              variant = "danger";
                              label = "Nữ";
                              break;
                            default:
                              variant = "secondary";
                              label = "Khác";
                          }
                          
                          return (
                            <div key={gender} className="mb-3">
                              <div className="d-flex justify-content-between mb-1">
                                <div>
                                  <Badge bg={variant} className="me-1">■</Badge> {label}
                                </div>
                                <div>
                                  <strong>{count} ({percentage}%)</strong>
                                </div>
                              </div>
                              <ProgressBar 
                                variant={variant} 
                                now={percentage} 
                                style={{ height: "20px" }} 
                              />
                            </div>
                          );
                        })}
                      </Card.Body>
                    </Card>
                  ) : (
                    <Alert variant="info">
                      Chưa có dữ liệu về phân bố theo giới tính.
                    </Alert>
                  )}
                </Col>
              </Row>
            </>
          ) : (
            <Alert variant="warning">
              Không thể tải thống kê. Vui lòng thử lại sau.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatsModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Phân khoa */}
      <Modal show={showPhanKhoaModal} onHide={() => setShowPhanKhoaModal(false)} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Phân khoa cho giảng viên</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-4">
              <Form.Label>Chọn khoa <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={selectedKhoa}
                onChange={(e) => setSelectedKhoa(e.target.value)}
                required
              >
                <option value="">-- Chọn khoa --</option>
                {khoaList.map(khoa => (
                  <option key={khoa.maKhoa} value={khoa.maKhoa}>
                    {khoa.tenKhoa} ({khoa.maKhoa})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Danh sách giảng viên</h6>
                <Button 
                  variant="link" 
                  onClick={handleSelectAllGiangVien}
                  className="p-0"
                >
                  {selectedGiangVien.length === filteredGiangVien.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </Button>
              </div>
              
              {filteredGiangVien.length === 0 ? (
                <div className="text-center text-muted py-3">
                  Không có giảng viên nào
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}></th>
                        <th>Mã GV</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Khoa hiện tại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGiangVien.map(gv => (
                        <tr key={gv.maGV}>
                          <td>
                            <Form.Check
                              type="checkbox"
                              checked={selectedGiangVien.includes(gv.maGV)}
                              onChange={() => handleSelectGiangVien(gv.maGV)}
                            />
                          </td>
                          <td>{gv.maGV}</td>
                          <td>{gv.hoTen}</td>
                          <td>{gv.email}</td>
                          <td>{gv.khoa || <Badge bg="warning">Chưa phân khoa</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPhanKhoaModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handlePhanKhoa} disabled={!selectedKhoa || selectedGiangVien.length === 0}>
            Phân khoa cho {selectedGiangVien.length} giảng viên
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default GiangVienManager; 