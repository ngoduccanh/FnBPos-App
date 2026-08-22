
export const EObjectType = {
  Undefined: 0,
  Store: 1,                 // Cửa Hàng
  Product: 2,               // Sản Phẩm
  User: 3,                  // Người Dùng
  Customer: 4,              // Khách Hàng
  Supplier: 5,              // Nhà Cung Cấp
  Adviser: 6,               // Tư Vấn Viên
  Staff: 7,                 // Nhân Viên
  OrderingObject: 8,        // Đặt Hàng
  Transportation: 9,        // Vận Chuyển
  Facility: 10,             // Cơ Sở Vật Chất
  Diagnose: 11,             // Chẩn Đoán
  OrderingSupplier: 12,     // Nhà CC Đặt Hàng
  OrderingSuperviser: 13,   // Giám Sát Đặt Hàng
  Clinic: 14,               // Phòng Khám

  UndefinedGroup: 50,
  UserGroup: 51,            // Nhóm Người Dùng
  CustomerGroup: 52,        // Nhóm Khách Hàng
  SupplierGroup: 53,        // Nhóm Nhà CC
  AdviserGroup: 54,         // Nhóm Tư Vấn
  StaffGroup: 55,           // Nhóm Nhân Viên
  ProductGroup: 56,         // Nhóm Sản Phẩm
  Unit: 57,                 // Đơn Vị
  CusClassification: 58,    // Phân Loại KH
  StoreClassification: 59,  // Phân Loại CH
  ReceiptOrderStatus: 60,   // Trạng Thái Nhập
  DeliveryOrderStatus: 61,  // Trạng Thái Xuất
  PaymentType: 62,          // Loại Thanh Toán
  CustomerCareStatus: 63,   // Trạng Thái CSKH
  ExpressServices: 64,      // Dịch Vụ Giao Nhanh
  Room: 65,                 // Phòng
  InfoInvest: 66,           // TT Đầu Tư
  Usage: 67,                // Cách dùng
  Table: 68,                // Bàn
  Advice: 69,               // Lời dặn
  CustomPrice: 70,          // Tùy biến giá bán
  TableArea: 71,            // Phân Khu Bàn

  ReceiptNote: 200,         // Phiếu Nhập
  DeliveryNote: 201,        // Phiếu Xuất
  ProductAndSampleNote: 202,// Sản Phẩm & Đơn Mẫu
  CustomerService: 203,     // DV Khách Hàng
  RegistrationFrom: 204,    // Thông tin ĐK

  Regions: 301,             // Vùng Miền
  Cities: 302,              // Thành Phố
  Wards: 303,               // Quận Huyện
  IDC10: 304,               // IDC 10
  OrderStoreMapping: 305,   // TL Cửa Hàng Đặt Hàng

  StoreHealthAuthority: 400,// Cửa hàng của Sở Y Tế
  Practitioner: 401         // Người hành nghề
} as const;

export type EObjectType = (typeof EObjectType)[keyof typeof EObjectType];

export const EObjectParentType = {
  DbObject: 0,
  DeliveryNote: 1,
  ReceiptNote: 2
} as const;

export type EObjectParentType = (typeof EObjectParentType)[keyof typeof EObjectParentType];
