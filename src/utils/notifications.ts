export const showSuccessNotification = async (message: string) => {
  await window.electronAPI.showSystemNotification("Success", message);
};

export const showErrorNotification = (message: string) => {
  alert(`❌ ${message}`);
};
