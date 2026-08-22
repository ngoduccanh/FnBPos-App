export const PERMISSIONS = {
  // 1. Quản lý Khách hàng (Customer)
  CUSTOMER: 'customer',
  CUSTOMER_READ: 'customer_Read',
  CUSTOMER_CREATE: 'customer_Create',
  CUSTOMER_WRITE: 'customer_Write',
  CUSTOMER_DELETE: 'customer_Delete',
  CUSTOMER_IMPORT: 'customer_Import',
  CUSTOMER_EXPORT: 'customer_Export',

  // 2. Nhà cung cấp (Supplier)
  SUPPLIER: 'supplier',
  SUPPLIER_READ: 'supplier_Read',
  SUPPLIER_CREATE: 'supplier_Create',
  SUPPLIER_WRITE: 'supplier_Write',
  SUPPLIER_DELETE: 'supplier_Delete',
  SUPPLIER_IMPORT: 'supplier_Import',
  SUPPLIER_EXPORT: 'supplier_Export',

  // 3. Người tư vấn / Nhân viên (Adviser)
  ADVISER: 'adviser',
  ADVISER_READ: 'adviser_Read',
  ADVISER_CREATE: 'adviser_Create',
  ADVISER_WRITE: 'adviser_Write',
  ADVISER_DELETE: 'adviser_Delete',
  ADVISER_IMPORT: 'adviser_Import',
  ADVISER_EXPORT: 'adviser_Export',

  // 4. Vận chuyển / Vận đơn (Transportation)
  TRANSPORTATION: 'transportation',
  TRANSPORTATION_READ: 'transportation_Read',
  TRANSPORTATION_CREATE: 'transportation_Create',
  TRANSPORTATION_WRITE: 'transportation_Write',
  TRANSPORTATION_DELETE: 'transportation_Delete',
  TRANSPORTATION_IMPORT: 'transportation_Import',
  TRANSPORTATION_EXPORT: 'transportation_Export',

  // 5. Sản phẩm & Món ăn (Product)
  PRODUCT: 'product',
  PRODUCT_READ: 'product_Read',
  PRODUCT_CREATE: 'product_Create',
  PRODUCT_WRITE: 'product_Write',
  PRODUCT_DELETE: 'product_Delete',
  PRODUCT_VIEW_INPUT_PRICE: 'product_ViewInputPrice',
  PRODUCT_EXPORT: 'product_Export',
  PRODUCT_IMPORT: 'product_Import',
  PRODUCT_MAKE_PLANNING: 'product_MakePlanning',
  PRODUCT_VIEW_INVENTORY: 'product_ViewInventory',
  PRODUCT_UPLOAD_IMAGE: 'product_UploadImage',
  PRODUCT_VIEW_TRANS_HISTORY: 'product_ViewTransHistory',
  PRODUCT_INVENTORY_WAREHOUSE: 'product_InventoryWarehouse',


  // 7. Bán hàng & Đơn hàng POS (Order)
  ORDER: 'order',
  ORDER_READ: 'order_Read',
  ORDER_CREATE: 'order_Create',
  ORDER_WRITE: 'order_Write',
  ORDER_DELETE: 'order_Delete',
  ORDER_PRINT: 'order_Print',
  ORDER_CANCEL: 'order_Cancel',
  ORDER_SEND: 'order_Send',
  ORDER_APPROVAL: 'order_Approval',
  ORDER_HANDLING: 'order_Handling',
  ORDER_DELIVERY: 'order_Delivery',
  ORDER_FINISH: 'order_Finish',
  ORDER_SEARCH_PRODUCTS: 'order_SearchProducts',
  ORDER_CUSTOMER_LISTING: 'order_CustomerListing',
  ORDER_EXPORT: 'order_Export',
  ORDER_EDIT_PRICE: 'order_EditPrice',
  ORDER_EDIT_QUANTITY: 'order_EditQuantity',

  // 8. Phiếu Kiểm kho & Nhập xuất kho (Inventory & Notes)
  INVENTORY_NOTE: 'inventoryNote',
  INVENTORY_NOTE_READ: 'inventoryNote_Read',
  INVENTORY_NOTE_CREATE: 'inventoryNote_Create',
  INVENTORY_NOTE_WRITE: 'inventoryNote_Write',
  INVENTORY_NOTE_DELETE: 'inventoryNote_Delete',
  INVENTORY_NOTE_PRINT: 'inventoryNote_Print',

  DELIVERY_NOTE: 'deliveryNote',
  DELIVERY_NOTE_READ: 'deliveryNote_Read',
  DELIVERY_NOTE_CREATE: 'deliveryNote_Create',
  DELIVERY_NOTE_WRITE: 'deliveryNote_Write',
  DELIVERY_NOTE_DELETE: 'deliveryNote_Delete',
  DELIVERY_NOTE_PRINT: 'deliveryNote_Print',
  DELIVERY_NOTE_RESTORE: 'deliveryNote_Restore',
  DELIVERY_NOTE_IMPORT_EXCEL: 'deliveryNote_ImportExcel',

  RECEIPT_NOTE: 'receiptNote',
  RECEIPT_NOTE_READ: 'receiptNote_Read',
  RECEIPT_NOTE_CREATE: 'receiptNote_Create',
  RECEIPT_NOTE_WRITE: 'receiptNote_Write',
  RECEIPT_NOTE_DELETE: 'receiptNote_Delete',
  RECEIPT_NOTE_PRINT: 'receiptNote_Print',
  RECEIPT_NOTE_RESTORE: 'receiptNote_Restore',
  RECEIPT_NOTE_IMPORT_EXCEL: 'receiptNote_ImportExcel',

  TRANS_WAREHOUSE: 'transWarehouse',
  IN_OUT_COMING_NOTE: 'inOutComingNote',
  IN_OUT_COMING_NOTE_READ: 'inOutComingNote_Read',
  IN_OUT_COMING_NOTE_CREATE: 'inOutComingNote_Create',
  IN_OUT_COMING_NOTE_WRITE: 'inOutComingNote_Write',
  IN_OUT_COMING_NOTE_DELETE: 'inOutComingNote_Delete',
  IN_OUT_COMING_NOTE_PRINT: 'inOutComingNote_Print',
  IN_OUT_COMING_NOTE_RESTORE: 'inOutComingNote_Restore',
  IN_OUT_COMING_NOTE_IMPORT: 'inOutComingNote_Import',

  // 9. Nội bộ & Chấm công (Internal)
  INTERNAL: 'internal',
  INTERNAL_STAFF_TIMEKEEPING_NOTE: 'internal_StaffTimekeepingNote',
  INTERNAL_CUS_SERVICE_NOTE: 'internal_CusServiceNote',
  INTERNAL_DELIVERY_NOTE: 'internal_DeliveryNote',
  INTERNAL_TIMEKEEPING: 'internal_Timekeeping',
  NOTE_LISTING: 'noteListing',


  // 11. Báo cáo thống kê (Reports)
  REPORT_SYNTHESIS: 'report_Synthesis',
  REPORT_STAFF: 'report_Staff',
  REPORT_SUPPLIER: 'report_Supplier',
  REPORT_CUSTOMER: 'report_Customer',
  REPORT_ADVISER: 'report_Adviser',
  REPORT_PRODUCTS: 'report_Products',
  REPORT_WAREHOUSE: 'report_Warehouse',
  REPORT_REVENUE_BY_DAY: 'report_Revenue_By_Day',
  REPORT_INVENTORY_WAREHOUSE: 'report_InventoryWarehouse',
  REPORT_VIEW_PROFIT: 'report_ViewProfit',
  REPORT_CUSTOMER_SCORE: 'report_CustomerScore',
  REPORT_VIEW_ALL_TRANSACTIONS: 'report_ViewAllTransactions',


} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];
