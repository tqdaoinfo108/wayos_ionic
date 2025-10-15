export const getWorkflowStatusLabel = (statusID: number): string => {
  switch (statusID) {
    case -1:
      return 'Huỷ';
    case 0:
      return 'Đang xử lý';
    case 100:
      return 'Hoàn thành';
    case 200:
      return 'Không duyệt';
    default:
      return 'Không rõ';
  }
};

export const getWorkflowStatusColor = (statusID: number): string => {
  switch (statusID) {
    case 100:
      return 'var(--ion-color-success)';
    case 200:
      return 'var(--ion-color-danger)';
    case 0:
    case 2:
      return 'var(--ion-color-primary)';
    default:
      return 'var(--ion-color-medium)';
  }
};

export const getWorkHandlingStatusLabel = (statusID: number): string => {
  switch (statusID) {
    case -100:
      return 'Cần xử lý';
    case -10:
      return 'Đã gửi';
    case 0:
      return 'Đang chờ';
    case 1:
      return 'Đang xử lý';
    case 2:
      return 'Hoàn thành';
    default:
      return 'Không rõ';
  }
};

export const getWorkHandlingStatusColor = (statusID: number): string => {
  switch (statusID) {
    case 2:
      return 'var(--ion-color-success)';
    case 0:
    case 1:
      return 'var(--ion-color-primary)';
    default:
      return 'var(--ion-color-medium)';
  }
};

export const getPriorityLabel = (priorityID: number): string => {
  switch (priorityID) {
    case 1:
      return 'Thấp';
    case 2:
      return 'Trung bình';
    case 3:
      return 'Cao';
    default:
      return 'Không rõ';
  }
};
