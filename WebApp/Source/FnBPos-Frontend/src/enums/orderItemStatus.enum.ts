export const EOrderItemStatus = {
  Pending: { value: 0, label: 'Chờ duyệt' },
  Approved: { value: 1, label: 'Đã duyệt' },
  Rejected: { value: 2, label: 'Từ chối' },
  Canceled: { value: 3, label: 'Đã hủy' },
  Delete: { value: 4, label: 'Đã xóa' },
} as const;
