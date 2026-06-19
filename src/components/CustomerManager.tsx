import React, { useState, useMemo, useEffect } from 'react';
import { Customer } from '../types';
import { Search, Plus, Trash2, Edit2, Shield, User, Heart, AlertTriangle, Phone, Globe, MapPin, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer?: (id: string) => void;
}

export default function CustomerManager({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer
}: CustomerManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    idNumber: '',
    trustLevel: 'High' as Customer['trustLevel'],
    notes: ''
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const query = searchQuery.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.idNumber && c.idNumber.toLowerCase().includes(query))
      );
    });
  }, [customers, searchQuery]);

  // Pagination Configuration
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const handleOpenAddModal = () => {
    setFormState({
      name: '',
      phone: '',
      email: '',
      address: '',
      idNumber: '',
      trustLevel: 'High',
      notes: ''
    });
    setEditingCustomer(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setFormState({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
      idNumber: c.idNumber || '',
      trustLevel: c.trustLevel,
      notes: c.notes || ''
    });
    setEditingCustomer(c);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.phone) {
      setValidationError('Vui lòng điền đầy đủ Tên và Số điện thoại khách hàng!');
      return;
    }

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        ...formState
      });
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        rentalCount: 0,
        ...formState
      };
      onAddCustomer(newCust);
    }
    setShowAddModal(false);
    setValidationError(null);
  };

  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) {
      return;
    }

    const BOM = '\uFEFF';
    const headers = [
      'ID Khách Hàng',
      'Họ Và Tên',
      'Số Điện Thoại',
      'Trang liên kết / Website',
      'Địa Chỉ',
      'Số Giấy Tờ (CCCD/ID)',
      'Hạng Tin Cậy',
      'Số Lần Thuê Máy',
      'Ghi Chú Chi Tiết',
      'Tổng Doanh Số Tích Lũy (VND)',
      'Ngày Khởi Tạo'
    ];

    const rows = filteredCustomers.map(c => {
      let trustVN = 'Cao';
      if (c.trustLevel === 'Medium') trustVN = 'Trung bình';
      else if (c.trustLevel === 'Low') trustVN = 'Cảnh báo rủi ro';

      return [
        c.id,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.phone.replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        `"${(c.idNumber || '').replace(/"/g, '""')}"`,
        trustVN,
        c.rentalCount,
        `"${(c.notes || '').replace(/"/g, '""')}"`,
        c.totalSpent || 0,
        c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : ''
      ];
    });

    const csvContent = BOM + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_khach_hang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <User className="text-orange-600" /> Quản Lý Khách Hàng Thuê Máy
            </h2>
            <p className="text-sm text-gray-500">
              Tra cứu hồ sơ khách hàng, xếp hạng độ tin cậy để quyết định mức độ thế chấp hoặc cọc thế chấp.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start md:self-auto">
            <button
              onClick={handleExportCSV}
              className="bg-slate-50 border border-gray-205 text-gray-700 font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-slate-100 hover:text-gray-900 transition-colors cursor-pointer"
              title="Xuất định dạng CSV tải về"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Xuất danh sách CSV
            </button>
            <button
              onClick={handleOpenAddModal}
              className="bg-orange-600 text-white font-medium px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-orange-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm khách hàng mới
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, số CCCD, trang liên kết..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedCustomers.map(cust => (
          <div key={cust.id} className="bg-white border border-gray-150/70 rounded-xl p-4 shadow-2xs space-y-3 flex flex-col justify-between hover:shadow-sm transition-all hover:border-gray-300">
            <div className="space-y-2.5">
              <div className="flex justify-between items-start gap-1">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 truncate" title={cust.name}>
                    {cust.name}
                  </h3>
                  
                  {/* Trust Level Indicator badge */}
                  <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full mt-1 border ${
                    cust.trustLevel === 'High' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    cust.trustLevel === 'Medium' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    <Shield className="w-2.5 h-2.5" />
                    {cust.trustLevel === 'High' ? 'Cao' : cust.trustLevel === 'Medium' ? 'Trung bình' : 'Nguy cơ'}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200/50 px-2 py-0.5 rounded-lg inline-block">
                    ⏱ {cust.rentalCount} Đơn
                  </span>
                </div>
              </div>

              {/* Personal contact parameters list */}
              <div className="space-y-1.5 text-xs text-gray-655 border-t border-gray-100 pt-2.5">
                <div className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="text-gray-800 font-bold">{cust.phone}</span>
                </div>

                {cust.email && (
                  <div className="flex items-center gap-1.5 truncate" title={cust.email}>
                    <Globe className="w-3 h-3 text-gray-400 shrink-0" />
                    <a 
                      href={cust.email.startsWith('http://') || cust.email.startsWith('https://') ? cust.email : `https://${cust.email}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="truncate text-orange-600 hover:text-orange-700 hover:underline font-medium transition-colors"
                    >
                      {cust.email}
                    </a>
                  </div>
                )}

                {cust.idNumber && (
                  <div className="flex items-center gap-1.5 font-mono text-[11px] truncate">
                    <span className="font-sans font-bold text-gray-400">CCCD:</span>
                    <span className="truncate">{cust.idNumber}</span>
                  </div>
                )}

                {cust.address && (
                  <div className="flex items-start gap-1.5 text-[11px]">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                    <span className="truncate" title={cust.address}>{cust.address}</span>
                  </div>
                )}
              </div>

              {cust.notes && (
                <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-150/50 text-[11px] text-amber-900 font-mono leading-relaxed max-h-[60px] overflow-y-auto" title={cust.notes}>
                  ✏️ {cust.notes}
                </div>
              )}
            </div>

            {/* Actions panel */}
            <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between gap-1 text-[11px]">
              <button
                onClick={() => handleOpenEditModal(cust)}
                className="text-orange-600 hover:text-white border border-orange-200 hover:bg-orange-600 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer text-center shrink-0"
              >
                Sửa hồ sơ
              </button>

              {onDeleteCustomer && (
                <button
                  onClick={() => {
                    setDeleteConfirmId(cust.id);
                  }}
                  className="text-gray-400 hover:text-rose-650 p-1.5 hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0"
                  title="Xóa khách hàng"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full bg-white border border-gray-150 p-12 text-center rounded-2xl text-gray-400 italic font-medium">
            Không tìm thấy hồ sơ khách hàng nào phù hợp với từ khóa này.
          </div>
        )}
      </div>

      {/* Pagination controls for customers */}
      {totalPages > 1 && (
        <div className="bg-white border border-gray-150 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs select-none">
          <span className="text-xs text-gray-500 font-medium">
            Hiển thị từ <span className="font-bold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> tới <span className="font-bold text-gray-800">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> trong tổng số <span className="font-bold text-gray-800">{filteredCustomers.length}</span> hồ sơ khách hàng
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentPage === page
                    ? 'bg-orange-600 border border-orange-600 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Customer Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden self-center border border-gray-100 animate-scale-up">
            <div className="bg-orange-600 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <User className="w-5 h-5" /> {editingCustomer ? 'Sửa Hồ Sơ Khách Hàng' : 'Tạo Hồ Sơ Khách Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white hover:text-gray-200 font-bold text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {validationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span>⚠</span> {validationError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên khách hàng *</label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={e => setFormState({ ...formState, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="VD: Nguyễn Văn Hải"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại liên hệ *</label>
                  <input
                    type="tel"
                    required
                    value={formState.phone}
                    onChange={e => setFormState({ ...formState, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="VD: 0912345678"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Số định danh CCCD/Hộ chiếu</label>
                  <input
                    type="text"
                    value={formState.idNumber}
                    onChange={e => setFormState({ ...formState, idNumber: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="VD: 001095034..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Trang cá nhân / Website (Mạng xã hội)</label>
                <input
                  type="text"
                  value={formState.email}
                  onChange={e => setFormState({ ...formState, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="VD: facebook.com/fullname hoặc website.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ thường trú / tạm trú</label>
                <input
                  type="text"
                  value={formState.address}
                  onChange={e => setFormState({ ...formState, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="VD: Số 12, ngõ 80 Cầu Giấy, Hà Nội"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Đánh giá tín cậy hệ thống</label>
                <select
                  value={formState.trustLevel}
                  onChange={e => setFormState({ ...formState, trustLevel: e.target.value as any })}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-medium text-gray-750"
                >
                  <option value="High">Tin cậy cao (Không yêu cầu đặt cọc tiền mặt lớn)</option>
                  <option value="Medium">Trung bình (Có giữ CCCD + Giấy tờ gốc bảo hiểm)</option>
                  <option value="Low">Mức nguy cơ (Yêu cầu giữ tài sản xe máy + cọc tiền mặt cao)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nhật ký hoạt động / Lưu ý nghiệp vụ</label>
                <textarea
                  value={formState.notes}
                  onChange={e => setFormState({ ...formState, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono text-xs"
                  placeholder="Ví dụ: Khách hàng quen thích lấy máy sớm lúc 7h sáng, giữ máy cẩn thận."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-650 hover:bg-gray-105 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-orange-600 text-white font-medium px-5 py-2 rounded-xl text-sm hover:bg-orange-700 transition-all cursor-pointer"
                >
                  {editingCustomer ? 'Cập nhật hồ sơ' : 'Thêm khách hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-scale-up border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-655">
              <span className="p-2 bg-red-50 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-600" />
              </span>
              <h3 className="font-bold text-lg text-gray-900">Xóa hồ sơ khách hàng</h3>
            </div>
            
            <p className="text-sm text-gray-500">
              Bạn có chắc chắn muốn xóa hồ sơ của khách hàng <strong>{customers.find(c => c.id === deleteConfirmId)?.name}</strong>? Toàn bộ lịch sử đặt lịch sẽ bị mất kết nối và không thể khôi phục.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-650 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteCustomer) {
                    onDeleteCustomer(deleteConfirmId);
                  }
                  setDeleteConfirmId(null);
                }}
                className="bg-red-600 text-white font-medium px-5 py-2 rounded-xl text-sm hover:bg-red-700 transition-all cursor-pointer"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
